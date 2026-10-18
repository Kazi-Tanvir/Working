// src/lib/bd-phone.ts
// BD Phone normalization and validation

const BANGLA_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

/**
 * Normalizes any Bangladeshi phone input:
 * - Converts Bengali numerals (০-৯) to English (0-9)
 * - Strips +88 or 88 country code prefix
 * - Strips whitespace, hyphens, parentheses, and dots
 */
export function normalizeBdPhone(input: string): string {
  if (!input) return '';

  // Convert Bangla numerals to English digits
  let cleaned = input
    .trim()
    .split('')
    .map((char) => BANGLA_TO_ENGLISH_DIGITS[char] ?? char)
    .join('');

  // Remove all non-digit characters except leading plus
  cleaned = cleaned.replace(/[^\d+]/g, '');

  // Strip leading +880 or 880 or +88 or 88
  if (cleaned.startsWith('+880')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('+88')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('88')) {
    cleaned = cleaned.slice(2);
  }

  // If starts with 1 and is 10 digits, prepend 0
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Validates whether the normalized string is a valid 11-digit Bangladeshi mobile number
 * Starting with 013, 014, 015, 016, 017, 018, 019
 */
export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizeBdPhone(phone);
  return BD_PHONE_REGEX.test(normalized);
}

/**
 * Formats canonical 01XXXXXXXXX to human-readable format: 01XXX-XXXXXX
 */
export function formatBdPhone(phone: string): string {
  const normalized = normalizeBdPhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  }
  return phone;
}
