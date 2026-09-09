import { PandaStage } from '../components/PandaStage';
import { TOUCH } from '../lib/constants';
import { availableBalance } from '../lib/shop';
import {
  closingPhrase,
  kidCompleteToday,
  streakPhrase,
  summaryPossible,
  weeklyPhrase,
} from '../lib/summary';
import { findDayLog, tasksForToday } from '../lib/tasks';
import { getDepartureToday, todayIso, weekdayFromDate } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

export function SummaryScreen() {
  const nowMs = useNow();
  const now = new Date(nowMs);
  const kids = useStore((s) => s.kids);
  const logs = useStore((s) => s.logs);
  const settings = useStore((s) => s.settings);
  const transactions = useStore((s) => s.transactions);
  const purchaseRequests = useStore((s) => s.purchaseRequests);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const dismissSummary = useStore((s) => s.dismissSummary);
  const date = todayIso(now);
  const weekday = weekdayFromDate(now);
  const departure = getDepartureToday(settings, now, dayExceptions);

  const cards = kids.map((kid) => {
    const due = tasksForToday(kid, weekday, 'morning');
    const log = findDayLog(logs, date, kid.id, 'morning');
    const completedIds = log?.completedTaskIds ?? [];
    const complete = kidCompleteToday(kid, weekday, completedIds);
    const earned = log?.pointsEarned ?? 0;
    const possible = summaryPossible(kid, weekday, settings);
    const wallet = availableBalance(transactions, purchaseRequests, kid.id);
    return {
      kid,
      due,
      complete,
      earned,
      possible,
      wallet,
      weekly: weeklyPhrase(logs, kid.id, now, settings.weeklyReward),
    };
  });

  const listed = cards.filter((card) => card.due.length > 0);
  const everyoneComplete = listed.length > 0 && listed.every((card) => card.complete);
  const closing =
    listed.length === 0
      ? 'Dziś bez listy — odpoczynek też jest treningiem.'
      : closingPhrase(everyoneComplete);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-5 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center">
      <h1 className="text-3xl font-semibold">Koniec treningu</h1>
      {departure && <p className="text-muted">Wyjście {settings.departure[weekday]}</p>}
      <div className="flex w-full max-w-3xl justify-center gap-6">
        {cards.map((card) => (
          <article key={card.kid.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="h-36 w-full">
              <PandaStage
                pose={card.complete ? 'celebrating' : 'sleeping'}
                appearance={card.kid.panda}
                name={card.kid.name}
                pulse={0}
                compact
              />
            </div>
            <p className="text-xl font-semibold">
              {card.kid.name}: {card.earned} z {card.possible} punktów
            </p>
            <p className="text-muted">
              dziś +{card.earned} · ★ {card.wallet}
            </p>
            <p>{streakPhrase(card.kid.streak)}</p>
            {card.weekly && <p className="text-sm text-muted">{card.weekly}</p>}
          </article>
        ))}
      </div>
      <p className="text-2xl font-semibold">{closing}</p>
      <button
        type="button"
        className="min-w-[240px] rounded-3xl bg-dojo px-8 text-xl font-semibold text-white"
        style={{ minHeight: TOUCH.minTilePx }}
        onClick={dismissSummary}
      >
        Wracamy do dojo
      </button>
    </div>
  );
}
