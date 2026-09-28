import { HouseholdData } from '../domain/models';

const STORAGE_KEY = 'family_money_data';
const CURRENT_SCHEMA_VERSION = 1;

export const householdRepository = {
  get(): HouseholdData | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    try {
      const data = JSON.parse(raw);
      return migrateHouseholdData(data);
    } catch (e) {
      console.error('Failed to parse household data', e);
      return null;
    }
  },
  
  save(data: HouseholdData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Migration logic from cookie or older schema to CURRENT_SCHEMA_VERSION
 */
export function migrateHouseholdData(data: any): HouseholdData {
  // If it's already the current schema, just return it
  if (data && data.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return data as HouseholdData;
  }
  
  // Legacy cookie schema (V0) migration
  // Old schema had: id, availableCash, nextIncomeDate, safetyBuffer, transactions, obligations, protectedSavings
  if (data && data.availableCash !== undefined) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      householdId: data.id || crypto.randomUUID(),
      currency: 'VND',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
      balance: data.availableCash,
      nextPayday: data.nextIncomeDate || new Date().toISOString(),
      lockedSavings: data.protectedSavings?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
      emergencyReserve: data.safetyBuffer || 0,
      obligations: (data.obligations || []).map((o: any) => ({
        id: o.id || crypto.randomUUID(),
        title: o.name,
        amount: o.amount,
        dueDate: o.dueDate,
        status: o.isPaid ? 'paid' : 'pending',
        createdAt: new Date().toISOString()
      })),
      transactions: (data.transactions || []).map((t: any) => ({
        id: t.id || crypto.randomUUID(),
        type: 'expense',
        amount: t.amount,
        description: t.note,
        createdAt: t.date || new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  throw new Error("Unsupported schema for migration");
}
