import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScientificCalculator from './components/ScientificCalculator';
import GraphingCalculator from './components/GraphingCalculator';
import ProgrammerCalculator from './components/ProgrammerCalculator';
import UnitConverter from './components/UnitConverter';
import FinancialCalculator from './components/FinancialCalculator';
import HistoryDrawer from './components/HistoryDrawer';
import ShortcutsModal from './components/ShortcutsModal';
import { sounds } from './utils/soundEffects';
import './App.css';

export default function App() {
  const [activeMode, setActiveMode] = useState('scientific');
  
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnicalc_theme') || 'onyx';
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('omnicalc_sound') !== 'false';
  });

  // History state with localStorage persistence
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('omnicalc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Sync theme with body data attribute & localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('omnicalc_theme', theme);
  }, [theme]);

  // Sync sound setting
  useEffect(() => {
    sounds.enabled = soundEnabled;
    localStorage.setItem('omnicalc_sound', String(soundEnabled));
  }, [soundEnabled]);

  // Sync history with localStorage
  useEffect(() => {
    localStorage.setItem('omnicalc_history', JSON.stringify(history.slice(0, 100)));
  }, [history]);

  const addHistory = (item) => {
    setHistory((prev) => [item, ...prev].slice(0, 100));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <Header
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        theme={theme}
        setTheme={setTheme}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Mode View */}
      <main className="main-content">
        {activeMode === 'scientific' && (
          <ScientificCalculator onAddHistory={addHistory} />
        )}
        {activeMode === 'graphing' && (
          <GraphingCalculator />
        )}
        {activeMode === 'programmer' && (
          <ProgrammerCalculator onAddHistory={addHistory} />
        )}
        {activeMode === 'converter' && (
          <UnitConverter />
        )}
        {activeMode === 'financial' && (
          <FinancialCalculator />
        )}
      </main>

      {/* Calculation Tape Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={clearHistory}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
