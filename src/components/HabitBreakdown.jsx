import { useState, useMemo } from 'react';
import { yearDays, fromDateStr, toDateStr, today } from '../dateUtils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Color helpers ────────────────────────────────────────────────────────────

function lerp3(from, to, t) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

function habitCellColor(done, subtypeCount, isDark) {
  if (!done) return isDark ? '#2a2a2a' : '#e8e8e8';

  if (subtypeCount !== null && subtypeCount > 0) {
    const stops = [[14,68,41],[38,166,65],[57,211,83]];
    const ratio = Math.min(subtypeCount / 7, 1);
    const [r,g,b] = ratio < 0.5
      ? lerp3(stops[0], stops[1], ratio * 2)
      : lerp3(stops[1], stops[2], (ratio - 0.5) * 2);
    return `rgb(${r},${g},${b})`;
  }

  return isDark ? '#39d353' : '#1a7f37';
}

// ─── Stats computation ────────────────────────────────────────────────────────

function computeHabitStats(habit, allLogs, todayStr) {
  const todayDate = fromDateStr(todayStr);

  const weekStartDate = new Date(todayDate);
  weekStartDate.setDate(todayDate.getDate() - todayDate.getDay());
  const weekStart = toDateStr(weekStartDate);
  const monthStart = `${todayStr.slice(0, 7)}-01`;

  const isDone = (ds) => {
    const l = allLogs[ds];
    if (!l) return false;
    const v = l.habits?.[habit.id];
    return habit.type === 'multi' ? (Array.isArray(v) && v.length > 0) : !!v;
  };

  let totalCompletions = 0;
  let thisWeekCount = 0;
  let thisMonthCount = 0;
  const subtypeCounts = {};

  for (const [dateStr, log] of Object.entries(allLogs)) {
    if (dateStr > todayStr) continue;
    const v = log.habits?.[habit.id];
    const done = habit.type === 'multi' ? (Array.isArray(v) && v.length > 0) : !!v;
    if (!done) continue;

    totalCompletions++;
    if (dateStr >= weekStart) thisWeekCount++;
    if (dateStr >= monthStart) thisMonthCount++;

    if (habit.type === 'multi' && Array.isArray(v)) {
      for (const sub of v) subtypeCounts[sub] = (subtypeCounts[sub] || 0) + 1;
    }
  }

  // Current streak (backwards from today)
  let currentStreak = 0;
  const d = new Date(todayDate);
  for (let i = 0; i < 365 * 5; i++) {
    if (!isDone(toDateStr(d))) break;
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }

  // Longest streak (scan sorted log dates)
  let longestStreak = 0;
  let run = 0;
  let prevDate = null;
  const sortedDates = Object.keys(allLogs).filter(ds => ds <= todayStr).sort();

  for (const ds of sortedDates) {
    if (!isDone(ds)) {
      run = 0;
      prevDate = null;
      continue;
    }
    if (!prevDate) {
      run = 1;
    } else {
      const diff = Math.round((fromDateStr(ds) - fromDateStr(prevDate)) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prevDate = ds;
  }

  const dayOfMonth = todayDate.getDate();
  const monthCompletionPct = Math.round((thisMonthCount / dayOfMonth) * 100);

  return { totalCompletions, currentStreak, longestStreak, thisWeekCount, thisMonthCount, monthCompletionPct, subtypeCounts };
}

// ─── Mini per-habit heatmap ───────────────────────────────────────────────────

function HabitHeatmap({ habit, allLogs, year, isDark, onCellClick, onSelectDate, selectedDate }) {
  const todayStr = today();
  const days = useMemo(() => yearDays(year), [year]);
  const jan1 = fromDateStr(`${year}-01-01`);
  const startPad = jan1.getDay();

  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (const d of days) cells.push(d);
    const ws = [];
    for (let i = 0; i < cells.length; i += 7) ws.push(cells.slice(i, i + 7));
    return ws;
  }, [days, startPad]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (!d) continue;
        const m = fromDateStr(d).getMonth();
        if (m !== lastMonth) { labels.push({ month: m, week: wi }); lastMonth = m; }
        break;
      }
    });
    return labels;
  }, [weeks]);

  const getCellInfo = (dateStr) => {
    const l = allLogs[dateStr];
    if (!l) return { done: false, subtypeCount: null };
    const v = l.habits?.[habit.id];
    if (habit.type === 'multi') {
      const done = Array.isArray(v) && v.length > 0;
      return { done, subtypeCount: done ? v.length : null };
    }
    return { done: !!v, subtypeCount: null };
  };

  return (
    <div className="habit-heatmap-row">
      <span className="habit-heatmap-name">{habit.label}</span>
      <div className="habit-heatmap-wrapper">
        <div className="habit-heatmap-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, 10px)`, gap: '2px', width: 'max-content' }}>
          {monthLabels.map(({ month, week }) => (
            <span key={month} className="heatmap-month-label" style={{ gridColumn: week + 1 }}>
              {MONTH_NAMES[month]}
            </span>
          ))}
        </div>
        <div
          className="mini-heatmap-grid"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, 10px)` }}
        >
          {weeks.map((week, wi) =>
            week.map((dateStr, di) => {
              if (!dateStr) {
                return <div key={`pad-${wi}-${di}`} style={{ width: 10, height: 10, gridColumn: wi + 1, gridRow: di + 1 }} />;
              }
              const isFuture = dateStr > todayStr;
              const isSelected = dateStr === selectedDate;
              const { done, subtypeCount } = getCellInfo(dateStr);
              const color = isFuture
                ? (isDark ? '#222' : '#f0f0f0')
                : habitCellColor(done, subtypeCount, isDark);
              return (
                <div
                  key={dateStr}
                  className={`heatmap-cell${isSelected ? ' selected' : ''}`}
                  style={{ backgroundColor: color, gridColumn: wi + 1, gridRow: di + 1, width: 10, height: 10 }}
                  title={`${dateStr}: ${done ? 'done' : 'not done'}${subtypeCount ? ` (${subtypeCount} types)` : ''}`}
                  onClick={(e) => {
                    if (!isFuture) {
                      onCellClick(dateStr, e.currentTarget.getBoundingClientRect());
                      onSelectDate(dateStr);
                    }
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LeetCode-style stat card ─────────────────────────────────────────────────

function HabitStatCard({ habit, stats }) {
  const { totalCompletions, currentStreak, longestStreak, thisWeekCount, thisMonthCount, monthCompletionPct, subtypeCounts } = stats;

  return (
    <div className="habit-stat-card">
      <div className="habit-stat-card-header">
        <span className="habit-stat-card-name">{habit.label}</span>
        <span className={`habit-stat-badge ${habit.type}`}>
          {habit.type === 'multi' ? 'Multi' : 'Daily'}
        </span>
      </div>

      <div className="habit-stat-total-row">
        <span className="habit-stat-total-num">{totalCompletions}</span>
        <span className="habit-stat-total-lbl">total completions</span>
      </div>

      <div className="habit-stat-month-progress">
        <div className="habit-stat-progress-track">
          <div className="habit-stat-progress-fill" style={{ width: `${monthCompletionPct}%` }} />
        </div>
        <span className="habit-stat-progress-label">{monthCompletionPct}% this month</span>
      </div>

      <div className="habit-stat-metrics">
        <div className="habit-stat-metric">
          <span className="habit-stat-metric-num">{currentStreak}</span>
          <span className="habit-stat-metric-lbl">streak</span>
        </div>
        <div className="habit-stat-metric">
          <span className="habit-stat-metric-num">{longestStreak}</span>
          <span className="habit-stat-metric-lbl">best</span>
        </div>
        <div className="habit-stat-metric">
          <span className="habit-stat-metric-num">{thisWeekCount}</span>
          <span className="habit-stat-metric-lbl">this week</span>
        </div>
        <div className="habit-stat-metric">
          <span className="habit-stat-metric-num">{thisMonthCount}</span>
          <span className="habit-stat-metric-lbl">this month</span>
        </div>
      </div>

      {habit.type === 'multi' && Object.keys(subtypeCounts).length > 0 && (
        <div className="habit-stat-subtypes">
          {Object.entries(subtypeCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([sub, count]) => (
              <div key={sub} className="habit-stat-subtype-row">
                <span className="habit-stat-subtype-name">{sub}</span>
                <span className="habit-stat-subtype-count">{count}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Breakdown component ─────────────────────────────────────────────────

export default function HabitBreakdown({ habits, allLogs, isDark, onCellClick, onSelectDate, selectedDate }) {
  const [tab, setTab] = useState('heatmaps');
  const year = new Date().getFullYear();
  const todayStr = today();

  const habitStats = useMemo(
    () => habits.map(h => ({ habit: h, stats: computeHabitStats(h, allLogs, todayStr) })),
    [habits, allLogs, todayStr]
  );

  return (
    <section className="breakdown-section">
      <div className="breakdown-header">
        <h2 className="section-title">Breakdown</h2>
        <div className="breakdown-tabs">
          <button
            className={`breakdown-tab${tab === 'heatmaps' ? ' active' : ''}`}
            onClick={() => setTab('heatmaps')}
          >
            Heatmaps
          </button>
          <button
            className={`breakdown-tab${tab === 'stats' ? ' active' : ''}`}
            onClick={() => setTab('stats')}
          >
            Stats
          </button>
        </div>
      </div>

      {tab === 'heatmaps' && (
        <div className="breakdown-heatmaps">
          {habits.map(h => (
            <HabitHeatmap
              key={h.id}
              habit={h}
              allLogs={allLogs}
              year={year}
              isDark={isDark}
              onCellClick={onCellClick}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="breakdown-stats-grid">
          {habitStats.map(({ habit, stats }) => (
            <HabitStatCard key={habit.id} habit={habit} stats={stats} />
          ))}
        </div>
      )}
    </section>
  );
}
