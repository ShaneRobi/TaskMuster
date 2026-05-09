import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatDisplay } from '../dateUtils';

export default function HeatmapPopover({ dateStr, anchor, log, habits, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // position below/above anchor
  const style = {
    position: 'fixed',
    top: anchor.bottom + 8,
    left: Math.max(8, anchor.left - 100),
    zIndex: 1000,
  };

  return (
    <div className="popover" style={style} ref={ref}>
      <div className="popover-header">
        <span className="popover-date">{formatDisplay(dateStr)}</span>
        <button className="popover-close" onClick={onClose}><X size={14} /></button>
      </div>
      <ul className="popover-habits">
        {habits.map(h => {
          const v = log.habits?.[h.id];
          const done = h.type === 'multi' ? (Array.isArray(v) && v.length > 0) : !!v;
          return (
            <li key={h.id} className={`popover-habit${done ? ' done' : ''}`}>
              <span className="popover-check">{done ? '✓' : '○'}</span>
              <span>{h.label}</span>
              {h.type === 'multi' && Array.isArray(v) && v.length > 0 && (
                <span className="popover-subtypes">({v.join(', ')})</span>
              )}
            </li>
          );
        })}
      </ul>
      {log.note && (
        <div className="popover-note">
          <span className="popover-note-label">Note:</span> {log.note}
        </div>
      )}
      {!log.note && habits.every(h => {
        const v = log.habits?.[h.id];
        return h.type === 'multi' ? !(Array.isArray(v) && v.length > 0) : !v;
      }) && (
        <p className="popover-empty">No activity logged.</p>
      )}
    </div>
  );
}
