const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export type PasswordCheck = {
  valid: boolean;
  message?: string;
};

/**
 * Lightweight client-side password policy. The authoritative check,
 * including breached/common-password rejection, happens on the backend.
 */
export function checkPassword(value: string): PasswordCheck {
  if (value.length < 10) return { valid: false, message: 'Use at least 10 characters' };
  if (value.length > 128) return { valid: false, message: 'Password is too long' };
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return { valid: false, message: 'Include letters and numbers' };
  }
  return { valid: true };
}

export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
