import React, { useState, useEffect, useRef } from 'react';
import { evaluateExpression, formatResult } from '../utils/mathEngine';
import { sounds } from '../utils/soundEffects';
import { Delete, CornerDownLeft, RotateCcw } from 'lucide-react';

export default function ScientificCalculator({ onAddHistory }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [livePreview, setLivePreview] = useState('');
  const [isDegree, setIsDegree] = useState(true);
  const [isSecond, setIsSecond] = useState(false);
  const [memory, setMemory] = useState(0);
  const [hasMemory, setHasMemory] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  // Compute live preview whenever expression changes
  useEffect(() => {
    if (!expression.trim()) {
      setLivePreview('');
      return;
    }

    try {
      // Don't preview if ends with dangling operator
      const trimmed = expression.trim();
      const lastChar = trimmed[trimmed.length - 1];
      if ('+-*/^%('.includes(lastChar)) {
        return;
      }
      const preview = evaluateExpression(trimmed, isDegree);
      if (Number.isFinite(preview)) {
        setLivePreview(formatResult(preview));
      } else {
        setLivePreview('');
      }
    } catch {
      setLivePreview('');
    }
  }, [expression, isDegree]);

  // Key event listener for physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input elsewhere
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key;

      if (key >= '0' && key <= '9') {
        inputChar(key, 'number');
      } else if (key === '.') {
        inputChar('.', 'number');
      } else if (key === '+') {
        inputChar('+', 'operator');
      } else if (key === '-') {
        inputChar('−', 'operator');
      } else if (key === '*') {
        inputChar('×', 'operator');
      } else if (key === '/') {
        e.preventDefault();
        inputChar('÷', 'operator');
      } else if (key === '^') {
        inputChar('^', 'operator');
      } else if (key === '%') {
        inputChar('%', 'operator');
      } else if (key === '(' || key === ')') {
        inputChar(key, 'operator');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        backspace();
      } else if (key === 'Escape') {
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, result, justCalculated, isDegree]);

  const inputChar = (char, soundType = 'number') => {
    sounds.playKeySound(soundType);

    if (justCalculated) {
      // If user starts with an operator, continue with previous result
      if ('+−×÷^%'.includes(char)) {
        setExpression(result + char);
      } else {
        setExpression(char);
      }
      setJustCalculated(false);
      return;
    }

    setExpression((prev) => prev + char);
  };

  const inputFunction = (fnName) => {
    sounds.playKeySound('operator');
    if (justCalculated) {
      setExpression(`${fnName}(${result})`);
      setJustCalculated(false);
      return;
    }
    setExpression((prev) => `${prev}${fnName}(`);
  };

  const calculate = () => {
    if (!expression.trim()) return;

    try {
      const res = evaluateExpression(expression, isDegree);
      const formatted = formatResult(res);

      sounds.playKeySound('equals');
      setResult(formatted);
      setLivePreview('');
      setJustCalculated(true);

      onAddHistory({
        expression,
        result: formatted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err) {
      sounds.playKeySound('error');
      setResult(err.message || 'Error');
      setLivePreview('');
    }
  };

  const clearAll = () => {
    sounds.playKeySound('clear');
    setExpression('');
    setResult('0');
    setLivePreview('');
    setJustCalculated(false);
  };

  const backspace = () => {
    sounds.playKeySound('clear');
    if (justCalculated) {
      setExpression('');
      setJustCalculated(false);
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  const toggleSign = () => {
    sounds.playKeySound('operator');
    if (!expression) {
      setExpression('-');
      return;
    }
    if (expression.startsWith('-(') && expression.endsWith(')')) {
      setExpression(expression.slice(2, -1));
    } else {
      setExpression(`-(${expression})`);
    }
  };

  // Memory management
  const memoryClear = () => {
    sounds.playKeySound('clear');
    setMemory(0);
    setHasMemory(false);
  };

  const memoryRecall = () => {
    sounds.playKeySound('number');
    if (hasMemory) {
      inputChar(String(memory), 'number');
    }
  };

  const memoryStore = () => {
    sounds.playKeySound('operator');
    try {
      const val = parseFloat(result) || (expression ? evaluateExpression(expression, isDegree) : 0);
      setMemory(val);
      setHasMemory(true);
    } catch {
      // Ignore
    }
  };

  const memoryAdd = () => {
    sounds.playKeySound('operator');
    try {
      const val = parseFloat(result) || (expression ? evaluateExpression(expression, isDegree) : 0);
      setMemory((prev) => prev + val);
      setHasMemory(true);
    } catch {
      // Ignore
    }
  };

  const memorySub = () => {
    sounds.playKeySound('operator');
    try {
      const val = parseFloat(result) || (expression ? evaluateExpression(expression, isDegree) : 0);
      setMemory((prev) => prev - val);
      setHasMemory(true);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="calculator-wrapper animate-fade-in">
      {/* Screen Display */}
      <div className="calc-screen">
        <div className="screen-header">
          <div className="status-badges">
            <button
              onClick={() => setIsDegree(!isDegree)}
              className={`badge ${isDegree ? 'active' : ''}`}
              title="Toggle Degree / Radian mode"
            >
              {isDegree ? 'DEG' : 'RAD'}
            </button>
            <span className={`badge ${hasMemory ? 'active' : ''}`} title="Memory Register">
              M
            </span>
            {isSecond && <span className="badge active">2nd</span>}
          </div>
          <button
            onClick={() => setIsSecond(!isSecond)}
            className={`badge ${isSecond ? 'active' : ''}`}
            title="Toggle inverse / secondary scientific functions"
          >
            INV
          </button>
        </div>

        {/* Expression */}
        <div className="screen-expression">
          {expression || ' '}
        </div>

        {/* Live Preview or Evaluated Result */}
        <div className="screen-result">
          {result}
        </div>

        {/* Live Preview text */}
        {livePreview && livePreview !== result && (
          <div className="screen-live-preview">
            = {livePreview}
          </div>
        )}
      </div>

      {/* Memory Operations Bar */}
      <div className="memory-bar">
        <button onClick={memoryClear} className={`memory-btn ${hasMemory ? 'has-memory' : ''}`}>
          MC
        </button>
        <button onClick={memoryRecall} className={`memory-btn ${hasMemory ? 'has-memory' : ''}`}>
          MR
        </button>
        <button onClick={memoryAdd} className="memory-btn">
          M+
        </button>
        <button onClick={memorySub} className="memory-btn">
          M−
        </button>
        <button onClick={memoryStore} className="memory-btn">
          MS
        </button>
      </div>

      {/* Main Scientific Keypad Grid */}
      <div className="keypad-grid scientific">
        {/* Row 1 */}
        <button
          onClick={() => setIsSecond(!isSecond)}
          className={`calc-key fn ${isSecond ? 'active-toggle' : ''}`}
          title="2nd Function Key"
        >
          2nd
        </button>
        <button onClick={() => inputChar('π', 'fn')} className="calc-key fn">
          π
        </button>
        <button onClick={() => inputChar('e', 'fn')} className="calc-key fn">
          e
        </button>
        <button onClick={clearAll} className="calc-key clear">
          AC
        </button>
        <button onClick={backspace} className="calc-key clear">
          <Delete size={20} />
        </button>
        <button onClick={() => inputChar('÷', 'operator')} className="calc-key op">
          ÷
        </button>

        {/* Row 2 */}
        <button
          onClick={() => inputFunction(isSecond ? 'asin' : 'sin')}
          className="calc-key fn"
        >
          {isSecond ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => inputFunction(isSecond ? 'acos' : 'cos')}
          className="calc-key fn"
        >
          {isSecond ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => inputFunction(isSecond ? 'atan' : 'tan')}
          className="calc-key fn"
        >
          {isSecond ? 'tan⁻¹' : 'tan'}
        </button>
        <button onClick={() => inputChar('7', 'number')} className="calc-key num">
          7
        </button>
        <button onClick={() => inputChar('8', 'number')} className="calc-key num">
          8
        </button>
        <button onClick={() => inputChar('9', 'number')} className="calc-key num">
          9
        </button>

        {/* Row 3 */}
        <button
          onClick={() => inputFunction(isSecond ? 'exp' : 'ln')}
          className="calc-key fn"
        >
          {isSecond ? 'eˣ' : 'ln'}
        </button>
        <button
          onClick={() => (isSecond ? inputChar('10^(', 'fn') : inputFunction('log'))}
          className="calc-key fn"
        >
          {isSecond ? '10ˣ' : 'log'}
        </button>
        <button
          onClick={() => inputFunction(isSecond ? 'cbrt' : 'sqrt')}
          className="calc-key fn"
        >
          {isSecond ? '∛x' : '√x'}
        </button>
        <button onClick={() => inputChar('4', 'number')} className="calc-key num">
          4
        </button>
        <button onClick={() => inputChar('5', 'number')} className="calc-key num">
          5
        </button>
        <button onClick={() => inputChar('6', 'number')} className="calc-key num">
          6
        </button>

        {/* Row 4 */}
        <button
          onClick={() => inputChar(isSecond ? '^3' : '^2', 'fn')}
          className="calc-key fn"
        >
          {isSecond ? 'x³' : 'x²'}
        </button>
        <button onClick={() => inputChar('^', 'fn')} className="calc-key fn">
          xʸ
        </button>
        <button onClick={() => inputChar('!', 'fn')} className="calc-key fn">
          n!
        </button>
        <button onClick={() => inputChar('1', 'number')} className="calc-key num">
          1
        </button>
        <button onClick={() => inputChar('2', 'number')} className="calc-key num">
          2
        </button>
        <button onClick={() => inputChar('3', 'number')} className="calc-key num">
          3
        </button>

        {/* Row 5 */}
        <button onClick={() => inputFunction('abs')} className="calc-key fn">
          |x|
        </button>
        <button onClick={() => inputChar('(', 'operator')} className="calc-key op">
          (
        </button>
        <button onClick={() => inputChar(')', 'operator')} className="calc-key op">
          )
        </button>
        <button onClick={toggleSign} className="calc-key num">
          ±
        </button>
        <button onClick={() => inputChar('0', 'number')} className="calc-key num">
          0
        </button>
        <button onClick={() => inputChar('.', 'number')} className="calc-key num">
          .
        </button>

        {/* Row 6: Multiplication, Subtraction, Addition, Modulo, Equals */}
        <button onClick={() => inputChar('×', 'operator')} className="calc-key op">
          ×
        </button>
        <button onClick={() => inputChar('−', 'operator')} className="calc-key op">
          −
        </button>
        <button onClick={() => inputChar('+', 'operator')} className="calc-key op">
          +
        </button>
        <button onClick={() => inputChar('%', 'operator')} className="calc-key op">
          %
        </button>
        <button onClick={calculate} className="calc-key equals span-2">
          =
        </button>
      </div>
    </div>
  );
}
