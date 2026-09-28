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
      if (data && data.schemaVersion === CURRENT_SCHEMA_VERSION) {
        return data as HouseholdData;
      }
      return null;
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
  },

  migrateLegacy(dataRaw: unknown): HouseholdData {
    if (!dataRaw || typeof dataRaw !== 'object') throw new Error("Invalid legacy data");
    
    // Legacy cookie schema (V0) migration
    const data = dataRaw as Record<string, unknown>;
    
    const lockedSavings = data.protectedSavings && Array.isArray(data.protectedSavings)
      ? data.protectedSavings.reduce((sum: number, sRaw: unknown) => {
          const s = sRaw as Record<string, unknown>;
          return sum + (Number(s.amount) || 0);
        }, 0)
      : 0;

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      householdId: (data.id as string) || crypto.randomUUID(),
      currency: 'VND',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
      balance: Math.round(Number(data.availableCash) || 0),
      nextPayday: (data.nextIncomeDate as string) || new Date().toISOString(),
      lockedSavings: Math.round(lockedSavings),
      emergencyReserve: Math.round(Number(data.safetyBuffer) || 0),
      obligations: (Array.isArray(data.obligations) ? data.obligations : []).map((oRaw: unknown) => {
        const o = oRaw as Record<string, unknown>;
        return {
          id: (o.id as string) || crypto.randomUUID(),
          title: (o.name as string) || 'Khoản phải trả',
          amount: Math.round(Number(o.amount) || 0),
          dueDate: (o.dueDate as string) || new Date().toISOString(),
          status: o.isPaid ? 'paid' : 'pending',
          createdAt: new Date().toISOString()
        };
      }),
      transactions: (Array.isArray(data.transactions) ? data.transactions : []).map((tRaw: unknown) => {
        const t = tRaw as Record<string, unknown>;
        return {
          id: (t.id as string) || crypto.randomUUID(),
          type: 'expense',
          amount: Math.round(Number(t.amount) || 0),
          description: (t.note as string) || 'Chi tiêu',
          createdAt: (t.date as string) || new Date().toISOString()
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};
