const DEFAULT_HABITS = [
  { id: 'github', label: 'GitHub Commit', type: 'simple' },
  { id: 'leetcode', label: 'LeetCode Problem', type: 'simple' },
  { id: 'neetcode', label: 'NeetCode Problem', type: 'simple' },
  { id: 'linkedin', label: 'LinkedIn Learning Lesson', type: 'simple' },
  {
    id: 'workout',
    label: 'Workout',
    type: 'multi',
    options: ['Running', 'Kettlebell', 'Calisthenics', 'Yoga', 'Pilates', 'Weight Lifting', 'Cycling'],
  },
];

export function getHabits() {
  try {
    const raw = localStorage.getItem('habits-config');
    return raw ? JSON.parse(raw) : DEFAULT_HABITS;
  } catch {
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits) {
  localStorage.setItem('habits-config', JSON.stringify(habits));
}

export function getLog(dateStr) {
  try {
    const raw = localStorage.getItem(`log:${dateStr}`);
    return raw ? JSON.parse(raw) : { habits: {}, note: '' };
  } catch {
    return { habits: {}, note: '' };
  }
}

export function saveLog(dateStr, log) {
  localStorage.setItem(`log:${dateStr}`, JSON.stringify(log));
}

export function getPrefs() {
  try {
    const raw = localStorage.getItem('prefs');
    return raw ? JSON.parse(raw) : { theme: 'dark' };
  } catch {
    return { theme: 'dark' };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem('prefs', JSON.stringify(prefs));
}

export function getAllLogs() {
  const logs = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('log:')) {
      try {
        logs[key.slice(4)] = JSON.parse(localStorage.getItem(key));
      } catch {
        // ignore corrupt entries
      }
    }
  }
  return logs;
}
