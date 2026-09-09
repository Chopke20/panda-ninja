import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppState,
  DayException,
  Kid,
  PandaAppearance,
  RoutineId,
  Settings,
  Task,
  UiScreen,
} from '../types';
import { BONUS, DEFAULT_PIN, SCHEMA_VERSION, SCHOOL_DAYS, STORAGE_KEY } from '../lib/constants';
import { mergePersistedSlice, normalizeSettings, validateAppState } from '../lib/backup';
import { applyDayRollover, isMutedToday } from '../lib/day';
import {
  emptyDayException,
  getDayException,
  isFreeDay,
  trimDayExceptions,
  upsertDayException,
} from '../lib/dayExceptions';
import { clearChromaCache } from '../lib/pandaChroma';
import { createDebouncedStorage, flushPersistWrites } from '../lib/persistStorage';
import { applyTaskToggle, settleStreaks, type PointFlight, type ToggleMode } from '../lib/scoring';
import {
  approvePurchase,
  cancelPurchase,
  createPurchaseRequest,
  ensureWeeklyClaims,
  expireStaleRequests,
  redeemWeeklyClaim,
  rejectPurchase,
  refundPurchase,
  settleYesterdayEarns,
  syncKidsDisplay,
  zeroKidWallet,
  adjustKidWallet,
} from '../lib/shop';
import { snapshotTasks, tasksForToday, moveTaskInRoutine } from '../lib/tasks';
import { todayIso, weekdayFromIso } from '../lib/time';
import { ownedFromAppearance } from '../lib/wallet';
import { makeDefaultState } from './defaults';

export type UiFlight = PointFlight & { id: string };

