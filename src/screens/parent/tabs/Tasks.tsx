import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { TASK_ICONS, taskIconSrc } from '../../../lib/catalog';
import { WEEKDAYS } from '../../../lib/constants';
import { ROUTINE_LABELS } from '../../../lib/onboarding';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';
import type { RoutineId, Task, Weekday } from '../../../types';

export function TasksTab() {
  const kids = useStore((s) => s.kids);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const removeTask = useStore((s) => s.removeTask);
  const moveTask = useStore((s) => s.moveTask);
  const copyTasksToOther = useStore((s) => s.copyTasksToOther);
  const [kidId, setKidId] = useState(kids[0].id);
  const [routineFilter, setRoutineFilter] = useState<RoutineId>('morning');
  const [editing, setEditing] = useState<Task | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const kid = kids.find((item) => item.id === kidId) ?? kids[0];
  const other = kids.find((item) => item.id !== kid.id) ?? kids[1];
  const tasks = [...kid.tasks]
    .filter((task) => (task.routine ?? 'morning') === routineFilter)
    .sort((a, b) => a.order - b.order);

  return (
    <section className="space-y-4 py-4">
      <div className="flex gap-2">
        {kids.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setKidId(item.id)}
            className={`min-h-[52px] flex-1 rounded-2xl ${kidId === item.id ? 'bg-dojo text-white' : 'bg-white'}`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(['morning', 'evening'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setRoutineFilter(id)}
            className={`min-h-[52px] flex-1 rounded-2xl ${
              routineFilter === id ? 'bg-dojo text-white' : 'bg-white'
            }`}
          >
            {ROUTINE_LABELS[id]}
          </button>
        ))}
      </div>

      {tasks.map((task, index) => (
        <article key={task.id} className="flex items-center gap-2 rounded-2xl bg-white p-3">
          <img src={taskIconSrc(task.icon)} alt="" className="h-12 w-12 object-contain" />
          <button type="button" className="min-h-[56px] flex-1 text-left" onClick={() => setEditing(task)}>
            <p className="text-lg font-semibold">{task.label}</p>
            <p className="text-sm text-muted">
              {task.points} pkt
              {task.timerSec ? ` · timer ${Math.round(task.timerSec / 60)} min` : ''} ·{' '}
              {task.days.map((d) => WEEKDAYS.find((w) => w.id === d)?.short).join(' ')}
            </p>
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px]"
              disabled={index === 0}
              onClick={() => moveTask(kid.id, task.id, 'up')}
              aria-label="Wyżej"
            >
              ↑
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px]"
              disabled={index === tasks.length - 1}
              onClick={() => moveTask(kid.id, task.id, 'down')}
              aria-label="Niżej"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            className="min-h-[44px] px-2 text-belt"
            onClick={() => setRemoveId(task.id)}
          >
            Usuń
          </button>
        </article>
      ))}

      <button
        type="button"
        className="min-h-[56px] w-full rounded-2xl bg-dojo text-lg text-white"
        onClick={() => addTask(kid.id, routineFilter)}
      >
        Dodaj zadanie ({ROUTINE_LABELS[routineFilter]})
      </button>
      <button
        type="button"
        className="min-h-[56px] w-full rounded-2xl bg-white text-lg"
        onClick={() => setCopyOpen(true)}
      >
        Skopiuj listę do: {other.name}
      </button>

      {editing && (
        <TaskEditor
          task={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateTask(kid.id, editing.id, patch);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={removeId !== null}
        title="Usunąć zadanie?"
        body="Zniknie z listy dziecka. Historia zostaje."
        confirmLabel="Usuń"
        danger
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeTask(kid.id, removeId);
          setRemoveId(null);
        }}
      />
      <ConfirmDialog
        open={copyOpen}
        title="Skopiować listę?"
        body={`Lista ${other.name} zostanie zastąpiona listą ${kid.name}.`}
        confirmLabel="Kopiuj"
        onCancel={() => setCopyOpen(false)}
        onConfirm={() => {
          copyTasksToOther(kid.id);
          setCopyOpen(false);
        }}
      />
    </section>
  );
}

function TaskEditor({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (patch: Partial<Task>) => void;
}) {
  const [label, setLabel] = useState(task.label);
  const [icon, setIcon] = useState(task.icon);
  const [points, setPoints] = useState(String(task.points));
  const [days, setDays] = useState<Weekday[]>(task.days);
  const [routine, setRoutine] = useState<RoutineId>(task.routine ?? 'morning');
  const [timerMin, setTimerMin] = useState(
    task.timerSec && task.timerSec > 0 ? String(Math.round(task.timerSec / 60)) : '',
  );

  function toggleDay(day: Weekday) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-semibold">Zadanie</h2>
        <button type="button" className="min-h-[52px] px-3" onClick={onClose}>
          Anuluj
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        <label className="text-sm text-muted">Nazwa</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          className="mt-1 w-full min-h-[52px] rounded-xl bg-white px-3 text-lg"
        />
        <label className="mt-4 block text-sm text-muted">Punkty</label>
        <input
          type="number"
          min={1}
          max={99}
          inputMode="numeric"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          className="mt-1 w-full min-h-[52px] rounded-xl bg-white px-3 text-lg"
        />
        <p className="mt-4 mb-2 font-semibold">Rutyna</p>
        <div className="flex gap-2">
          {(['morning', 'evening'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setRoutine(id)}
              className={`min-h-[52px] flex-1 rounded-xl ${
                routine === id ? 'bg-dojo text-white' : 'bg-white'
              }`}
            >
              {ROUTINE_LABELS[id]}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-muted">
          Spokojny timer (minuty, puste = bez)
        </label>
        <input
          type="number"
          min={1}
          max={30}
          inputMode="numeric"
          value={timerMin}
          onChange={(e) => setTimerMin(e.target.value)}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          placeholder="np. 2"
          className="mt-1 w-full min-h-[52px] rounded-xl bg-white px-3 text-lg"
        />
        <p className="mt-4 mb-2 font-semibold">Ikona</p>
        <div className="grid grid-cols-6 gap-2">
          {TASK_ICONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setIcon(id)}
              className={`flex min-h-[72px] items-center justify-center rounded-xl bg-white ${icon === id ? 'ring-2 ring-ink' : ''}`}
            >
              <img src={taskIconSrc(id)} alt={id} className="h-10 w-10 object-contain" />
            </button>
          ))}
        </div>
        <p className="mt-4 mb-2 font-semibold">Dni tygodnia</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.id)}
              className={`min-h-[72px] min-w-[72px] rounded-xl ${days.includes(day.id) ? 'bg-dojo text-white' : 'bg-white'}`}
            >
              {day.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 min-h-[56px] w-full rounded-2xl bg-dojo text-lg text-white"
          onClick={() => {
            const minutes = Number(timerMin);
            const timerSec =
              Number.isFinite(minutes) && minutes > 0
                ? Math.max(30, Math.min(1800, Math.round(minutes * 60)))
                : null;
            onSave({
              label: label.trim() || task.label,
              icon,
              points: Math.max(1, Math.min(99, Number(points) || 10)),
              days: days.length > 0 ? days : task.days,
              routine,
              timerSec,
            });
          }}
        >
          Zapisz
        </button>
      </div>
    </div>
  );
}
