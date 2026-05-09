import { fromDateStr, toDateStr } from '../dateUtils';

function completionPct(habits, logs, dateStrs) {
  if (dateStrs.length === 0) return 0;
  let total = 0;
  let done = 0;
  for (const ds of dateStrs) {
    const l = logs[ds];
    for (const h of habits) {
      total++;
      if (!l) continue;
      const v = l.habits?.[h.id];
      if (h.type === 'multi' ? (Array.isArray(v) && v.length > 0) : !!v) done++;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function getWeekDates(todayStr) {
  const d = fromDateStr(todayStr);
  const day = d.getDay();
  const days = [];
  for (let i = 0; i <= day; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - (day - i));
    days.push(toDateStr(dd));
  }
  return days;
}

function getMonthDates(todayStr) {
  const d = fromDateStr(todayStr);
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const days = [];
  for (let i = 1; i <= dayOfMonth; i++) {
    days.push(toDateStr(new Date(year, month, i)));
  }
  return days;
}

function StatCard({ label, pct, count }) {
  return (
    <div className="stat-card">
      <div className="stat-pct">{pct}%</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{count} days tracked</div>
      <div className="stat-bar">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Stats({ habits, allLogs, todayStr }) {
  const weekDates = getWeekDates(todayStr);
  const monthDates = getMonthDates(todayStr);

  const weekPct = completionPct(habits, allLogs, weekDates);
  const monthPct = completionPct(habits, allLogs, monthDates);

  const weekTracked = weekDates.filter(d => allLogs[d]).length;
  const monthTracked = monthDates.filter(d => allLogs[d]).length;

  return (
    <section className="stats-section">
      <h2 className="section-title">Completion Stats</h2>
      <div className="stats-grid">
        <StatCard label="This Week" pct={weekPct} count={weekTracked} />
        <StatCard label="This Month" pct={monthPct} count={monthTracked} />
      </div>
    </section>
  );
}
