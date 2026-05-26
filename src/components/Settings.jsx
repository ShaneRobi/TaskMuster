import { useState } from 'react';
import { Settings as GearIcon, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';

const WORKOUT_DEFAULTS = ['Running', 'Kettlebell', 'Calisthenics', 'Yoga', 'Pilates', 'Weight Lifting', 'Cycling'];

function generateId() {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function EditRow({ habit, onSave, onCancel }) {
  const [label, setLabel] = useState(habit.label);
  const [type, setType] = useState(habit.type);
  const [optionsStr, setOptionsStr] = useState(
    habit.options ? habit.options.join(', ') : WORKOUT_DEFAULTS.join(', ')
  );

  const save = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const options = type === 'multi'
      ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;
    onSave({ ...habit, label: trimmed, type, options });
  };

  return (
    <li className="settings-habit-row settings-habit-edit">
      <div className="edit-row-fields">
        <input
          className="add-habit-input edit-label-input"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
          autoFocus
        />
        <select
          className="add-habit-type"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="simple">Checkbox</option>
          <option value="multi">Multi-select</option>
        </select>
      </div>
      {type === 'multi' && (
        <input
          className="add-habit-input edit-options-input"
          value={optionsStr}
          onChange={e => setOptionsStr(e.target.value)}
          placeholder="Options (comma separated)"
        />
      )}
      <div className="edit-row-actions">
        <button className="edit-save-btn" onClick={save} title="Save">
          <Check size={15} />
        </button>
        <button className="remove-btn" onClick={onCancel} title="Cancel">
          <X size={15} />
        </button>
      </div>
    </li>
  );
}

export default function Settings({ open, onToggle, habits, onUpdateHabits }) {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('simple');
  const [newOptionsStr, setNewOptionsStr] = useState(WORKOUT_DEFAULTS.join(', '));
  const [editingId, setEditingId] = useState(null);

  const addHabit = () => {
    const label = newLabel.trim();
    if (!label) return;
    const options = newType === 'multi'
      ? newOptionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;
    const habit = {
      id: generateId(),
      label,
      type: newType,
      ...(newType === 'multi' ? { options: options.length ? options : WORKOUT_DEFAULTS } : {}),
    };
    onUpdateHabits([...habits, habit]);
    setNewLabel('');
    setNewType('simple');
    setNewOptionsStr(WORKOUT_DEFAULTS.join(', '));
  };

  const removeHabit = (id) => {
    onUpdateHabits(habits.filter(h => h.id !== id));
  };

  const saveEdit = (updated) => {
    onUpdateHabits(habits.map(h => h.id === updated.id ? updated : h));
    setEditingId(null);
  };

  return (
    <section className="settings-section">
      <button className="settings-toggle" onClick={onToggle}>
        <GearIcon size={18} />
        <span>Manage Habits & Tasks </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="settings-panel">
          <h3 className="settings-subtitle">Habits</h3>
          <ul className="settings-habit-list">
            {habits.map(h =>
              editingId === h.id ? (
                <EditRow
                  key={h.id}
                  habit={h}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <li key={h.id} className="settings-habit-row">
                  <span className="settings-habit-label">{h.label}</span>
                  <span className="settings-habit-type">{h.type === 'multi' ? 'Multi-select' : 'Checkbox'}</span>
                  <button
                    className="edit-btn"
                    onClick={() => setEditingId(h.id)}
                    title="Edit habit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeHabit(h.id)}
                    title="Remove habit"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            )}
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
          {newType === 'multi' && (
            <input
              className="add-habit-input edit-options-input"
              value={newOptionsStr}
              onChange={e => setNewOptionsStr(e.target.value)}
              placeholder="Options (comma separated)"
            />
          )}
        </div>
      )}
    </section>
  );
}
