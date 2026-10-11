// Robust mathematical expression evaluator and tokenizer

// Factorial helper
export function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (!Number.isInteger(n)) {
    // Gamma function approximation for non-integers if needed, or simple factorial
    return gamma(n + 1);
  }
  if (n > 170) return Infinity; // JS Number overflow
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Stirling / Lanczos Gamma approximation
function gamma(z) {
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Format numbers cleanly, avoiding JS float artifacts like 0.1 + 0.2 = 0.30000000000000004
export function formatResult(num, precision = 12) {
  if (num === null || num === undefined || Number.isNaN(num)) return 'Error';
  if (!Number.isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

  // Fix float precision rounding
  const rounded = Number(num.toPrecision(precision));
  
  // If number is huge or tiny, use scientific notation
  const abs = Math.abs(rounded);
  if (abs !== 0 && (abs >= 1e14 || abs < 1e-9)) {
    return rounded.toExponential(6).replace(/\.?0+e/, 'e');
  }

  // Normal formatting with reasonable decimal trim
  return String(parseFloat(rounded.toFixed(10)));
}

// Tokenize and evaluate expressions safely
export function evaluateExpression(expr, isDegree = true) {
  if (!expr || typeof expr !== 'string') return 0;

  let sanitized = expr.trim();
  if (sanitized === '') return 0;

  // Replace visual symbols with standard representations
  sanitized = sanitized
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/φ/g, `(1.618033988749895)`)
    .replace(/\be\b/g, `(${Math.E})`);

  // Handle implicit multiplication: e.g. 2(3), (2)(3), 2sin(30), 5sqrt(9)
  sanitized = sanitized
    .replace(/(\d)(\()/g, '$1*(')
    .replace(/(\))(\d)/g, '$1*$2')
    .replace(/(\))(\()/g, '$1*(')
    .replace(/(\d)([a-zA-Z])/g, '$1*$2');

  // Parse and evaluate with context
  try {
    const tokens = tokenize(sanitized);
    const rpn = shuntingYard(tokens, isDegree);
    const result = evaluateRPN(rpn, isDegree);
    return result;
  } catch (err) {
    throw new Error(err.message || 'Syntax Error');
  }
}

// Tokenizer
function tokenize(str) {
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    const ch = str[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (including decimals and scientific e)
    if (/\d|\./.test(ch)) {
      let numStr = '';
      while (i < str.length && (/[\d\.]/.test(str[i]))) {
        numStr += str[i++];
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Identifiers (functions or constants)
    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        id += str[i++];
      }
      id = id.toLowerCase();
      tokens.push({ type: 'FUNCTION', value: id });
      continue;
    }

    // Factorial postfix operator
    if (ch === '!') {
      tokens.push({ type: 'POSTFIX', value: '!' });
      i++;
      continue;
    }

    // Operators
    if ('+-*/^%'.includes(ch)) {
      // Check for unary minus / plus
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || prev.type === 'OPERATOR' || (prev.type === 'PAREN' && prev.value === '(');
      if (isUnary && (ch === '-' || ch === '+')) {
        tokens.push({ type: 'UNARY', value: ch === '-' ? 'neg' : 'pos' });
      } else {
        tokens.push({ type: 'OPERATOR', value: ch });
      }
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'PAREN', value: ch });
      i++;
      continue;
    }

    // Commas
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

// Shunting-yard algorithm
const PRECEDENCE = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '%': 2,
  '^': 3,
  'neg': 4,
  'pos': 4
};

function shuntingYard(tokens) {
  const output = [];
  const opStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'NUMBER') {
      output.push(token);
    } else if (token.type === 'FUNCTION') {
      opStack.push(token);
    } else if (token.type === 'POSTFIX') {
      output.push(token);
    } else if (token.type === 'UNARY') {
      opStack.push(token);
    } else if (token.type === 'OPERATOR') {
      const p1 = PRECEDENCE[token.value] || 0;
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'OPERATOR' || top.type === 'UNARY') {
          const p2 = PRECEDENCE[top.value] || 0;
          // ^ is right-associative, others left
          if (token.value === '^' ? p1 < p2 : p1 <= p2) {
            output.push(opStack.pop());
          } else {
            break;
          }
        } else {
          break;
        }
      }
      opStack.push(token);
    } else if (token.type === 'PAREN' && token.value === '(') {
      opStack.push(token);
    } else if (token.type === 'PAREN' && token.value === ')') {
      let matched = false;
      while (opStack.length > 0) {
        const top = opStack.pop();
        if (top.type === 'PAREN' && top.value === '(') {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) {
        throw new Error('Mismatched parentheses');
      }
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
        output.push(opStack.pop());
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop();
    if (top.type === 'PAREN') {
      throw new Error('Mismatched parentheses');
    }
    output.push(top);
  }

  return output;
}

