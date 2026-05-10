import { useMemo } from 'react';
import { yearDays, fromDateStr, today } from '../dateUtils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function cellColor(count, max, isDark) {
  if (count === 0) return isDark ? '#2a2a2a' : '#e8e8e8';
  const ratio = Math.min(count / Math.max(max, 1), 1);
  // teal/green ramp: low = #0e4429, mid = #26a641, high = #39d353
  const stops = [
    [14, 68, 41],
    [38, 166, 65],
    [57, 211, 83],
  ];
  const idx = ratio < 0.5
    ? [stops[0], stops[1], ratio * 2]
    : [stops[1], stops[2], (ratio - 0.5) * 2];
  const [from, to, t] = idx;
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export default function Heatmap({ year, completedCount, maxHabits, onCellClick, selectedDate, onSelectDate, isDark }) {
  const todayStr = today();
  const days = useMemo(() => yearDays(year), [year]);

  // pad so Jan 1 starts on correct weekday (0=Sun)
  const jan1 = fromDateStr(`${year}-01-01`);
  const startPad = jan1.getDay();

  // build weeks array
  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (const d of days) cells.push(d);
    const ws = [];
    for (let i = 0; i < cells.length; i += 7) {
      ws.push(cells.slice(i, i + 7));
    }
    return ws;
  }, [days, startPad]);

  // month label positions (week index where month first appears)
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (!d) continue;
        const m = fromDateStr(d).getMonth();
        if (m !== lastMonth) {
          labels.push({ month: m, week: wi });
          lastMonth = m;
        }
        break;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <section className="heatmap-section">
      <h2 className="section-title">Activity — {year}</h2>
      <div className="heatmap-wrapper">
        <div
          className="heatmap-months"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, 13px)`, gap: '3px', width: 'max-content' }}
        >
          {monthLabels.map(({ month, week }) => (
            <span
              key={month}
              className="heatmap-month-label"
              style={{ gridColumn: week + 1 }}
            >
              {MONTH_NAMES[month]}
            </span>
          ))}
        </div>
        <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 13px)` }}>
          {weeks.map((week, wi) =>
            week.map((dateStr, di) => {
              if (!dateStr) {
                return <div key={`pad-${wi}-${di}`} className="heatmap-cell empty" />;
              }
              const count = completedCount(dateStr);
              const isFuture = dateStr > todayStr;
              const isSelected = dateStr === selectedDate;
              const color = isFuture ? (isDark ? '#222' : '#f0f0f0') : cellColor(count, maxHabits, isDark);
              return (
                <div
                  key={dateStr}
                  className={`heatmap-cell${isSelected ? ' selected' : ''}`}
                  style={{ backgroundColor: color, gridColumn: wi + 1, gridRow: di + 1 }}
                  title={`${dateStr}: ${count}/${maxHabits} habits`}
                  onClick={(e) => {
                    if (!isFuture) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onCellClick(dateStr, rect);
                      onSelectDate(dateStr);
                    }
                  }}
                />
              );
            })
          )}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(r => (
            <div
              key={r}
              className="heatmap-cell"
              style={{ backgroundColor: cellColor(r * maxHabits || (r === 0 ? 0 : 1), maxHabits, isDark) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
