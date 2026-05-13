import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDisplay, addDays, today } from '../dateUtils';
import Settings from './Settings';

function WorkoutPicker({ options, selected, onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(o => o !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="workout-picker">
      {options.map(opt => (
        <button
          key={opt}
          className={`workout-chip${selected.includes(opt) ? ' active' : ''}`}
          onClick={() => toggle(opt)}
          type="button"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CheckIn({ date, log, habits, onUpdateLog, onNavigate, settingsOpen, onToggleSettings, onUpdateHabits }) {
  const todayStr = today();
  const isToday = date === todayStr;

  // Local note state with debounced save
  const [localNote, setLocalNote] = useState(log.note || '');
  const timerRef = useRef(null);
  const isEditingRef = useRef(false);
  const logRef = useRef(log);

  useEffect(() => { logRef.current = log; }, [log]);

  // Sync note when log changes from outside (data load, date navigation)
  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalNote(log.note || '');
    }
  }, [log.note]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const setHabit = (id, value) => {
    const newLog = { ...log, habits: { ...log.habits, [id]: value } };
    onUpdateLog(newLog);
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setLocalNote(val);
    isEditingRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isEditingRef.current = false;
      onUpdateLog({ ...logRef.current, note: val });
    }, 600);
  };

  return (
    <section className="checkin-section">
      <div className="checkin-header">
        <button className="nav-btn" onClick={() => onNavigate(addDays(date, -1))} title="Previous day">
          <ChevronLeft size={18} />
        </button>
        <div className="checkin-date">
          <Calendar size={16} />
          <span>{formatDisplay(date)}{isToday ? ' (Today)' : ''}</span>
        </div>
        <button
          className="nav-btn"
          onClick={() => onNavigate(addDays(date, 1))}
          disabled={date >= todayStr}
          title="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="habit-list">
        {habits.map(h => {
          const val = log.habits?.[h.id];
          if (h.type === 'multi') {
            const selected = Array.isArray(val) ? val : [];
            const checked = selected.length > 0;
            return (
              <div key={h.id} className="habit-row multi">
                <label className="habit-label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      if (!e.target.checked) setHabit(h.id, []);
                    }}
                  />
                  <span>{h.label}</span>
                  {checked && <span className="sub-badge">{selected.join(', ')}</span>}
                </label>
                <WorkoutPicker
                  options={h.options}
                  selected={selected}
                  onChange={val => setHabit(h.id, val)}
                />
              </div>
            );
          }
          return (
            <div key={h.id} className="habit-row">
              <label className="habit-label">
                <input
                  type="checkbox"
                  checked={!!val}
                  onChange={e => setHabit(h.id, e.target.checked)}
                />
                <span>{h.label}</span>
              </label>
            </div>
          );
        })}
      </div>

      <div className="note-field">
        <label className="note-label">Daily note</label>
        <textarea
          className="note-textarea"
          placeholder="Optional note for this day…"
          value={localNote}
          onChange={handleNoteChange}
          rows={3}
        />
      </div>

      <Settings
        open={settingsOpen}
        onToggle={onToggleSettings}
        habits={habits}
        onUpdateHabits={onUpdateHabits}
      />
    </section>
  );
}