type Store = AppState & {
  uiScreen: UiScreen;
  mutedToday: boolean;
  mutedDate: string | null;
  playedWarnings: number[];
  summaryDismissedDate: string | null;
  flights: UiFlight[];
  pandaPulse: Record<string, number>;
  _hasHydrated: boolean;
  lastBackupAt: string | null;
  onboardingDone: boolean;
  setUiScreen: (screen: UiScreen) => void;
  toggleMuteToday: () => void;
  ensureToday: (nowMs: number) => void;
  toggleTask: (kidId: string, taskId: string, mode: ToggleMode, nowMs: number) => {
    ownJustCompleted: boolean;
    bothJustCompleted: boolean;
  } | null;
  dismissFlight: (id: string) => void;
  updateKidName: (kidId: string, name: string) => void;
  updateKidPanda: (kidId: string, panda: Partial<PandaAppearance>) => void;
  equipCosmetic: (kidId: string, itemId: string) => void;
  unequipCosmetic: (kidId: string, slot?: 'head' | 'back' | 'belt' | 'aura' | 'outfitPattern') => void;
  resetKidPoints: (kidId: string) => void;
  adjustKidPoints: (kidId: string, amount: number) => void;
  addTask: (kidId: string, routineId?: RoutineId) => void;
  updateTask: (kidId: string, taskId: string, patch: Partial<Task>) => void;
  removeTask: (kidId: string, taskId: string) => void;
  moveTask: (kidId: string, taskId: string, direction: 'up' | 'down') => void;
  copyTasksToOther: (fromKidId: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  importState: (state: AppState) => void;
  markWarningPlayed: (mark: number) => void;
  dismissSummary: () => void;
  setHasHydrated: (value: boolean) => void;
  markBackupDone: () => void;
  requestPurchase: (kidId: string, itemId: string) => string | null;
  cancelPurchaseRequest: (requestId: string) => void;
  approvePurchaseRequest: (requestId: string) => string | null;
  rejectPurchaseRequest: (requestId: string) => void;
  refundPurchaseRequest: (requestId: string) => string | null;
  markWeeklyRedeemed: (kidId: string, weekStart: string) => void;
  setTodayException: (patch: Partial<Omit<DayException, 'date'>>) => void;
  completeOnboarding: () => void;
  /** Kasuje tylko dane tej apki (localStorage pandaninja.v1) i wraca do onboardingu. */
  factoryReset: () => void;
};

function mapKid(kids: [Kid, Kid], kidId: string, fn: (kid: Kid) => Kid): [Kid, Kid] {
  return kids.map((kid) => (kid.id === kidId ? fn(kid) : kid)) as [Kid, Kid];
}

function newTaskId(kidId: string): string {
  return `${kidId}-task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

let flightSeq = 0;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...makeDefaultState(),
      uiScreen: 'start',
      mutedToday: false,
      mutedDate: null,
      playedWarnings: [],
      summaryDismissedDate: null,
      flights: [],
      pandaPulse: {},
      _hasHydrated: false,
      lastBackupAt: null,
      onboardingDone: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      markBackupDone: () => set({ lastBackupAt: new Date().toISOString() }),
      setUiScreen: (screen) => set({ uiScreen: screen }),
      toggleMuteToday: () => {
        const today = todayIso(new Date());
        const current = get();
        const muted = isMutedToday(current.mutedToday, current.mutedDate, today);
        set({ mutedToday: !muted, mutedDate: today });
      },
      ensureToday: (nowMs) => {
        const today = todayIso(new Date(nowMs));
        const weekday = weekdayFromIso(today);
        const current = get();
        const free = isFreeDay(current.dayExceptions, today);
        const slice = {
          logs: current.logs,
          kids: current.kids,
          mutedToday: current.mutedToday,
          mutedDate: current.mutedDate,
          playedWarnings: current.playedWarnings,
        };
        const next = applyDayRollover(slice, today, (kidId, routineId) => {
          if (free) return [];
          const kid = current.kids.find((item) => item.id === kidId);
          return kid ? snapshotTasks(tasksForToday(kid, weekday, routineId)) : [];
        });
        const dateChanged = current.mutedDate !== today;
        let kids = dateChanged
          ? settleStreaks(next.kids, next.logs, today, current.dayExceptions)
          : next.kids;
        let transactions = current.transactions;
        let purchaseRequests = expireStaleRequests(current.purchaseRequests, nowMs);
        let weeklyClaims = current.weeklyClaims;
        let dayExceptions = trimDayExceptions(current.dayExceptions, today);

        if (dateChanged) {
          const settled = settleYesterdayEarns(
            next.logs,
            transactions,
            kids,
            today,
            new Date(nowMs).toISOString(),
          );
          transactions = settled.transactions;
          kids = settled.kids;
        }

        weeklyClaims = ensureWeeklyClaims({
          claims: weeklyClaims,
          logs: next.logs,
          kids,
          weekly: current.settings.weeklyReward,
          now: new Date(nowMs),
        });

        if (
          next === slice &&
          kids === current.kids &&
          transactions === current.transactions &&
          purchaseRequests === current.purchaseRequests &&
          weeklyClaims === current.weeklyClaims &&
          dayExceptions === current.dayExceptions
        ) {
          return;
        }
        set({
          logs: next.logs,
          kids,
          transactions,
          purchaseRequests,
          weeklyClaims,
          dayExceptions,
          mutedToday: next.mutedToday,
          mutedDate: next.mutedDate,
          playedWarnings: next.playedWarnings,
        });
      },
      toggleTask: (kidId, taskId, mode, nowMs) => {
        const current = get();
        const result = applyTaskToggle({
          kids: current.kids,
          logs: current.logs,
          settings: current.settings,
          kidId,
          taskId,
          now: new Date(nowMs),
          mode,
          dayExceptions: current.dayExceptions,
          routineId: current.settings.activeRoutine ?? 'morning',
        });
        if (!result) return null;
        const flights: UiFlight[] = [
          ...current.flights,
          ...result.flights.map((fly) => {
            flightSeq += 1;
            return { ...fly, id: `fly-${flightSeq}` };
          }),
        ];
        const pandaPulse = { ...current.pandaPulse };
        if (mode === 'complete') {
          pandaPulse[kidId] = (pandaPulse[kidId] ?? 0) + 1;
        }
        const weeklyClaims = ensureWeeklyClaims({
          claims: current.weeklyClaims,
          logs: result.logs,
          kids: result.kids,
          weekly: current.settings.weeklyReward,
          now: new Date(nowMs),
        });
        set({
          kids: result.kids,
          logs: result.logs,
          flights,
          pandaPulse,
          weeklyClaims,
        });
        return {
          ownJustCompleted: result.ownJustCompleted,
          bothJustCompleted: result.bothJustCompleted,
        };
      },
      dismissFlight: (id) => {
        set({ flights: get().flights.filter((fly) => fly.id !== id) });
      },
      updateKidName: (kidId, name) => {
        const trimmed = name.trim().slice(0, 24);
        if (!trimmed) return;
        set({ kids: mapKid(get().kids, kidId, (kid) => ({ ...kid, name: trimmed })) });
      },
      updateKidPanda: (kidId, panda) => {
        set({
          kids: mapKid(get().kids, kidId, (kid) => {
            const nextPanda = { ...kid.panda, ...panda };
            const idsToOwn = ownedFromAppearance(nextPanda);
            return {
              ...kid,
              panda: nextPanda,
              inventory: [...new Set([...kid.inventory, ...idsToOwn])],
            };
          }),
        });
      },
      equipCosmetic: (kidId, itemId) => {
        // Kosmetyki warstwowe usunięte — tylko logo z listy starterów.
        if (!itemId.startsWith('logo-')) return;
        set({
          kids: mapKid(get().kids, kidId, (kid) => ({
            ...kid,
            panda: { ...kid.panda, logoId: itemId },
            inventory: [...new Set([...kid.inventory, itemId])],
          })),
        });
      },
      unequipCosmetic: () => {
        // Brak slotów do zdejmowania w modelu ewolucji.
      },
      resetKidPoints: (kidId) => {
        const nowIso = new Date().toISOString();
        const transactions = zeroKidWallet(kidId, get().transactions, nowIso);
        const today = todayIso();
        set({
          transactions,
          kids: syncKidsDisplay(
            mapKid(get().kids, kidId, (kid) => kid),
            transactions,
            get().logs,
            today,
          ),
        });
      },
      adjustKidPoints: (kidId, amount) => {
        const nowIso = new Date().toISOString();
        const transactions = adjustKidWallet(
          kidId,
          get().transactions,
          amount,
          nowIso,
        );
        const today = todayIso();
        set({
          transactions,
          kids: syncKidsDisplay(
            mapKid(get().kids, kidId, (kid) => kid),
            transactions,
            get().logs,
            today,
          ),
        });
      },
      addTask: (kidId, routineId) => {
        set({
          kids: mapKid(get().kids, kidId, (kid) => {
            const routine = routineId ?? get().settings.activeRoutine ?? 'morning';
            const inRoutine = kid.tasks.filter((t) => (t.routine ?? 'morning') === routine);
            const order =
              inRoutine.length === 0 ? 0 : Math.max(...inRoutine.map((t) => t.order)) + 1;
            const task: Task = {
              id: newTaskId(kidId),
              label: 'Nowe zadanie',
              icon: 'bed',
              points: BONUS.defaultTaskPoints,
              order,
              days: [...SCHOOL_DAYS],
              enabled: true,
              routine,
              timerSec: null,
            };
            return { ...kid, tasks: [...kid.tasks, task] };
          }),
        });
      },
      updateTask: (kidId, taskId, patch) => {
        set({
          kids: mapKid(get().kids, kidId, (kid) => ({
            ...kid,
            tasks: kid.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
          })),
        });
      },
      removeTask: (kidId, taskId) => {
        set({
          kids: mapKid(get().kids, kidId, (kid) => ({
            ...kid,
            tasks: kid.tasks.filter((task) => task.id !== taskId),
          })),
        });
      },
      moveTask: (kidId, taskId, direction) => {
        set({
          kids: mapKid(get().kids, kidId, (kid) => ({
            ...kid,
            tasks: moveTaskInRoutine(kid.tasks, taskId, direction),
          })),
        });
      },
      copyTasksToOther: (fromKidId) => {
        const kids = get().kids;
        const from = kids.find((kid) => kid.id === fromKidId);
        const to = kids.find((kid) => kid.id !== fromKidId);
        if (!from || !to) return;
        const copied: Task[] = [...from.tasks]
          .sort((a, b) => a.order - b.order)
          .map((task, index) => ({
            ...task,
            id: newTaskId(to.id),
            order: index,
          }));
        set({ kids: mapKid(kids, to.id, (kid) => ({ ...kid, tasks: copied })) });
      },
      patchSettings: (patch) => {
        set({ settings: normalizeSettings({ ...get().settings, ...patch }) });
      },
      importState: (state) => {
        const validated = validateAppState(state) ?? state;
        set({
          kids: validated.kids,
          settings: normalizeSettings(validated.settings),
          logs: validated.logs,
          transactions: validated.transactions,
          purchaseRequests: validated.purchaseRequests,
          weeklyClaims: validated.weeklyClaims,
          dayExceptions: validated.dayExceptions,
          version: SCHEMA_VERSION,
          mutedToday: false,
          mutedDate: null,
          playedWarnings: [],
          summaryDismissedDate: null,
          flights: [],
          pandaPulse: {},
          uiScreen: 'main',
          lastBackupAt: null,
          onboardingDone: true,
        });
        get().ensureToday(Date.now());
      },
      markWarningPlayed: (mark) => {
        const played = get().playedWarnings;
        if (played.includes(mark)) return;
        set({ playedWarnings: [...played, mark] });
      },
      dismissSummary: () => {
        set({ summaryDismissedDate: todayIso(new Date()), uiScreen: 'main' });
      },
      requestPurchase: (kidId, itemId) => {
        const current = get();
        const kid = current.kids.find((item) => item.id === kidId);
        if (!kid) return 'Nie znaleziono dziecka.';
        const created = createPurchaseRequest({
          transactions: current.transactions,
          requests: current.purchaseRequests,
          inventory: kid.inventory,
          kidId,
          itemId,
          currentStage: kid.panda.stage,
          body: kid.panda.body,
        });
        if (!created.ok) return created.reason;
        // Awans od razu — bez zatwierdzania przez rodzica.
        const result = approvePurchase({
          request: created.request,
          transactions: current.transactions,
          kids: current.kids,
        });
        if (!result.ok) return result.reason;
        const today = todayIso();
        const pandaPulse = { ...current.pandaPulse };
        pandaPulse[kidId] = (pandaPulse[kidId] ?? 0) + 1;
        set({
          transactions: result.transactions,
          kids: syncKidsDisplay(result.kids, result.transactions, current.logs, today),
          purchaseRequests: [...current.purchaseRequests, result.request],
          pandaPulse,
        });
        return null;
      },
      cancelPurchaseRequest: (requestId) => {
        set({
          purchaseRequests: get().purchaseRequests.map((req) =>
            req.id === requestId && req.status === 'pending' ? cancelPurchase(req) : req,
          ),
        });
      },
      approvePurchaseRequest: (requestId) => {
        const current = get();
        const request = current.purchaseRequests.find((req) => req.id === requestId);
        if (!request) return 'Brak prośby.';
        const result = approvePurchase({
          request,
          transactions: current.transactions,
          kids: current.kids,
        });
        if (!result.ok) return result.reason;
        const today = todayIso();
        set({
          transactions: result.transactions,
          kids: syncKidsDisplay(result.kids, result.transactions, current.logs, today),
          purchaseRequests: current.purchaseRequests.map((req) =>
            req.id === requestId ? result.request : req,
          ),
        });
        return null;
      },
      rejectPurchaseRequest: (requestId) => {
        set({
          purchaseRequests: get().purchaseRequests.map((req) =>
            req.id === requestId && req.status === 'pending' ? rejectPurchase(req) : req,
          ),
        });
      },
      refundPurchaseRequest: (requestId) => {
        const current = get();
        const request = current.purchaseRequests.find((req) => req.id === requestId);
        if (!request) return 'Brak zakupu.';
        const result = refundPurchase({
          request,
          transactions: current.transactions,
          kids: current.kids,
        });
        if (!result.ok) return result.reason;
        const today = todayIso();
        set({
          transactions: result.transactions,
          kids: syncKidsDisplay(result.kids, result.transactions, current.logs, today),
        });
        return null;
      },
      markWeeklyRedeemed: (kidId, weekStart) => {
        set({
          weeklyClaims: redeemWeeklyClaim(
            get().weeklyClaims,
            weekStart,
            kidId,
            new Date().toISOString(),
          ),
        });
      },
      setTodayException: (patch) => {
        const today = todayIso();
        const weekday = weekdayFromIso(today);
        const current = get();
        const base = getDayException(current.dayExceptions, today) ?? emptyDayException(today);
        const nextEx: DayException = {
          ...base,
          ...patch,
          date: today,
          note: typeof patch.note === 'string' ? patch.note.slice(0, 80) : base.note,
        };
        if (nextEx.freeDay) {
          nextEx.departureOverride = null;
        }
        const dayExceptions = upsertDayException(current.dayExceptions, nextEx);
        const free = nextEx.freeDay;
        const logs = current.logs.map((log) => {
          if (log.date !== today) return log;
          const kid = current.kids.find((item) => item.id === log.kidId);
          const routineId = log.routineId ?? 'morning';
          const planned = free
            ? []
            : kid
              ? snapshotTasks(tasksForToday(kid, weekday, routineId))
              : [];
          return {
            ...log,
            routineId,
            plannedTasks: planned,
            ...(free
              ? { completedTaskIds: [], pointsEarned: 0, finishedAt: null, onTime: false }
              : {}),
          };
        });
        set({ dayExceptions, logs });
      },
      completeOnboarding: () => {
        const pin = get().settings.pin;
        const healed = /^\d{4}$/.test(pin) ? pin : DEFAULT_PIN;
        set({
          onboardingDone: true,
          uiScreen: 'start',
          settings: healed === pin ? get().settings : { ...get().settings, pin: healed },
        });
      },
      factoryReset: () => {
        clearChromaCache();
        void useStore.persist.clearStorage();
        const defaults = makeDefaultState();
        set({
          ...defaults,
          uiScreen: 'onboarding',
          mutedToday: false,
          mutedDate: null,
          playedWarnings: [],
          summaryDismissedDate: null,
          flights: [],
          pandaPulse: {},
          lastBackupAt: null,
          onboardingDone: false,
          _hasHydrated: true,
        });
        flushPersistWrites();
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => createDebouncedStorage()),
      partialize: (state) => ({
        kids: state.kids,
        settings: state.settings,
        logs: state.logs,
        transactions: state.transactions,
        purchaseRequests: state.purchaseRequests,
        weeklyClaims: state.weeklyClaims,
        dayExceptions: state.dayExceptions,
        version: state.version,
        mutedToday: state.mutedToday,
        mutedDate: state.mutedDate,
        playedWarnings: state.playedWarnings,
        summaryDismissedDate: state.summaryDismissedDate,
        lastBackupAt: state.lastBackupAt,
        onboardingDone: state.onboardingDone,
      }),
      migrate: (persisted) => {
        const fallback = {
          ...makeDefaultState(),
          mutedToday: false,
          mutedDate: null,
          playedWarnings: [],
          summaryDismissedDate: null,
          lastBackupAt: null as string | null,
          onboardingDone: false,
        };
        return mergePersistedSlice(persisted, fallback);
      },
      merge: (persisted, current) => {
        const slice = mergePersistedSlice(persisted, {
          kids: current.kids,
          settings: current.settings,
          logs: current.logs,
          transactions: current.transactions,
          purchaseRequests: current.purchaseRequests,
          weeklyClaims: current.weeklyClaims,
          dayExceptions: current.dayExceptions,
          version: current.version,
          mutedToday: current.mutedToday,
          mutedDate: current.mutedDate,
          playedWarnings: current.playedWarnings,
          summaryDismissedDate: current.summaryDismissedDate,
          lastBackupAt: current.lastBackupAt,
          onboardingDone: current.onboardingDone,
        });
        return { ...current, ...slice };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.ensureToday(Date.now());
          if (state && !state.onboardingDone) {
            state.setUiScreen('onboarding');
          }
          state?.setHasHydrated(true);
        } else {
          useStore.setState({ _hasHydrated: true });
        }
      },
    },
  ),
);
