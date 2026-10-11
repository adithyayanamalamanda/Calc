import React from 'react';
import { X, Keyboard } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '0 – 9', desc: 'Input numbers' },
    { key: '+ , - , * , /', desc: 'Arithmetic operations' },
    { key: '^', desc: 'Power / Exponent' },
    { key: '%', desc: 'Modulo / Percent' },
    { key: '( , )', desc: 'Parentheses' },
    { key: 'Enter / =', desc: 'Evaluate expression' },
    { key: 'Backspace', desc: 'Delete last character' },
    { key: 'Esc', desc: 'Clear all (AC)' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.15rem' }}>
            <Keyboard size={20} color="var(--accent-secondary)" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="action-icon-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <kbd
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {sc.key}
              </kbd>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sc.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
