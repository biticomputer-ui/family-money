import { differenceInDays, startOfDay } from "date-fns";

export interface SafeToSpendInput {
  availableCash: number;
  transactions: { amount: number }[]; // Only discretionary transactions
  obligations: { amount: number; isPaid: boolean; dueDate: Date }[];
  protectedSavings: { amount: number }[];
  safetyBuffer: number;
  nextIncomeDate: Date | null;
  currentDate?: Date; // For testing
}

export function calculateSafeToSpend(input: SafeToSpendInput) {
  const discretionarySpent = input.transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // All obligations that are due before next income (for V0, we assume all entered obligations are for the current cycle)
  const totalObligations = input.obligations.reduce((sum, o) => sum + o.amount, 0);
  
  const totalProtected = input.protectedSavings.reduce((sum, s) => sum + s.amount, 0);
  
  const safeToSpend = input.availableCash 
    - discretionarySpent 
    - totalObligations 
    - totalProtected 
    - input.safetyBuffer;

  return safeToSpend;
}

export function calculateDaysUntilIncome(nextIncomeDate: Date | null, currentDate: Date = new Date()) {
  if (!nextIncomeDate) return 0;
  
  const today = startOfDay(currentDate);
  const target = startOfDay(nextIncomeDate);
  
  const days = differenceInDays(target, today);
  return Math.max(0, days);
}

export function calculateDailySafeToSpend(safeToSpend: number, daysUntilIncome: number) {
  if (daysUntilIncome <= 0) return safeToSpend; // If payday is today or overdue, it's all available today
  return Math.floor(safeToSpend / daysUntilIncome);
}

export function calculateProtectedAmount(input: SafeToSpendInput) {
  const unpaidObligations = input.obligations
    .filter(o => !o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);
    
  const totalProtected = input.protectedSavings.reduce((sum, s) => sum + s.amount, 0);
  
  return unpaidObligations + totalProtected + input.safetyBuffer;
}
