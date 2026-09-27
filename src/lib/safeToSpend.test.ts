import { describe, it, expect } from 'vitest';
import { 
  calculateSafeToSpend, 
  calculateDaysUntilIncome,
  calculateDailySafeToSpend,
  calculateProtectedAmount,
  type SafeToSpendInput
} from './safeToSpend';

describe('SafeToSpend Core Logic', () => {
  it('calculates SafeToSpend correctly on onboarding (no paid items)', () => {
    const input: SafeToSpendInput = {
      availableCash: 25000000,
      transactions: [],
      obligations: [
        { amount: 7000000, isPaid: false, dueDate: new Date() },
        { amount: 2500000, isPaid: false, dueDate: new Date() }
      ],
      protectedSavings: [
        { amount: 4000000 }
      ],
      safetyBuffer: 2000000,
      nextIncomeDate: new Date()
    };
    
    // 25M - 9.5M (obligations) - 4M (savings) - 2M (buffer) = 9.5M
    expect(calculateSafeToSpend(input)).toBe(9500000);
  });

  it('maintains SafeToSpend when an obligation is paid', () => {
    const input: SafeToSpendInput = {
      availableCash: 25000000,
      transactions: [],
      obligations: [
        { amount: 7000000, isPaid: true, dueDate: new Date() }, // PAID
        { amount: 2500000, isPaid: false, dueDate: new Date() } // UNPAID
      ],
      protectedSavings: [
        { amount: 4000000 }
      ],
      safetyBuffer: 2000000,
      nextIncomeDate: new Date()
    };
    
    // The obligation of 7M is paid, meaning it's still accounted for against available cash
    // SafeToSpend = 25M - (7M + 2.5M) - 4M - 2M = 9.5M
    expect(calculateSafeToSpend(input)).toBe(9500000);
  });

  it('decreases SafeToSpend when discretionary transaction is added', () => {
    const input: SafeToSpendInput = {
      availableCash: 25000000,
      transactions: [
        { amount: 1000000 }
      ],
      obligations: [
        { amount: 7000000, isPaid: true, dueDate: new Date() },
        { amount: 2500000, isPaid: false, dueDate: new Date() }
      ],
      protectedSavings: [
        { amount: 4000000 }
      ],
      safetyBuffer: 2000000,
      nextIncomeDate: new Date()
    };
    
    // 25M - 1M - 9.5M - 4M - 2M = 8.5M
    expect(calculateSafeToSpend(input)).toBe(8500000);
  });

  it('handles negative SafeToSpend correctly', () => {
    const input: SafeToSpendInput = {
      availableCash: 10000000,
      transactions: [],
      obligations: [
        { amount: 12000000, isPaid: false, dueDate: new Date() }
      ],
      protectedSavings: [],
      safetyBuffer: 0,
      nextIncomeDate: new Date()
    };
    
    expect(calculateSafeToSpend(input)).toBe(-2000000);
  });
});

describe('Days and Daily calculations', () => {
  it('calculates days until income correctly', () => {
    const today = new Date('2026-09-28T00:00:00');
    const incomeDate = new Date('2026-10-10T00:00:00');
    
    expect(calculateDaysUntilIncome(incomeDate, today)).toBe(12);
  });
  
  it('returns 0 for overdue dates', () => {
    const today = new Date('2026-09-28T00:00:00');
    const incomeDate = new Date('2026-09-20T00:00:00');
    
    expect(calculateDaysUntilIncome(incomeDate, today)).toBe(0);
  });

  it('calculates daily safe to spend', () => {
    expect(calculateDailySafeToSpend(12000000, 12)).toBe(1000000);
  });

  it('returns full amount if days <= 0', () => {
    expect(calculateDailySafeToSpend(5000000, 0)).toBe(5000000);
  });
});

describe('Protected Amount', () => {
  it('sums unpaid obligations, savings, and buffer', () => {
    const input: SafeToSpendInput = {
      availableCash: 0,
      transactions: [],
      obligations: [
        { amount: 7000000, isPaid: true, dueDate: new Date() },
        { amount: 2500000, isPaid: false, dueDate: new Date() } // Only unpaid is protected
      ],
      protectedSavings: [
        { amount: 4000000 }
      ],
      safetyBuffer: 2000000,
      nextIncomeDate: new Date()
    };
    
    // 2.5M + 4M + 2M = 8.5M
    expect(calculateProtectedAmount(input)).toBe(8500000);
  });
});
