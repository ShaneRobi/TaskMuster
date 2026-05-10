import { useMemo } from 'react';
import { toDateStr, today } from '../dateUtils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function cellColor(count, max, isDark) {
  if (count === 0) return isDark ? '#2a2a2a' : '#e8e8e8';
  const ratio = Math.min(count / Math.max(max, 1), 1);
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

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startPad = firstDay.getDay();
      const cells = [
        ...Array(startPad).fill(null),
        ...Array.from({ length: daysInMonth }, (__, d) =>
          toDateStr(new Date(year, month, d + 1))
        ),
      ];
      return { month, cells };
    });
  }, [year]);

  return (
    <section className="heatmap-section">
      <h2 className="section-title">Activity — {year}</h2>
      <div className="heatmap-months-container">
        {months.map(({ month, cells }) => (
          <div key={month} className="heatmap-month-block">
            <div className="heatmap-month-label">{MONTH_NAMES[month]}</div>
            <div className="heatmap-month-cells">
              {cells.map((dateStr, i) => {
                if (!dateStr) {
                  return <div key={`pad-${month}-${i}`} className="heatmap-cell empty" />;
                }
                const count = completedCount(dateStr);
                const isFuture = dateStr > todayStr;
                const isSelected = dateStr === selectedDate;
                const color = isFuture ? (isDark ? '#222' : '#f0f0f0') : cellColor(count, maxHabits, isDark);
                return (
                  <div
                    key={dateStr}
                    className={`heatmap-cell${isSelected ? ' selected' : ''}`}
                    style={{ backgroundColor: color }}
                    title={`${dateStr}: ${count}/${maxHabits} habits`}
                    onClick={(e) => {
                      if (!isFuture) {
                        onCellClick(dateStr, e.currentTarget.getBoundingClientRect());
                        onSelectDate(dateStr);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
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
    </section>
  );
}
