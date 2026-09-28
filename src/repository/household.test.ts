import { describe, it, expect } from 'vitest';
import { householdRepository } from './household';

describe('Household Repository Migration', () => {
  it('migrates legacy HTTP-Only cookie format correctly', () => {
    const legacyData = {
      id: 'legacy-id-123',
      availableCash: 10000000,
      nextIncomeDate: '2026-10-05T00:00:00.000Z',
      safetyBuffer: 500000,
      protectedSavings: [
        { amount: 1000000 }
      ],
      obligations: [
        { id: 'ob1', name: 'Tiền điện', amount: 850000, dueDate: '2026-10-01T00:00:00.000Z', isPaid: false }
      ],
      transactions: [
        { id: 'tx1', amount: 50000, note: 'Ăn sáng', date: '2026-09-28T08:00:00.000Z' }
      ]
    };

    const migrated = householdRepository.migrateLegacy(legacyData);

    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.householdId).toBe('legacy-id-123');
    expect(migrated.balance).toBe(10000000);
    expect(migrated.nextPayday).toBe('2026-10-05T00:00:00.000Z');
    expect(migrated.emergencyReserve).toBe(500000);
    expect(migrated.lockedSavings).toBe(1000000);
    
    expect(migrated.obligations.length).toBe(1);
    expect(migrated.obligations[0].title).toBe('Tiền điện');
    expect(migrated.obligations[0].status).toBe('pending');
    
    expect(migrated.transactions.length).toBe(1);
    expect(migrated.transactions[0].description).toBe('Ăn sáng');
    expect(migrated.transactions[0].amount).toBe(50000);
  });

  it('rejects invalid legacy data securely', () => {
    expect(() => householdRepository.migrateLegacy(null)).toThrow('Invalid legacy data');
    expect(() => householdRepository.migrateLegacy('string-payload')).toThrow('Invalid legacy data');
  });

  it('handles malformed numbers by defaulting to 0 safely', () => {
    const corruptedLegacy = {
      availableCash: 'not a number',
      safetyBuffer: null,
      protectedSavings: [{ amount: 'invalid' }]
    };
    
    const migrated = householdRepository.migrateLegacy(corruptedLegacy);
    expect(migrated.balance).toBe(0);
    expect(migrated.emergencyReserve).toBe(0);
    expect(migrated.lockedSavings).toBe(0);
  });
});
