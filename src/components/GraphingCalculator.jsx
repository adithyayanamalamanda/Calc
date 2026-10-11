import React, { useState, useEffect, useRef } from 'react';
import { evaluateExpression } from '../utils/mathEngine';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

export default function GraphingCalculator() {
  const canvasRef = useRef(null);
  const [equation, setEquation] = useState('sin(x)');
  const [scale, setScale] = useState(40); // pixels per unit
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // offset from center
  const [cursorPos, setCursorPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [plotError, setPlotError] = useState(null);

  const presets = [
    { label: 'Sine Wave', eq: 'sin(x)' },
    { label: 'Parabola', eq: 'x^2 - 4' },
    { label: 'Harmonic Oscillator', eq: 'sin(3*x) * exp(-0.2*abs(x))' },
    { label: 'Cubic Curve', eq: 'x^3 - 3*x' },
    { label: 'Gaussian Bell', eq: 'exp(-x^2 / 2)' },
    { label: 'Witch of Agnesi', eq: '4 / (x^2 + 1)' },
  ];

  // Draw coordinate plane and graph on canvas
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2 + origin.x;
    const centerY = height / 2 + origin.y;

    // Clear background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Calculate grid spacing based on scale
    let unitStep = 1;
    if (scale < 20) unitStep = 5;
    if (scale < 8) unitStep = 10;
    if (scale > 100) unitStep = 0.5;

    const gridPixelStep = unitStep * scale;

    // Draw Gridlines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

    // Vertical grid lines
    const startX = ((centerX % gridPixelStep) + gridPixelStep) % gridPixelStep;
    for (let x = startX; x < width; x += gridPixelStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    const startY = ((centerY % gridPixelStep) + gridPixelStep) % gridPixelStep;
    for (let y = startY; y < height; y += gridPixelStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Primary Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw Axis Numbers / Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px JetBrains Mono, monospace';

    // X-Axis tick numbers
    for (let x = startX; x < width; x += gridPixelStep) {
      const mathX = (x - centerX) / scale;
      if (Math.abs(mathX) > 0.01) {
        ctx.fillText(mathX.toFixed(unitStep < 1 ? 1 : 0), x + 4, centerY + 14);
      }
    }

    // Y-Axis tick numbers
    for (let y = startY; y < height; y += gridPixelStep) {
      const mathY = -(y - centerY) / scale;
      if (Math.abs(mathY) > 0.01) {
        ctx.fillText(mathY.toFixed(unitStep < 1 ? 1 : 0), centerX + 6, y - 4);
      }
    }

    // Draw Function Curve
    try {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4'; // Cyan neon curve
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
      ctx.shadowBlur = 10;

      let hasStarted = false;
      let lastY = null;

      // Sample points across pixels
      for (let px = 0; px <= width; px += 2) {
        const mathX = (px - centerX) / scale;

        // Substitute x into equation
        const exprWithX = equation.replace(/\bx\b/gi, `(${mathX})`);
        let mathY;
        try {
          mathY = evaluateExpression(exprWithX, false); // radians for functions
        } catch {
          mathY = NaN;
        }

        if (Number.isFinite(mathY)) {
          const py = centerY - mathY * scale;

          // Discontinuity check (e.g. 1/x asymptote jumps)
          if (lastY !== null && Math.abs(py - lastY) > height * 0.8) {
            hasStarted = false;
          }

          if (!hasStarted) {
            ctx.moveTo(px, py);
            hasStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
          lastY = py;
        } else {
          hasStarted = false;
          lastY = null;
        }
      }

      ctx.stroke();
      ctx.restore();
      setPlotError(null);
    } catch (err) {
      setPlotError(err.message || 'Cannot plot function');
    }

    // Draw Crosshair if hovering
    if (cursorPos) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cursorPos.px, 0);
      ctx.lineTo(cursorPos.px, height);
      ctx.moveTo(0, cursorPos.py);
      ctx.lineTo(width, cursorPos.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(cursorPos.px, cursorPos.py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Resize canvas according to device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawGraph();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw whenever equation, scale, origin, or cursor changes
  useEffect(() => {
    drawGraph();
  }, [equation, scale, origin, cursorPos]);

  // Mouse interaction handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - origin.x, y: e.clientY - origin.y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (isDragging) {
      setOrigin({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    const centerX = canvas.width / 2 + origin.x;
    const centerY = canvas.height / 2 + origin.y;
    const mathX = (px - centerX) / scale;
    const mathY = -(py - centerY) / scale;

    setCursorPos({
      px,
      py,
      x: mathX.toFixed(2),
      y: mathY.toFixed(2)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 4), 300));
  };

  const resetView = () => {
    setScale(40);
    setOrigin({ x: 0, y: 0 });
  };

  return (
    <div className="calculator-wrapper graph-container animate-fade-in">
      {/* Controls & Equation Bar */}
      <div className="graph-controls glass-panel">
        <div className="equation-input-group">
          <span className="equation-prefix">f(x) =</span>
          <input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g. sin(x), x^2 - 4"
            className="equation-input"
          />
        </div>

        {/* Preset Function Chips */}
        <div className="graph-presets">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setEquation(preset.eq)}
              className="preset-chip"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {plotError && (
        <div style={{ color: '#f87171', fontSize: '0.85rem', padding: '0 0.5rem' }}>
          Equation syntax error: {plotError}
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setCursorPos(null);
          }}
          onWheel={handleWheel}
        />

        {/* Floating Toolbar */}
        <div className="graph-toolbar">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.25, 300))}
            className="graph-tool-btn"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s * 0.8, 4))}
            className="graph-tool-btn"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button onClick={resetView} className="graph-tool-btn" title="Reset View">
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Dynamic Cursor Info readout */}
        {cursorPos && (
          <div className="graph-cursor-info">
            X: {cursorPos.x} | Y: {cursorPos.y}
          </div>
        )}
      </div>
    </div>
  );
}
