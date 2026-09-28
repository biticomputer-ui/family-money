export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'bill_payment' | 'adjustment';
  amount: number;
  description: string;
  category?: string;
  obligationId?: string;
  createdAt: string;
}

export interface Obligation {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paidTransactionId?: string;
  createdAt: string;
}

export interface HouseholdData {
  schemaVersion: number;
  householdId: string;
  currency: 'VND';
  timezone: string;
  balance: number;
  nextPayday: string;
  lockedSavings: number;
  emergencyReserve: number;
  obligations: Obligation[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}
