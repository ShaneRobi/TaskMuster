import { useState, useEffect, useCallback } from 'react';
import { getHabits, saveHabits, getLog, saveLog, getPrefs, savePrefs, getAllLogs } from './storage';
import { today } from './dateUtils';
import Header from './components/Header';
import Heatmap from './components/Heatmap';
import CheckIn from './components/CheckIn';
import Stats from './components/Stats';
import Settings from './components/Settings';
import HeatmapPopover from './components/HeatmapPopover';
import './App.css';

export default function App() {
  const [habits, setHabits] = useState(() => getHabits());
  const [prefs, setPrefs] = useState(() => getPrefs());
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [log, setLog] = useState(() => getLog(today()));
  const [allLogs, setAllLogs] = useState(() => getAllLogs());
  const [popover, setPopover] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isDark = prefs.theme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  const loadDate = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setLog(getLog(dateStr));
    setPopover(null);
  }, []);

  const updateLog = useCallback((newLog) => {
    saveLog(selectedDate, newLog);
    setLog(newLog);
    setAllLogs(getAllLogs());
  }, [selectedDate]);

  const updateHabits = useCallback((newHabits) => {
    saveHabits(newHabits);
    setHabits(newHabits);
  }, []);

  const toggleTheme = useCallback(() => {
    const newPrefs = { ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' };
    savePrefs(newPrefs);
    setPrefs(newPrefs);
  }, [prefs]);

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

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>
      <div className="container">
        <Header
          habits={habits}
          allLogs={allLogs}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          selectedDate={selectedDate}
        />

        <Heatmap
          year={new Date().getFullYear()}
          completedCount={completedCount}
          maxHabits={habits.length}
          onCellClick={(dateStr, anchor) => setPopover({ dateStr, anchor })}
          selectedDate={selectedDate}
          onSelectDate={loadDate}
          isDark={isDark}
        />

        <CheckIn
          date={selectedDate}
          log={log}
          habits={habits}
          onUpdateLog={updateLog}
          onNavigate={loadDate}
        />

        <Stats
          habits={habits}
          allLogs={allLogs}
          todayStr={today()}
        />

        <Settings
          open={settingsOpen}
          onToggle={() => setSettingsOpen(o => !o)}
          habits={habits}
          onUpdateHabits={updateHabits}
        />
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
