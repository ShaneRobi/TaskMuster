import { useMemo, useState } from 'react';
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

export default function Heatmap({ signupYear, completedCount, maxHabits, onCellClick, selectedDate, onSelectDate, isDark }) {
  const todayStr = today();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [viewMode, setViewMode] = useState('month');
  const [yearView, setYearView] = useState(currentYear);
  // monthOffset: 0 = current month, -1 = last month, etc.
  const [monthOffset, setMonthOffset] = useState(0);

  // Derive the displayed month/year from offset
  const displayDate = useMemo(() => {
    const d = new Date(currentYear, currentMonth + monthOffset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [currentYear, currentMonth, monthOffset]);

  // Earliest allowed month = signup year, January
  const minOffset = useMemo(() => {
    const start = signupYear || currentYear;
    return (start - currentYear) * 12 - currentMonth;
  }, [signupYear, currentYear, currentMonth]);

  // ── Month view ──────────────────────────────────────────────────────────────
  const monthCells = useMemo(() => {
    const { year, month } = displayDate;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, d) =>
      toDateStr(new Date(year, month, d + 1))
    );
  }, [displayDate]);

  // ── Year view (GitHub-style continuous grid) ────────────────────────────────
  const { weeks, monthLabels } = useMemo(() => {
    const jan1 = new Date(yearView, 0, 1);
    const startOffset = jan1.getDay();
    const isLeap = (yearView % 4 === 0 && yearView % 100 !== 0) || yearView % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 0; d < daysInYear; d++) {
      cells.push(toDateStr(new Date(yearView, 0, d + 1)));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeksArr = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeksArr.push(cells.slice(i, i + 7));
    }

    const labels = [];
    for (let m = 0; m < 12; m++) {
      const firstOfMonth = new Date(yearView, m, 1);
      const dayOfYear = Math.round((firstOfMonth - jan1) / 86400000);
      const colIndex = Math.floor((dayOfYear + startOffset) / 7);
      labels.push({ month: m, col: colIndex });
    }

    return { weeks: weeksArr, monthLabels: labels };
  }, [yearView]);

  const yearOptions = useMemo(() => {
    const opts = [];
    const start = signupYear || currentYear;
    for (let y = start; y <= currentYear; y++) opts.push(y);
    return opts;
  }, [signupYear, currentYear]);

  function renderCell(dateStr, fallbackKey) {
    if (!dateStr) return <div key={fallbackKey} className="heatmap-cell empty" />;
    const count = completedCount(dateStr);
    const isFuture = dateStr > todayStr;
    const isSelected = dateStr === selectedDate;
    const color = isFuture ? (isDark ? '#222' : '#f0f0f0') : cellColor(count, maxHabits, isDark);
    return (
      <div
        key={dateStr}
        className={`heatmap-cell${isSelected ? ' selected' : ''}`}
        style={{ backgroundColor: color }}
        title={`${dateStr}: ${count} habit${count !== 1 ? 's' : ''} completed`}
        onClick={(e) => {
          if (!isFuture) {
            onCellClick(dateStr, e.currentTarget.getBoundingClientRect());
            onSelectDate(dateStr);
          }
        }}
      />
    );
  }

  const numWeeks = weeks.length;

  return (
    <section className="heatmap-section">
      <div className="heatmap-header">
        <div className="heatmap-title-row">
          <h2 className="section-title heatmap-title">
            {viewMode === 'month'
              ? `${MONTH_NAMES[displayDate.month]} ${displayDate.year}`
              : `Activity — ${yearView}`}
          </h2>
          {viewMode === 'month' && (
            <div className="month-nav">
              <button
                className="month-nav-btn"
                onClick={() => setMonthOffset(o => o - 1)}
                disabled={monthOffset <= minOffset}
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                className="month-nav-btn"
                onClick={() => setMonthOffset(o => o + 1)}
                disabled={monthOffset >= 0}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          )}
        </div>
        <div className="heatmap-controls">
          {viewMode === 'year' && yearOptions.length > 1 && (
            <div className="year-selector">
              {yearOptions.map(y => (
                <button
                  key={y}
                  className={`year-btn${y === yearView ? ' active' : ''}`}
                  onClick={() => setYearView(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <button
            className="view-toggle-btn"
            onClick={() => setViewMode(v => v === 'month' ? 'year' : 'month')}
          >
            {viewMode === 'month' ? 'Full Year' : 'This Month'}
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="heatmap-month-cells">
          {monthCells.map((dateStr, i) => renderCell(dateStr, `pad-${i}`))}
        </div>
      ) : (
        <div className="heatmap-year-scroll">
          <div
            className="heatmap-year-grid"
            style={{ gridTemplateColumns: `repeat(${numWeeks}, 11px)` }}
          >
            {Array.from({ length: numWeeks }, (_, wi) => {
              const label = monthLabels.find(l => l.col === wi);
              return (
                <div key={`ml-${wi}`} className="heatmap-year-month-label">
                  {label ? MONTH_NAMES[label.month] : ''}
                </div>
              );
            })}
            {[0, 1, 2, 3, 4, 5, 6].flatMap(di =>
              weeks.map((week, wi) => renderCell(week[di], `cell-${wi}-${di}`))
            )}
          </div>
        </div>
      )}

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
