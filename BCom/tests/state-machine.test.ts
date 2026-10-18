// tests/state-machine.test.ts
// Unit tests for state machine transitions

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  canTransitionDispatchStatus,
} from '../src/services/state-machine.service.js';

test('canTransitionOrderStatus allows valid happy path', () => {
  assert.equal(canTransitionOrderStatus('PENDING', 'CONFIRMED'), true);
  assert.equal(canTransitionOrderStatus('CONFIRMED', 'PACKED'), true);
  assert.equal(canTransitionOrderStatus('PACKED', 'SHIPPED'), true);
  assert.equal(canTransitionOrderStatus('SHIPPED', 'DELIVERED'), true);
});

test('canTransitionOrderStatus blocks illegal reverse or skip transitions', () => {
  assert.equal(canTransitionOrderStatus('DELIVERED', 'PENDING'), false);
  assert.equal(canTransitionOrderStatus('CANCELLED', 'CONFIRMED'), false);
  assert.equal(canTransitionOrderStatus('RETURNED', 'SHIPPED'), false);
  assert.equal(canTransitionOrderStatus('PENDING', 'DELIVERED'), false);
});

test('canTransitionPaymentStatus allows advance verification and refund', () => {
  assert.equal(canTransitionPaymentStatus('UNPAID', 'ADVANCE_PENDING_VERIFICATION'), true);
  assert.equal(canTransitionPaymentStatus('ADVANCE_PENDING_VERIFICATION', 'PAID'), true);
  assert.equal(canTransitionPaymentStatus('PAID', 'REFUNDED'), true);
  assert.equal(canTransitionPaymentStatus('REFUNDED', 'PAID'), false);
});

test('canTransitionDispatchStatus enforces courier booking locking and reconciliation', () => {
  assert.equal(canTransitionDispatchStatus('NOT_SENT', 'DISPATCHING'), true);
  assert.equal(canTransitionDispatchStatus('DISPATCHING', 'BOOKED'), true);
  assert.equal(canTransitionDispatchStatus('DISPATCHING', 'NEEDS_RECONCILIATION'), true);
  assert.equal(canTransitionDispatchStatus('BOOKED', 'DISPATCHING'), false);
});