// Evaluate Reverse Polish Notation
function evaluateRPN(rpn, isDegree) {
  const stack = [];

  const toRad = (val) => (isDegree ? (val * Math.PI) / 180 : val);
  const fromRad = (val) => (isDegree ? (val * 180) / Math.PI : val);

  for (let i = 0; i < rpn.length; i++) {
    const token = rpn[i];

    if (token.type === 'NUMBER') {
      stack.push(token.value);
    } else if (token.type === 'UNARY') {
      if (stack.length < 1) throw new Error('Invalid syntax');
      const a = stack.pop();
      stack.push(token.value === 'neg' ? -a : a);
    } else if (token.type === 'POSTFIX') {
      if (token.value === '!') {
        if (stack.length < 1) throw new Error('Invalid syntax');
        const a = stack.pop();
        stack.push(factorial(a));
      }
    } else if (token.type === 'OPERATOR') {
      if (stack.length < 2) throw new Error('Invalid syntax');
      const b = stack.pop();
      const a = stack.pop();

      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) throw new Error('Cannot divide by zero');
          stack.push(a / b);
          break;
        case '%':
          stack.push(a % b);
          break;
        case '^':
          stack.push(Math.pow(a, b));
          break;
        default:
          throw new Error(`Unknown operator: ${token.value}`);
      }
    } else if (token.type === 'FUNCTION') {
      if (stack.length < 1) throw new Error('Invalid function arguments');
      const a = stack.pop();

      switch (token.value) {
        case 'sin':
          stack.push(Math.sin(toRad(a)));
          break;
        case 'cos':
          stack.push(Math.cos(toRad(a)));
          break;
        case 'tan': {
          const res = Math.tan(toRad(a));
          if (Math.abs(res) > 1e14) throw new Error('Undefined (tan asymptote)');
          stack.push(res);
          break;
        }
        case 'asin':
          if (a < -1 || a > 1) throw new Error('Domain error for asin');
          stack.push(fromRad(Math.asin(a)));
          break;
        case 'acos':
          if (a < -1 || a > 1) throw new Error('Domain error for acos');
          stack.push(fromRad(Math.acos(a)));
          break;
        case 'atan':
          stack.push(fromRad(Math.atan(a)));
          break;
        case 'sinh':
          stack.push(Math.sinh(a));
          break;
        case 'cosh':
          stack.push(Math.cosh(a));
          break;
        case 'tanh':
          stack.push(Math.tanh(a));
          break;
        case 'ln':
          if (a <= 0) throw new Error('Domain error for ln (must be > 0)');
          stack.push(Math.log(a));
          break;
        case 'log':
        case 'log10':
          if (a <= 0) throw new Error('Domain error for log (must be > 0)');
          stack.push(Math.log10(a));
          break;
        case 'log2':
          if (a <= 0) throw new Error('Domain error for log2');
          stack.push(Math.log2(a));
          break;
        case 'sqrt':
          if (a < 0) throw new Error('Domain error for sqrt (negative number)');
          stack.push(Math.sqrt(a));
          break;
        case 'cbrt':
          stack.push(Math.cbrt(a));
          break;
        case 'exp':
          stack.push(Math.exp(a));
          break;
        case 'abs':
          stack.push(Math.abs(a));
          break;
        case 'floor':
          stack.push(Math.floor(a));
          break;
        case 'ceil':
          stack.push(Math.ceil(a));
          break;
        case 'round':
          stack.push(Math.round(a));
          break;
        default:
          throw new Error(`Unknown function: ${token.value}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Malformed expression');
  }

  return stack[0];
}
