import { Sun, Moon, Flame, LogOut } from 'lucide-react';
import { toDateStr } from '../dateUtils';

function computeStreaks(habits, allLogs) {
  const habitStreak = (habitId, isMulti) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = toDateStr(d);
      const l = allLogs[ds];
      const v = l?.habits?.[habitId];
      const done = isMulti ? (Array.isArray(v) && v.length > 0) : !!v;
      if (!done) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const overallStreak = () => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = toDateStr(d);
      const l = allLogs[ds];
      if (!l) break;
      const allDone = habits.every(h => {
        const v = l.habits?.[h.id];
        return h.type === 'multi' ? (Array.isArray(v) && v.length > 0) : !!v;
      });
      if (!allDone) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  return { habitStreak, overallStreak: overallStreak() };
}

export default function Header({ habits, allLogs, isDark, onToggleTheme, user, onSignOut }) {
  const { habitStreak, overallStreak } = computeStreaks(habits, allLogs);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">Habit Rabbit</h1>
        <div className="overall-streak">
          <Flame size={18} className="flame-icon" />
          <span>{overallStreak} day{overallStreak !== 1 ? 's' : ''} streak</span>
        </div>
      </div>

      <div className="habit-streaks">
        {habits.map(h => {
          const s = habitStreak(h.id, h.type === 'multi');
          return (
            <div key={h.id} className="habit-streak-pill">
              <span className="habit-streak-label">{h.label}</span>
              <span className="habit-streak-count">
                <Flame size={10} />
                {s}
              </span>
            </div>
          );
        })}
      </div>

      <div className="header-right">
        {user && (
          <div className="header-user">
            <span className="header-user-email">{user.email}</span>
            <button className="signout-btn" onClick={onSignOut} title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        )}
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
