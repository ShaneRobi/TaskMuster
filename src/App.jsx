import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { DEFAULT_HABITS, fetchHabits, saveHabits, fetchAllLogs, upsertLog, fetchPrefs, savePrefs } from './storage';
import { today } from './dateUtils';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import Heatmap from './components/Heatmap';
import CheckIn from './components/CheckIn';
import Stats from './components/Stats';
import Settings from './components/Settings';
import HeatmapPopover from './components/HeatmapPopover';
import HabitBreakdown from './components/HabitBreakdown';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [prefs, setPrefs] = useState({ theme: 'dark' });
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [log, setLog] = useState({ habits: {}, note: '' });
  const [allLogs, setAllLogs] = useState({});
  const [popover, setPopover] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isDark = prefs.theme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load all data when user signs in
  useEffect(() => {
    if (!user) {
      setHabits(DEFAULT_HABITS);
      setAllLogs({});
      setLog({ habits: {}, note: '' });
      setSelectedDate(today());
      return;
    }

    const curDate = today();
    setDataLoading(true);

    Promise.all([
      fetchHabits(user.id),
      fetchAllLogs(user.id),
      fetchPrefs(user.id),
    ]).then(([habitsFromDB, logs, p]) => {
      const finalHabits = habitsFromDB || DEFAULT_HABITS;
      if (!habitsFromDB) {
        saveHabits(user.id, DEFAULT_HABITS);
      }
      setHabits(finalHabits);
      setAllLogs(logs);
      setLog(logs[curDate] || { habits: {}, note: '' });
      setPrefs(p);
      setDataLoading(false);
    });
  }, [user]);

  // Keep log in sync when selectedDate or allLogs changes
  useEffect(() => {
    setLog(allLogs[selectedDate] || { habits: {}, note: '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, allLogs]);

  const updateLog = useCallback(async (newLog) => {
    setLog(newLog);
    setAllLogs(prev => ({ ...prev, [selectedDate]: newLog }));
    if (user) {
      await upsertLog(user.id, selectedDate, newLog);
    }
  }, [selectedDate, user]);

  const updateHabits = useCallback(async (newHabits) => {
    setHabits(newHabits);
    if (user) {
      await saveHabits(user.id, newHabits);
    }
  }, [user]);

  const toggleTheme = useCallback(async () => {
    const newPrefs = { ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' };
    setPrefs(newPrefs);
    if (user) {
      await savePrefs(user.id, newPrefs);
    }
  }, [prefs, user]);

  const completedCount = useCallback((dateStr) => {
    const l = allLogs[dateStr];
    if (!l) return 0;
    let count = 0;
    for (const h of habits) {
      const v = l.habits?.[h.id];
      if (h.type === 'multi') {
        if (Array.isArray(v) && v.length > 0) count++;
      } else {
        if (v) count++;
      }
    }
    return count;
  }, [allLogs, habits]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Navigate via CheckIn arrows — also close any open popover
  const navigateDate = useCallback((ds) => {
    setSelectedDate(ds);
    setPopover(null);
  }, []);

  const handleCellClick = useCallback((dateStr, anchor) => {
    setPopover({ dateStr, anchor });
    setSelectedDate(dateStr);
  }, []);

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p className="app-loading-text">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>
      <div className="container">
        <Header
          habits={habits}
          allLogs={allLogs}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          selectedDate={selectedDate}
          user={user}
          onSignOut={handleSignOut}
        />

        {dataLoading ? (
          <div className="data-loading">
            <div className="app-loading-spinner" />
            <span>Loading your data…</span>
          </div>
        ) : (
          <>
            <Heatmap
              signupYear={user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}
              completedCount={completedCount}
              maxHabits={habits.length}
              onCellClick={(dateStr, anchor) => setPopover({ dateStr, anchor })}
              selectedDate={selectedDate}
              onSelectDate={(ds) => setSelectedDate(ds)}
              isDark={isDark}
            />

            <CheckIn
              key={selectedDate}
              date={selectedDate}
              log={log}
              habits={habits}
              onUpdateLog={updateLog}
              onNavigate={navigateDate}
            />

            <Settings
              open={settingsOpen}
              onToggle={() => setSettingsOpen(o => !o)}
              habits={habits}
              onUpdateHabits={updateHabits}
            />

            <Stats
              habits={habits}
              allLogs={allLogs}
              todayStr={today()}
            />

            <HabitBreakdown
              habits={habits}
              allLogs={allLogs}
              isDark={isDark}
              onCellClick={handleCellClick}
              onSelectDate={(ds) => setSelectedDate(ds)}
              selectedDate={selectedDate}
            />
          </>
        )}
      </div>

      {popover && (
        <HeatmapPopover
          dateStr={popover.dateStr}
          anchor={popover.anchor}
          log={allLogs[popover.dateStr] || { habits: {}, note: '' }}
          habits={habits}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
