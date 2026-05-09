import { useState } from 'react';
import { Settings as GearIcon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const WORKOUT_DEFAULTS = ['Running', 'Kettlebell', 'Calisthenics', 'Yoga', 'Pilates', 'Weight Lifting', 'Cycling'];

function generateId() {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function Settings({ open, onToggle, habits, onUpdateHabits }) {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('simple');

  const addHabit = () => {
    const label = newLabel.trim();
    if (!label) return;
    const habit = {
      id: generateId(),
      label,
      type: newType,
      ...(newType === 'multi' ? { options: WORKOUT_DEFAULTS } : {}),
    };
    onUpdateHabits([...habits, habit]);
    setNewLabel('');
    setNewType('simple');
  };

  const removeHabit = (id) => {
    onUpdateHabits(habits.filter(h => h.id !== id));
  };

  return (
    <section className="settings-section">
      <button className="settings-toggle" onClick={onToggle}>
        <GearIcon size={18} />
        <span>Settings</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="settings-panel">
          <h3 className="settings-subtitle">Habits</h3>
          <ul className="settings-habit-list">
            {habits.map(h => (
              <li key={h.id} className="settings-habit-row">
                <span className="settings-habit-label">{h.label}</span>
                <span className="settings-habit-type">{h.type === 'multi' ? 'Multi-select' : 'Checkbox'}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeHabit(h.id)}
                  title="Remove habit"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          <div className="add-habit-row">
            <input
              className="add-habit-input"
              placeholder="New habit name..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
            />
            <select
              className="add-habit-type"
              value={newType}
              onChange={e => setNewType(e.target.value)}
            >
              <option value="simple">Checkbox</option>
              <option value="multi">Multi-select</option>
            </select>
            <button className="add-btn" onClick={addHabit} title="Add habit">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
