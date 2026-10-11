import React from 'react';
import { 
  Calculator, 
  Activity, 
  Binary, 
  Scale, 
  DollarSign, 
  Volume2, 
  VolumeX, 
  History, 
  Palette, 
  HelpCircle 
} from 'lucide-react';

export default function Header({
  activeMode,
  setActiveMode,
  soundEnabled,
  setSoundEnabled,
  theme,
  setTheme,
  historyCount,
  onOpenHistory,
  onOpenShortcuts
}) {
  const modes = [
    { id: 'scientific', label: 'Scientific', icon: Calculator },
    { id: 'graphing', label: 'Graphing', icon: Activity },
    { id: 'programmer', label: 'Programmer', icon: Binary },
    { id: 'converter', label: 'Converter', icon: Scale },
    { id: 'financial', label: 'Financial', icon: DollarSign },
  ];

  const themes = [
    { id: 'onyx', label: 'Onyx Neon' },
    { id: 'cyber', label: 'Cyber Matrix' },
    { id: 'frost', label: 'Titanium Frost' },
    { id: 'sunset', label: 'Sunset Horizon' },
  ];

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  };

  return (
    <header className="app-header glass-panel">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Calculator size={22} />
        </div>
        <div>
          <h1 className="brand-title">OmniCalc Pro</h1>
          <div className="brand-subtitle">Advanced Multi-Engine Calculator</div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <nav className="nav-modes">
        {modes.map(mode => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`mode-tab-btn ${isActive ? 'active' : ''}`}
              title={mode.label}
            >
              <Icon size={16} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Header Actions */}
      <div className="header-actions">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="action-icon-btn"
          title={soundEnabled ? 'Mute Key Sounds' : 'Enable Key Sounds'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Theme Cycler */}
        <button
          onClick={cycleTheme}
          className="action-icon-btn"
          title={`Current Theme: ${themes.find(t => t.id === theme)?.label || theme}. Click to cycle.`}
        >
          <Palette size={18} />
        </button>

        {/* Keyboard Shortcuts Helper */}
        <button
          onClick={onOpenShortcuts}
          className="action-icon-btn"
          title="Keyboard Shortcuts"
        >
          <HelpCircle size={18} />
        </button>

        {/* Calculation History Drawer Button */}
        <button
          onClick={onOpenHistory}
          className="action-icon-btn"
          title="View Calculation History"
        >
          <History size={18} />
          {historyCount > 0 && (
            <span className="action-badge">{historyCount > 99 ? '99+' : historyCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
