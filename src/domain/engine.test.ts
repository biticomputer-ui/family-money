import { describe, it, expect } from 'vitest';
import { calculateRawSafeToSpend, payObligation, applyTransaction, simulatePurchase, undoTransaction, calculateOutstandingObligations } from './engine';
import { HouseholdData } from './models';

const createMockData = (): HouseholdData => ({
  schemaVersion: 1,
  householdId: 'test-123',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  balance: 10000000,
  nextPayday: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
  lockedSavings: 2000000,
  emergencyReserve: 1000000,
  obligations: [
    { id: 'ob1', title: 'Tiền điện', amount: 3000000, dueDate: new Date().toISOString(), status: 'pending', createdAt: new Date().toISOString() }
  ],
  transactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe('Safe-to-Spend Engine', () => {
  it('calculates Raw Safe-to-Spend correctly', () => {
    const data = createMockData();
    // 10m - 3m(bill) - 2m(savings) - 1m(reserve) = 4m
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
  });

  it('maintains invariant when paying a bill (safe to spend does not double deduct)', () => {
    let data = createMockData();
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
    
    data = payObligation(data, 'ob1');
    expect(data.balance).toBe(7000000); // 10m - 3m
    expect(data.obligations[0].status).toBe('paid');
    expect(calculateOutstandingObligations(data)).toBe(0);
    
    // Safe-to-Spend should still be 4m (7m balance - 0 pending - 2m savings - 1m reserve = 4m)
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
  });

  it('deducts safe to spend when an expense is applied', () => {
    let data = createMockData();
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
    
    data = applyTransaction(data, {
      type: 'expense',
      amount: 100000,
      description: 'Cà phê'
    });
    
    expect(data.balance).toBe(9900000);
    expect(calculateRawSafeToSpend(data)).toBe(3900000);
  });

  it('allows negative state', () => {
    const data = createMockData();
    data.balance = 5000000;
    data.obligations[0].amount = 6000000;
    data.lockedSavings = 0;
    data.emergencyReserve = 0;
    
    // 5m - 6m = -1m
    expect(calculateRawSafeToSpend(data)).toBe(-1000000);
  });

  it('simulator does not mutate state', () => {
    const data = createMockData();
    const result = simulatePurchase(data, 1500000);
    
    expect(result.rawSafeToSpend).toBe(4000000);
    expect(result.simulatedRawSafeToSpend).toBe(2500000);
    expect(data.balance).toBe(10000000); // Unchanged
  });

  it('undo restores previous state including paid obligations', () => {
    let data = createMockData();
    data = payObligation(data, 'ob1');
    expect(data.obligations[0].status).toBe('paid');
    
    const txId = data.transactions[data.transactions.length - 1].id;
    data = undoTransaction(data, txId);
    
    expect(data.balance).toBe(10000000);
    expect(data.obligations[0].status).toBe('pending');
    expect(data.obligations[0].paidTransactionId).toBeUndefined();
  });
});

import { calculateRemainingSpendingDays } from './engine';

describe('Spending Days Calculation', () => {
  it('calculates 7 days when today is 28th and payday is 5th next month', () => {
    const today = new Date('2026-09-28T12:00:00.000Z');
    const payday = '2026-10-05T00:00:00.000Z'; // local time will be October 5
    expect(calculateRemainingSpendingDays(payday, today)).toBe(7);
  });

  it('returns 0 if payday is today', () => {
    const today = new Date('2026-10-05T12:00:00.000Z');
    expect(calculateRemainingSpendingDays('2026-10-05T08:00:00.000Z', today)).toBe(0);
  });

  it('handles leap year correctly (Feb 28 to Mar 1)', () => {
    const today = new Date('2024-02-28T10:00:00.000Z');
    expect(calculateRemainingSpendingDays('2024-03-01T00:00:00.000Z', today)).toBe(2);
  });

  it('handles year boundary (Dec 31 to Jan 2)', () => {
    const today = new Date('2026-12-31T20:00:00.000Z');
    expect(calculateRemainingSpendingDays('2027-01-02T00:00:00.000Z', today)).toBe(2);
  });
});
