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
    let data = createMockData();
    data.balance = 5000000;
    data.obligations[0].amount = 6000000;
    data.lockedSavings = 0;
    data.emergencyReserve = 0;
    
    // 5m - 6m = -1m
    expect(calculateRawSafeToSpend(data)).toBe(-1000000);
  });

  it('simulator does not mutate state', () => {
    let data = createMockData();
    const result = simulatePurchase(data, 1500000);
    
    expect(result.rawSafeToSpend).toBe(4000000);
    expect(result.simulatedRawSafeToSpend).toBe(2500000);
    expect(data.balance).toBe(10000000); // Unchanged
  });

  it('undo restores previous state', () => {
    let data = createMockData();
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
    
    data = applyTransaction(data, { type: 'expense', amount: 500000, description: 'Ăn tối' });
    expect(calculateRawSafeToSpend(data)).toBe(3500000);
    
    const txId = data.transactions[data.transactions.length - 1].id;
    data = undoTransaction(data, txId);
    
    expect(calculateRawSafeToSpend(data)).toBe(4000000);
    expect(data.balance).toBe(10000000);
  });
});
