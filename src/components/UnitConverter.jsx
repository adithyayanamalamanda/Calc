import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Layers } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const UNIT_DATA = {
  length: {
    name: 'Length',
    base: 'm',
    units: {
      m: { name: 'Meters (m)', factor: 1 },
      km: { name: 'Kilometers (km)', factor: 1000 },
      cm: { name: 'Centimeters (cm)', factor: 0.01 },
      mm: { name: 'Millimeters (mm)', factor: 0.001 },
      mi: { name: 'Miles (mi)', factor: 1609.344 },
      yd: { name: 'Yards (yd)', factor: 0.9144 },
      ft: { name: 'Feet (ft)', factor: 0.3048 },
      in: { name: 'Inches (in)', factor: 0.0254 },
      nmi: { name: 'Nautical Miles (nmi)', factor: 1852 },
    }
  },
  mass: {
    name: 'Weight / Mass',
    base: 'kg',
    units: {
      kg: { name: 'Kilograms (kg)', factor: 1 },
      g: { name: 'Grams (g)', factor: 0.001 },
      mg: { name: 'Milligrams (mg)', factor: 0.000001 },
      lb: { name: 'Pounds (lb)', factor: 0.45359237 },
      oz: { name: 'Ounces (oz)', factor: 0.028349523 },
      t: { name: 'Metric Tons (t)', factor: 1000 },
      st: { name: 'Stones (st)', factor: 6.35029 },
    }
  },
  temperature: {
    name: 'Temperature',
    special: true,
    units: {
      c: { name: 'Celsius (°C)' },
      f: { name: 'Fahrenheit (°F)' },
      k: { name: 'Kelvin (K)' },
    }
  },
  data: {
    name: 'Digital Storage',
    base: 'b',
    units: {
      b: { name: 'Bytes (B)', factor: 1 },
      kb: { name: 'Kilobytes (KB)', factor: 1024 },
      mb: { name: 'Megabytes (MB)', factor: 1024 ** 2 },
      gb: { name: 'Gigabytes (GB)', factor: 1024 ** 3 },
      tb: { name: 'Terabytes (TB)', factor: 1024 ** 4 },
      pb: { name: 'Petabytes (PB)', factor: 1024 ** 5 },
    }
  },
  speed: {
    name: 'Speed',
    base: 'mps',
    units: {
      mps: { name: 'Meters / second (m/s)', factor: 1 },
      kph: { name: 'Kilometers / hour (km/h)', factor: 1 / 3.6 },
      mph: { name: 'Miles / hour (mph)', factor: 0.44704 },
      knot: { name: 'Knots (kn)', factor: 0.514444 },
    }
  },
  time: {
    name: 'Time',
    base: 's',
    units: {
      ms: { name: 'Milliseconds (ms)', factor: 0.001 },
      s: { name: 'Seconds (s)', factor: 1 },
      min: { name: 'Minutes (min)', factor: 60 },
      h: { name: 'Hours (h)', factor: 3600 },
      d: { name: 'Days (d)', factor: 86400 },
      wk: { name: 'Weeks (wk)', factor: 604800 },
      yr: { name: 'Years (yr)', factor: 31536000 },
    }
  },
  area: {
    name: 'Area',
    base: 'sqm',
    units: {
      sqm: { name: 'Square Meters (m²)', factor: 1 },
      sqkm: { name: 'Square Kilometers (km²)', factor: 1e6 },
      sqft: { name: 'Square Feet (ft²)', factor: 0.092903 },
      acre: { name: 'Acres (ac)', factor: 4046.86 },
      ha: { name: 'Hectares (ha)', factor: 10000 },
    }
  }
};

export default function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');

  // Switch category defaults
  const handleCategoryChange = (newCat) => {
    sounds.playKeySound('operator');
    setCategory(newCat);
    const unitKeys = Object.keys(UNIT_DATA[newCat].units);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys[1] || unitKeys[0]);
  };

  // Convert temperature
  const convertTemperature = (val, from, to) => {
    if (isNaN(val)) return '';
    let celsius;
    if (from === 'c') celsius = val;
    else if (from === 'f') celsius = (val - 32) * (5 / 9);
    else if (from === 'k') celsius = val - 273.15;

    let result;
    if (to === 'c') result = celsius;
    else if (to === 'f') result = (celsius * 9) / 5 + 32;
    else if (to === 'k') result = celsius + 273.15;

    return Number(result.toFixed(6)).toString();
  };

  // Calculate conversion from 'from' to 'to'
  useEffect(() => {
    if (fromValue === '' || isNaN(fromValue)) {
      setToValue('');
      return;
    }

    const num = parseFloat(fromValue);
    const catData = UNIT_DATA[category];

    if (catData.special && category === 'temperature') {
      setToValue(convertTemperature(num, fromUnit, toUnit));
      return;
    }

    const fromFactor = catData.units[fromUnit]?.factor || 1;
    const toFactor = catData.units[toUnit]?.factor || 1;

    // Convert to base, then to target unit
    const inBase = num * fromFactor;
    const converted = inBase / toFactor;

    // Clean formatting
    setToValue(Number(converted.toPrecision(8)).toString());
  }, [category, fromUnit, toUnit, fromValue]);

  // Swap units
  const swapUnits = () => {
    sounds.playKeySound('operator');
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(toValue || '1');
  };

  return (
    <div className="calculator-wrapper converter-container animate-fade-in">
      {/* Category Pills */}
      <div className="converter-tabs">
        {Object.entries(UNIT_DATA).map(([catKey, cat]) => (
          <button
            key={catKey}
            onClick={() => handleCategoryChange(catKey)}
            className={`converter-tab-btn ${category === catKey ? 'active' : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Conversion Cards */}
      <div className="converter-card-grid">
        {/* From Card */}
        <div className="unit-card glass-panel">
          <div className="unit-card-title">From</div>
          <input
            type="number"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            className="unit-input"
            placeholder="0"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="unit-select"
          >
            {Object.entries(UNIT_DATA[category].units).map(([uKey, uData]) => (
              <option key={uKey} value={uKey}>
                {uData.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapUnits}
          className="swap-btn"
          title="Swap Units"
        >
          <ArrowLeftRight size={20} />
        </button>

        {/* To Card */}
        <div className="unit-card glass-panel">
          <div className="unit-card-title">To (Calculated)</div>
          <input
            type="text"
            readOnly
            value={toValue}
            className="unit-input"
            style={{ color: 'var(--accent-secondary)' }}
            placeholder="0"
          />
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="unit-select"
          >
            {Object.entries(UNIT_DATA[category].units).map(([uKey, uData]) => (
              <option key={uKey} value={uKey}>
                {uData.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick conversion formula / summary info */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        <strong>Conversion Formula: </strong>
        {category === 'temperature' ? (
          <span>Dynamic standard thermometric scale formula</span>
        ) : (
          <span>
            1 {UNIT_DATA[category].units[fromUnit]?.name} = {(
              (UNIT_DATA[category].units[fromUnit]?.factor || 1) /
              (UNIT_DATA[category].units[toUnit]?.factor || 1)
            ).toPrecision(6)} {UNIT_DATA[category].units[toUnit]?.name}
          </span>
        )}
      </div>
    </div>
  );
}
