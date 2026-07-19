import { useState, useEffect, useCallback } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CalendarCheck2, Crosshair } from 'lucide-react';
import { supabase } from './supabaseClient';
import { DEFAULT_HABITS, fetchHabits, saveHabits, fetchAllHabitsMap, fetchAllLogs, upsertLog, fetchPrefs, savePrefs } from './storage';
import { today } from './dateUtils';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import Heatmap from './components/Heatmap';
import CheckIn from './components/CheckIn';
import Stats from './components/Stats';
import HeatmapPopover from './components/HeatmapPopover';
import HabitBreakdown from './components/HabitBreakdown';
import Accountability from './components/Accountability';
import './App.css';

export default function App() {
  const isAccountabilityPreview = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview') === 'accountability';
  const previewUser = isAccountabilityPreview
    ? { id: 'local-preview', email: 'preview@habit-rabbit.local', created_at: new Date().toISOString() }
    : null;
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [allHabitsMap, setAllHabitsMap] = useState({});
  const [prefs, setPrefs] = useState({ theme: 'dark' });
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [log, setLog] = useState({ habits: {}, note: '' });
  const [allLogs, setAllLogs] = useState({});
  const [popover, setPopover] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const activeWorkspace = location.pathname.startsWith('/accountability') ? 'accountability' : 'habits';

  const isDark = prefs.theme === 'dark';

  // Close any open popover when switching workspaces
  useEffect(() => {
    setPopover(null);
  }, [location.pathname]);

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
      // Use functional update: if the user ID hasn't changed (e.g. TOKEN_REFRESHED or
      // the SIGNED_IN Supabase fires on every tab-switch-back via its internal
      // visibilitychange → _recoverAndRefresh() chain), return the existing object
      // reference so React bails out and the [user] data-load effect never re-fires.
      setUser(prev => {
        const nextId = session?.user?.id ?? null;
        if ((prev?.id ?? null) === nextId) return prev;
        return session?.user ?? null;
      });
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
      fetchAllHabitsMap(user.id),
    ]).then(([habitsFromDB, logs, p, habitsMap]) => {
      const finalHabits = habitsFromDB || DEFAULT_HABITS;
      if (!habitsFromDB) {
        saveHabits(user.id, DEFAULT_HABITS);
      }
      setHabits(finalHabits);
      // Seed map with active habits so it's populated even for first-time users
      const finalMap = { ...habitsMap };
      for (const h of finalHabits) {
        if (!finalMap[h.id]) finalMap[h.id] = h;
      }
      setAllHabitsMap(finalMap);
      setAllLogs(logs);
      setLog(logs[curDate] || { habits: {}, note: '' });
      setPrefs(p);
      setDataLoading(false);
    });
  }, [user]);

  // Keep log in sync when selectedDate or allLogs changes
  useEffect(() => {
    setLog(allLogs[selectedDate] || { habits: {}, note: '' });
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
    // Add/update active habits in the map; archived entries are preserved
    setAllHabitsMap(prev => {
      const updated = { ...prev };
      for (const h of newHabits) updated[h.id] = h;
      return updated;
    });
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
    for (const v of Object.values(l.habits || {})) {
      if (Array.isArray(v) ? v.length > 0 : !!v) count++;
    }
    return count;
  }, [allLogs]);

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

  const activeUser = previewUser || user;

  if (authLoading && !isAccountabilityPreview) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p className="app-loading-text">Loading…</p>
      </div>
    );
  }

  if (!activeUser) {
    return <AuthScreen />;
  }

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>
      <div className={`container ${activeWorkspace === 'accountability' ? 'container-wide' : ''}`}>
        <Header
          habits={habits}
          allLogs={allLogs}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          selectedDate={selectedDate}
          user={isAccountabilityPreview ? null : user}
          onSignOut={handleSignOut}
        />

        <nav className="workspace-tabs" aria-label="Habit Rabbit workspaces">
          <NavLink
            to={{ pathname: '/habits', search: location.search }}
            className={({ isActive }) => `workspace-tab ${isActive ? 'active' : ''}`}
          >
            <CalendarCheck2 size={17} />
            <span><strong>Habits</strong><small>Daily check-in & streaks</small></span>
          </NavLink>
          <NavLink
            to={{ pathname: '/accountability', search: location.search }}
            className={({ isActive }) => `workspace-tab ${isActive ? 'active' : ''}`}
          >
            <Crosshair size={17} />
            <span><strong>Accountability</strong><small>Quant developer path</small></span>
          </NavLink>
        </nav>

        {dataLoading ? (
          <div className="data-loading">
            <div className="app-loading-spinner" />
            <span>Loading your data…</span>
          </div>
        ) : (
          <Routes>
            <Route
              path="/habits"
              element={
                <>
                  <Heatmap
                    signupYear={activeUser?.created_at ? new Date(activeUser.created_at).getFullYear() : new Date().getFullYear()}
                    completedCount={completedCount}
                    maxHabits={habits.length}
                    onCellClick={(dateStr, anchor) => setPopover({ dateStr, anchor })}
                    selectedDate={selectedDate}
                    onSelectDate={(ds) => setSelectedDate(ds)}
                    isDark={isDark}
                  />

                  <CheckIn
                    date={selectedDate}
                    log={log}
                    habits={habits}
                    onUpdateLog={updateLog}
                    onNavigate={navigateDate}
                    settingsOpen={settingsOpen}
                    onToggleSettings={() => setSettingsOpen(o => !o)}
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
              }
            />
            <Route path="/accountability" element={<Accountability userId={activeUser.id} />} />
            <Route path="*" element={<Navigate to={`/habits${location.search}`} replace />} />
          </Routes>
        )}
      </div>

      {activeWorkspace === 'habits' && popover && (
        <HeatmapPopover
          dateStr={popover.dateStr}
          anchor={popover.anchor}
          log={allLogs[popover.dateStr] || { habits: {}, note: '' }}
          habits={habits}
          allHabitsMap={allHabitsMap}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
