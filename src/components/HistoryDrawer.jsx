import React, { useState } from 'react';
import { X, Trash2, Download, Copy, Check } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, history, onClearHistory }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnicalc-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <span>Calculation Tape</span>
            <span className="badge active">{history.length}</span>
          </div>
          <button onClick={onClose} className="action-icon-btn">
            <X size={18} />
          </button>
        </div>

        {/* History List */}
        <div className="history-list">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '3rem 1rem' }}>
              No calculations recorded yet. Perform calculations to see your history tape here.
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="history-card"
                onClick={() => copyToClipboard(item.result, index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="history-expr">{item.expression}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.result, index);
                    }}
                    style={{ color: 'var(--text-dim)', padding: '2px' }}
                    title="Copy result"
                  >
                    {copiedId === index ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="history-res">{item.result}</div>
                <div className="history-time">{item.timestamp}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="drawer-footer">
            <button
              onClick={exportHistory}
              className="memory-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={onClearHistory}
              className="memory-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#f87171' }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        )}
      </div>
    </>
  );
}
