// tests/bd-phone.test.ts
// Unit tests for Bangladeshi phone normalization and validation

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBdPhone, isValidBdPhone, formatBdPhone } from '../src/lib/bd-phone.js';

test('normalizeBdPhone converts standard English 11-digit numbers', () => {
  assert.equal(normalizeBdPhone('01712345678'), '01712345678');
});

test('normalizeBdPhone converts Bangla numerals (০-৯) to English', () => {
  assert.equal(normalizeBdPhone('০১৭১২৩৪৫৬৭৮'), '01712345678');
  assert.equal(normalizeBdPhone('০১৮৯৯৮৮৭৭৬৬'), '01899887766');
});

test('normalizeBdPhone strips +880 and 880 prefixes with spaces and dashes', () => {
  assert.equal(normalizeBdPhone('+880 1712-345678'), '01712345678');
  assert.equal(normalizeBdPhone('+8801712345678'), '01712345678');
  assert.equal(normalizeBdPhone('8801712345678'), '01712345678');
});

test('isValidBdPhone validates authentic BD operator prefixes', () => {
  assert.equal(isValidBdPhone('01712345678'), true); // Grameenphone
  assert.equal(isValidBdPhone('01312345678'), true); // GP 013
  assert.equal(isValidBdPhone('01812345678'), true); // Robi
  assert.equal(isValidBdPhone('01612345678'), true); // Airtel
  assert.equal(isValidBdPhone('01912345678'), true); // Banglalink
  assert.equal(isValidBdPhone('01412345678'), true); // BL 014
  assert.equal(isValidBdPhone('01512345678'), true); // Teletalk
});

test('isValidBdPhone rejects invalid phone lengths and fake prefixes', () => {
  assert.equal(isValidBdPhone('01212345678'), false); // 012 is unallocated
  assert.equal(isValidBdPhone('0171234567'), false);  // 10 digits
  assert.equal(isValidBdPhone('017123456789'), false); // 12 digits
  assert.equal(isValidBdPhone('abcdefghijk'), false);
});

test('formatBdPhone returns 01XXX-XXXXXX format', () => {
  assert.equal(formatBdPhone('01712345678'), '01712-345678');
});
