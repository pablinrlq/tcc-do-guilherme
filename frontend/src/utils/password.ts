/** Regras e medição de força de senha. */

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
}

export function evaluatePassword(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = evaluatePassword(password);
  return c.length && c.upper && c.lower && c.number && c.symbol;
}

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
} {
  const c = evaluatePassword(password);
  const score = (Number(c.length) +
    Number(c.upper) +
    Number(c.lower) +
    Number(c.number) +
    Number(c.symbol)) as 0 | 1 | 2 | 3 | 4 | 5;
  const labels = ['Muito fraca', 'Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  return { score, label: labels[score] };
}

export const PASSWORD_RULE_MESSAGE =
  'A senha deve ter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.';
