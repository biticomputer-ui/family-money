import { describe, it, expect } from 'vitest';
import { createEncryptedSnapshot, decryptSnapshot } from './snapshot';
import { HouseholdData } from '../domain/models';

describe('Snapshot Security', () => {
  const dummyData: HouseholdData = {
    schemaVersion: 1,
    householdId: 'test-id',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    balance: 500000,
    nextPayday: '2026-10-05T00:00:00.000Z',
    lockedSavings: 0,
    emergencyReserve: 0,
    obligations: [],
    transactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('encrypts and decrypts correctly', async () => {
    // Wait, Web Crypto API is available in Node > 19 globally as `crypto`, 
    // but in vitest/jsdom it might need polyfill. 
    // Let's assume standard Node 20+.
    const payload = await createEncryptedSnapshot(dummyData);
    
    // payload should be Base64Url format (key.iv.ciphertext)
    expect(payload.split('.').length).toBe(3);
    
    const decrypted = await decryptSnapshot(payload);
    expect(decrypted.householdId).toBe(dummyData.householdId);
    expect(decrypted.balance).toBe(dummyData.balance);
  });

  it('fails decryption if payload is tampered', async () => {
    const payload = await createEncryptedSnapshot(dummyData);
    
    const parts = payload.split('.');
    // modify ciphertext slightly
    parts[2] = parts[2].substring(0, parts[2].length - 1) + 'a';
    const tampered = parts.join('.');
    
    await expect(decryptSnapshot(tampered)).rejects.toThrow();
  });
});
