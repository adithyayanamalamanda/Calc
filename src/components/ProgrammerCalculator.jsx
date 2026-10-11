import React, { useState } from 'react';
import { sounds } from '../utils/soundEffects';
import { Delete } from 'lucide-react';

export default function ProgrammerCalculator({ onAddHistory }) {
  const [currentVal, setCurrentVal] = useState(BigInt(0));
  const [activeBase, setActiveBase] = useState('DEC'); // 'HEX', 'DEC', 'OCT', 'BIN'
  const [wordSize, setWordSize] = useState(32); // 8, 16, 32, 64
  const [pendingOp, setPendingOp] = useState(null);
  const [prevVal, setPrevVal] = useState(null);
  const [inputString, setInputString] = useState('0');

  // Masks according to word size
  const getMask = (bits) => {
    return (BigInt(1) << BigInt(bits)) - BigInt(1);
  };

  const maskValue = (val) => {
    const mask = getMask(wordSize);
    return val & mask;
  };

  // Convert current value into representations
  const hexVal = currentVal.toString(16).toUpperCase();
  const decVal = currentVal.toString(10);
  const octVal = currentVal.toString(8);
  const rawBin = currentVal.toString(2).padStart(wordSize, '0');

  // Input a character in current base
  const inputChar = (ch) => {
    sounds.playKeySound('number');
    try {
      const nextStr = inputString === '0' ? ch : inputString + ch;
      const parsed = BigInt(
        activeBase === 'HEX' ? '0x' + nextStr :
        activeBase === 'OCT' ? '0o' + nextStr :
        activeBase === 'BIN' ? '0b' + nextStr :
        nextStr
      );
      setInputString(nextStr);
      setCurrentVal(maskValue(parsed));
    } catch {
      // Invalid input for base
    }
  };

  // Toggle individual bit in the visual register
  const toggleBit = (bitIndex) => {
    sounds.playKeySound('operator');
    const bitMask = BigInt(1) << BigInt(bitIndex);
    const toggled = currentVal ^ bitMask;
    const newVal = maskValue(toggled);
    setCurrentVal(newVal);
    setInputString(
      activeBase === 'HEX' ? newVal.toString(16).toUpperCase() :
      activeBase === 'OCT' ? newVal.toString(8) :
      activeBase === 'BIN' ? newVal.toString(2) :
      newVal.toString(10)
    );
  };

  const handleOp = (op) => {
    sounds.playKeySound('operator');
    if (op === 'NOT') {
      const notVal = maskValue(~currentVal);
      setCurrentVal(notVal);
      setInputString(
        activeBase === 'HEX' ? notVal.toString(16).toUpperCase() :
        activeBase === 'OCT' ? notVal.toString(8) :
        activeBase === 'BIN' ? notVal.toString(2) :
        notVal.toString(10)
      );
      return;
    }

    setPendingOp(op);
    setPrevVal(currentVal);
    setInputString('0');
  };

  const handleEquals = () => {
    if (!pendingOp || prevVal === null) return;
    sounds.playKeySound('equals');

    let result = BigInt(0);
    const a = prevVal;
    const b = currentVal;

    switch (pendingOp) {
      case 'AND': result = a & b; break;
      case 'OR': result = a | b; break;
      case 'XOR': result = a ^ b; break;
      case 'LSH': result = a << b; break;
      case 'RSH': result = a >> b; break;
      case 'MOD': result = b !== BigInt(0) ? a % b : BigInt(0); break;
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== BigInt(0) ? a / b : BigInt(0); break;
      default: result = b;
    }

    const masked = maskValue(result);
    setCurrentVal(masked);
    setInputString(
      activeBase === 'HEX' ? masked.toString(16).toUpperCase() :
      activeBase === 'OCT' ? masked.toString(8) :
      activeBase === 'BIN' ? masked.toString(2) :
      masked.toString(10)
    );

    onAddHistory({
      expression: `${a.toString()} ${pendingOp} ${b.toString()}`,
      result: `${masked.toString()} (${activeBase})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    setPendingOp(null);
    setPrevVal(null);
  };

  const clear = () => {
    sounds.playKeySound('clear');
    setCurrentVal(BigInt(0));
    setInputString('0');
    setPendingOp(null);
    setPrevVal(null);
  };

  const backspace = () => {
    sounds.playKeySound('clear');
    if (inputString.length <= 1) {
      clear();
      return;
    }
    const nextStr = inputString.slice(0, -1);
    try {
      const parsed = BigInt(
        activeBase === 'HEX' ? '0x' + nextStr :
        activeBase === 'OCT' ? '0o' + nextStr :
        activeBase === 'BIN' ? '0b' + nextStr :
        nextStr
      );
      setInputString(nextStr);
      setCurrentVal(maskValue(parsed));
    } catch {
      clear();
    }
  };

  // Determine which keys are enabled for active base
  const isKeyDisabled = (ch) => {
    if ('01'.includes(ch)) return false;
    if ('234567'.includes(ch)) return activeBase === 'BIN';
    if ('89'.includes(ch)) return activeBase === 'BIN' || activeBase === 'OCT';
    if ('ABCDEF'.includes(ch)) return activeBase !== 'HEX';
    return false;
  };

  // Chunk bits into bytes (8 bits each) for 32-bit representation
  const renderBitMatrix = () => {
    const totalBits = Math.min(wordSize, 32);
    const groups = [];
    for (let byte = Math.floor(totalBits / 8) - 1; byte >= 0; byte--) {
      const byteBits = [];
      for (let bit = 7; bit >= 0; bit--) {
        const bitIndex = byte * 8 + bit;
        const isOne = (currentVal & (BigInt(1) << BigInt(bitIndex))) !== BigInt(0);
        byteBits.push({ index: bitIndex, isOne });
      }
      groups.push({ byteIndex: byte, bits: byteBits });
    }

    return (
      <div className="bit-groups-grid">
        {groups.map((group) => (
          <div key={group.byteIndex} className="bit-byte-group">
            <div className="bit-byte-header">
              Bits {group.byteIndex * 8 + 7}–{group.byteIndex * 8}
            </div>
            <div className="bits-row">
              {group.bits.map((b) => (
                <button
                  key={b.index}
                  onClick={() => toggleBit(b.index)}
                  className={`bit-btn ${b.isOne ? 'one' : ''}`}
                  title={`Bit ${b.index}: ${b.isOne ? '1' : '0'}. Click to toggle`}
                >
                  {b.isOne ? '1' : '0'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="calculator-wrapper programmer-container animate-fade-in">
      {/* Base Readouts Panel */}
      <div className="base-readouts glass-panel">
        <div
          className={`base-row ${activeBase === 'HEX' ? 'active' : ''}`}
          onClick={() => setActiveBase('HEX')}
        >
          <span className="base-label">HEX</span>
          <span className="base-val">{hexVal}</span>
        </div>
        <div
          className={`base-row ${activeBase === 'DEC' ? 'active' : ''}`}
          onClick={() => setActiveBase('DEC')}
        >
          <span className="base-label">DEC</span>
          <span className="base-val">{decVal}</span>
        </div>
        <div
          className={`base-row ${activeBase === 'OCT' ? 'active' : ''}`}
          onClick={() => setActiveBase('OCT')}
        >
          <span className="base-label">OCT</span>
          <span className="base-val">{octVal}</span>
        </div>
        <div
          className={`base-row ${activeBase === 'BIN' ? 'active' : ''}`}
          onClick={() => setActiveBase('BIN')}
        >
          <span className="base-label">BIN</span>
          <span className="base-val" style={{ fontSize: '0.95rem' }}>
            {rawBin.replace(/(\d{4})/g, '$1 ').trim()}
          </span>
        </div>
      </div>

      {/* Interactive Bit Register Matrix */}
      <div className="bit-matrix-card glass-panel">
        <div className="bit-matrix-title">
          <span>Interactive Bit Register (Click any bit to flip)</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[8, 16, 32, 64].map((bits) => (
              <button
                key={bits}
                onClick={() => setWordSize(bits)}
                className={`badge ${wordSize === bits ? 'active' : ''}`}
              >
                {bits}-BIT
              </button>
            ))}
          </div>
        </div>
        {renderBitMatrix()}
      </div>

      {/* Keypad Grid for Programmer */}
      <div className="programmer-keypad">
        {/* Row 1: Bitwise logic */}
        <button onClick={() => handleOp('AND')} className="calc-key fn">AND</button>
        <button onClick={() => handleOp('OR')} className="calc-key fn">OR</button>
        <button onClick={() => handleOp('NOT')} className="calc-key fn">NOT</button>
        <button onClick={() => handleOp('XOR')} className="calc-key fn">XOR</button>
        <button onClick={clear} className="calc-key clear">AC</button>
        <button onClick={backspace} className="calc-key clear"><Delete size={18} /></button>

        {/* Row 2: Hex digits A, B and Bit shift */}
        <button onClick={() => handleOp('LSH')} className="calc-key fn">LSH (≪)</button>
        <button onClick={() => handleOp('RSH')} className="calc-key fn">RSH (≫)</button>
        <button onClick={() => handleOp('MOD')} className="calc-key fn">MOD</button>
        <button
          onClick={() => inputChar('A')}
          disabled={isKeyDisabled('A')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('A') ? 0.3 : 1 }}
        >
          A
        </button>
        <button
          onClick={() => inputChar('B')}
          disabled={isKeyDisabled('B')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('B') ? 0.3 : 1 }}
        >
          B
        </button>
        <button onClick={() => handleOp('/')} className="calc-key op">÷</button>

        {/* Row 3: Hex digits C, D and 7, 8, 9 */}
        <button
          onClick={() => inputChar('C')}
          disabled={isKeyDisabled('C')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('C') ? 0.3 : 1 }}
        >
          C
        </button>
        <button
          onClick={() => inputChar('D')}
          disabled={isKeyDisabled('D')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('D') ? 0.3 : 1 }}
        >
          D
        </button>
        <button
          onClick={() => inputChar('7')}
          disabled={isKeyDisabled('7')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('7') ? 0.3 : 1 }}
        >
          7
        </button>
        <button
          onClick={() => inputChar('8')}
          disabled={isKeyDisabled('8')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('8') ? 0.3 : 1 }}
        >
          8
        </button>
        <button
          onClick={() => inputChar('9')}
          disabled={isKeyDisabled('9')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('9') ? 0.3 : 1 }}
        >
          9
        </button>
        <button onClick={() => handleOp('*')} className="calc-key op">×</button>

        {/* Row 4: Hex digits E, F and 4, 5, 6 */}
        <button
          onClick={() => inputChar('E')}
          disabled={isKeyDisabled('E')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('E') ? 0.3 : 1 }}
        >
          E
        </button>
        <button
          onClick={() => inputChar('F')}
          disabled={isKeyDisabled('F')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('F') ? 0.3 : 1 }}
        >
          F
        </button>
        <button
          onClick={() => inputChar('4')}
          disabled={isKeyDisabled('4')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('4') ? 0.3 : 1 }}
        >
          4
        </button>
        <button
          onClick={() => inputChar('5')}
          disabled={isKeyDisabled('5')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('5') ? 0.3 : 1 }}
        >
          5
        </button>
        <button
          onClick={() => inputChar('6')}
          disabled={isKeyDisabled('6')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('6') ? 0.3 : 1 }}
        >
          6
        </button>
        <button onClick={() => handleOp('-')} className="calc-key op">−</button>

        {/* Row 5: Digits 1, 2, 3 and 0, + */}
        <button
          onClick={() => inputChar('1')}
          disabled={isKeyDisabled('1')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('1') ? 0.3 : 1 }}
        >
          1
        </button>
        <button
          onClick={() => inputChar('2')}
          disabled={isKeyDisabled('2')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('2') ? 0.3 : 1 }}
        >
          2
        </button>
        <button
          onClick={() => inputChar('3')}
          disabled={isKeyDisabled('3')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('3') ? 0.3 : 1 }}
        >
          3
        </button>
        <button
          onClick={() => inputChar('0')}
          disabled={isKeyDisabled('0')}
          className="calc-key num"
          style={{ opacity: isKeyDisabled('0') ? 0.3 : 1 }}
        >
          0
        </button>
        <button onClick={() => handleOp('+')} className="calc-key op">+</button>
        <button onClick={handleEquals} className="calc-key equals">=</button>
      </div>
    </div>
  );
}
