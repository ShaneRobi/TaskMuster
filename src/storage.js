import { supabase } from './supabaseClient';

export const DEFAULT_HABITS = [
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

// Returns null if user has no saved habits (first-time user)
export async function fetchHabits(userId) {
  const { data, error } = await supabase
    .from('habit_configs')
    .select('habit_id, label, habit_type, options, is_active, sort_order')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data?.length) return null;

  return data.map(row => ({
    id: row.habit_id,
    label: row.label,
    type: row.habit_type,
    options: row.options?.length ? row.options : undefined,
  }));
}

export async function saveHabits(userId, habits) {
  await supabase.from('habit_configs').delete().eq('user_id', userId);
  if (!habits.length) return;

  const rows = habits.map((h, i) => ({
    user_id: userId,
    habit_id: h.id,
    label: h.label,
    habit_type: h.type,
    options: h.options || [],
    is_active: true,
    sort_order: i,
  }));

  await supabase.from('habit_configs').insert(rows);
}

function rowsToAllLogs(rows) {
  const logs = {};
  for (const row of rows) {
    const dateStr = row.date;
    if (!logs[dateStr]) logs[dateStr] = { habits: {}, note: '' };

    if (row.habit_id === '__note__') {
      logs[dateStr].note = row.note || '';
    } else if (row.completed) {
      if (row.workout_subtypes?.length) {
        logs[dateStr].habits[row.habit_id] = row.workout_subtypes;
      } else {
        logs[dateStr].habits[row.habit_id] = true;
      }
    }
  }
  return logs;
}

export async function fetchAllLogs(userId) {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('date, habit_id, completed, workout_subtypes, note')
    .eq('user_id', userId);

  if (error || !data) return {};
  return rowsToAllLogs(data);
}

export async function upsertLog(userId, dateStr, log) {
  const rows = [];

  for (const [habitId, val] of Object.entries(log.habits || {})) {
    const isMulti = Array.isArray(val);
    const completed = isMulti ? val.length > 0 : !!val;
    rows.push({
      user_id: userId,
      date: dateStr,
      habit_id: habitId,
      completed,
      workout_subtypes: isMulti ? val : [],
      note: '',
    });
  }

  // Always upsert the daily note row so the date appears in allLogs
  rows.push({
    user_id: userId,
    date: dateStr,
    habit_id: '__note__',
    completed: false,
    workout_subtypes: [],
    note: log.note || '',
  });

  await supabase
    .from('habit_logs')
    .upsert(rows, { onConflict: 'user_id,date,habit_id' });
}

export async function fetchPrefs(userId) {
  const { data, error } = await supabase
    .from('user_prefs')
    .select('theme')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { theme: 'dark' };
  return { theme: data.theme };
}

export async function savePrefs(userId, prefs) {
  await supabase
    .from('user_prefs')
    .upsert({ user_id: userId, theme: prefs.theme }, { onConflict: 'user_id' });
}
