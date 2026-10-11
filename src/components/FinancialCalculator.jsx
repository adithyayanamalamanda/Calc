import React, { useState } from 'react';
import { DollarSign, Percent, Calendar, PieChart } from 'lucide-react';

export default function FinancialCalculator() {
  const [loanAmount, setLoanAmount] = useState(250000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [tenureYears, setTenureYears] = useState(15);

  // EMI formula calculation: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const P = Number(loanAmount) || 0;
  const annualR = Number(interestRate) || 0;
  const n = (Number(tenureYears) || 0) * 12; // Total months
  const monthlyR = annualR / (12 * 100);

  let emi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (P > 0 && n > 0) {
    if (monthlyR === 0) {
      emi = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      const compound = Math.pow(1 + monthlyR, n);
      emi = (P * monthlyR * compound) / (compound - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - P;
    }
  }

  const principalRatio = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
  const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="calculator-wrapper financial-container animate-fade-in">
      {/* Input Parameters Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: '#fff' }}>
          Loan & Mortgage Parameters
        </h3>

        {/* Loan Amount */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">Principal Loan Amount</span>
            <span className="form-value-display">{formatCurrency(loanAmount)}</span>
          </div>
          <input
            type="range"
            min="5000"
            max="1500000"
            step="5000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="custom-slider"
          />
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
            className="custom-num-input"
          />
        </div>

        {/* Interest Rate */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">Annual Interest Rate</span>
            <span className="form-value-display">{interestRate}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="custom-slider"
          />
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
            className="custom-num-input"
          />
        </div>

        {/* Tenure */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">Loan Term (Tenure)</span>
            <span className="form-value-display">{tenureYears} Years ({tenureYears * 12} mo)</span>
          </div>
          <input
            type="range"
            min="1"
            max="35"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="custom-slider"
          />
          <input
            type="number"
            value={tenureYears}
            onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value)))}
            className="custom-num-input"
          />
        </div>
      </div>

      {/* Calculated Breakdown Card */}
      <div className="financial-results-card glass-panel">
        <div>
          <div className="emi-highlight">
            <div className="emi-label">Estimated Monthly Payment (EMI)</div>
            <div className="emi-value">{formatCurrency(emi)}</div>
          </div>

          {/* Breakdown Rows */}
          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="indicator-dot" style={{ background: 'var(--accent-primary)' }} />
              Principal Amount
            </span>
            <span className="breakdown-val">{formatCurrency(P)}</span>
          </div>

          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="indicator-dot" style={{ background: 'var(--accent-action)' }} />
              Total Interest Payable
            </span>
            <span className="breakdown-val" style={{ color: 'var(--accent-action)' }}>
              {formatCurrency(totalInterest)}
            </span>
          </div>

          <div className="breakdown-row">
            <span className="breakdown-label">Total Payment (Principal + Interest)</span>
            <span className="breakdown-val">{formatCurrency(totalPayment)}</span>
          </div>

          {/* Visual Ratio Bar */}
          <div className="ratio-bar-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
              <span>Principal: {principalRatio.toFixed(1)}%</span>
              <span>Interest: {interestRatio.toFixed(1)}%</span>
            </div>
            <div className="ratio-bar">
              <div
                className="ratio-segment-principal"
                style={{ width: `${principalRatio}%` }}
                title={`Principal: ${principalRatio.toFixed(1)}%`}
              />
              <div
                className="ratio-segment-interest"
                style={{ width: `${interestRatio}%` }}
                title={`Interest: ${interestRatio.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          * Calculation based on standard amortized compound monthly reducing balance.
        </div>
      </div>
    </div>
  );
}
