export interface PasswordRule {
  id: string;
  label: string;
  validator: (pwd: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 8 characters in length',
    validator: (pwd) => pwd.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter (A-Z)',
    validator: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter (a-z)',
    validator: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'special',
    label: 'At least one special character or number (!@#$%... / 0-9)',
    validator: (pwd) => /[^A-Za-z]/.test(pwd),
  },
];

export function validatePasswordCompliance(password: string): {
  isValid: boolean;
  score: number;
  checks: Record<string, boolean>;
} {
  const checks: Record<string, boolean> = {};
  let score = 0;

  for (const rule of PASSWORD_RULES) {
    const passed = rule.validator(password);
    checks[rule.id] = passed;
    if (passed) score++;
  }

  return {
    isValid: score === PASSWORD_RULES.length,
    score,
    checks,
  };
}
