import type { DayLog, Kid } from '../../../types';
import { TIME } from '../../../lib/constants';
import { logsToCsv, downloadText } from '../../../lib/backup';
import { addDaysIso, todayIso } from '../../../lib/time';
import { useStore } from '../../../store/useStore';

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, 1);
  const raw = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function hasWork(log: DayLog | undefined): log is DayLog {
  return (
    log !== undefined &&
    (log.completedTaskIds.length > 0 || log.finishedAt !== null || log.pointsEarned > 0)
  );
}

export function HistoryTab() {
  const logs = useStore((s) => s.logs);
  const kids = useStore((s) => s.kids);
  const today = todayIso(new Date());
  const dates = Array.from({ length: TIME.historyDays }, (_, i) => addDaysIso(today, -i));

  function exportCsv() {
    const csv = `\uFEFF${logsToCsv(logs, kids, TIME.historyDays)}`;
    downloadText(`panda-ninja-historia-${today}.csv`, csv, 'text/csv;charset=utf-8');
  }

  return (
    <section className="space-y-4 py-4">
      <p className="text-muted">Ostatnie {TIME.historyDays} dni — puste poranki to kreska, nie kara.</p>
      <button
        type="button"
        className="min-h-[56px] w-full rounded-2xl bg-dojo text-lg text-white"
        onClick={exportCsv}
      >
        Eksport CSV
      </button>
      <div className="overflow-x-auto rounded-2xl bg-panel">
        <table className="w-full min-w-[520px] text-left text-base">
          <thead>
            <tr className="border-b border-ink/10 text-muted">
              <th className="px-3 py-3 font-semibold">Data</th>
              {kids.map((kid) => (
                <th key={kid.id} className="px-3 py-3 font-semibold">
                  {kid.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.flatMap((date, index) => {
              const month = date.slice(0, 7);
              const prev = dates[index - 1];
              const showMonth = index === 0 || prev?.slice(0, 7) !== month;
              const rows = [];
              if (showMonth) {
                rows.push(
                  <tr key={`m-${month}`}>
                    <td
                      colSpan={kids.length + 1}
                      className="bg-paper px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted"
                    >
                      {monthLabel(date)}
                    </td>
                  </tr>,
                );
              }
              rows.push(
                <tr key={date} className="border-b border-ink/5">
                  <td className="whitespace-nowrap px-3 py-3">{dayLabel(date)}</td>
                  {kids.map((kid: Kid) => {
                    const log = logs.find((item) => item.date === date && item.kidId === kid.id);
                    return (
                      <td key={kid.id} className="px-3 py-3">
                        {hasWork(log) ? (
                          <>
                            {log.pointsEarned} pkt · {log.completedTaskIds.length}
                            {log.plannedTasks && log.plannedTasks.length > 0
                              ? `/${log.plannedTasks.length}`
                              : ''}{' '}
                            zad.
                            {log.onTime ? ' · na czas' : ' · po czasie'}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>,
              );
              return rows;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
