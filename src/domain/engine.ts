import { HouseholdData, Transaction, Obligation } from './models';

/**
 * Tính tổng các khoản phải trả đang pending trước ngày nhận lương
 */
export function calculateOutstandingObligations(data: HouseholdData): number {
  return data.obligations
    .filter(ob => ob.status === 'pending')
    .reduce((sum, ob) => sum + ob.amount, 0);
}

/**
 * Tính số tiền Raw Safe-to-Spend (có thể âm)
 */
export function calculateRawSafeToSpend(data: HouseholdData): number {
  const pendingObligations = calculateOutstandingObligations(data);
  return data.balance - pendingObligations - data.lockedSavings - data.emergencyReserve;
}

/**
 * Tính số ngày còn lại đến kỳ lương
 */
export function calculateRemainingSpendingDays(nextPayday: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const payDate = new Date(nextPayday);
  payDate.setHours(0, 0, 0, 0);
  
  const diffTime = payDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // If payday is today or passed, 0 days left
}

/**
 * Tính mức chi tiêu hàng ngày
 */
export function calculateDailyAllowance(data: HouseholdData): number {
  const rawSafeToSpend = calculateRawSafeToSpend(data);
  const remainingDays = calculateRemainingSpendingDays(data.nextPayday);
  
  if (remainingDays <= 0) return Math.max(0, rawSafeToSpend);
  return Math.floor(Math.max(0, rawSafeToSpend) / remainingDays);
}

/**
 * Áp dụng một transaction mới (Expense/Income)
 */
export function applyTransaction(data: HouseholdData, transaction: Omit<Transaction, 'id' | 'createdAt'>): HouseholdData {
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  
  const newData = { ...data, transactions: [...data.transactions, newTransaction] };
  
  if (newTransaction.type === 'expense') {
    newData.balance -= newTransaction.amount;
  } else if (newTransaction.type === 'income') {
    newData.balance += newTransaction.amount;
  }
  
  newData.updatedAt = new Date().toISOString();
  return newData;
}

/**
 * Gạch nợ một khoản phải trả
 * Invariant: Trả bill không làm giảm Safe-to-Spend
 * => Balance giảm, obligation thành paid, nên OutstandingObligations giảm -> RawSafeToSpend không đổi.
 */
export function payObligation(data: HouseholdData, obligationId: string): HouseholdData {
  const obligationIndex = data.obligations.findIndex(o => o.id === obligationId);
  if (obligationIndex === -1 || data.obligations[obligationIndex].status === 'paid') {
    return data;
  }
  
  const obligation = data.obligations[obligationIndex];
  
  // Create bill payment transaction
  const paymentTransaction: Transaction = {
    id: crypto.randomUUID(),
    type: 'bill_payment',
    amount: obligation.amount,
    description: `Thanh toán: ${obligation.title}`,
    obligationId: obligation.id,
    createdAt: new Date().toISOString()
  };
  
  const newData = {
    ...data,
    balance: data.balance - obligation.amount,
    transactions: [...data.transactions, paymentTransaction],
    obligations: data.obligations.map(ob => 
      ob.id === obligationId 
        ? { ...ob, status: 'paid' as const, paidTransactionId: paymentTransaction.id }
        : ob
    ),
    updatedAt: new Date().toISOString()
  };
  
  return newData;
}

/**
 * Mô phỏng mua sắm, trả về kết quả ảo (không làm thay đổi data gốc)
 */
export function simulatePurchase(data: HouseholdData, amount: number) {
  const rawSafeToSpend = calculateRawSafeToSpend(data);
  const simulatedRaw = rawSafeToSpend - amount;
  
  const remainingDays = calculateRemainingSpendingDays(data.nextPayday);
  const simulatedDaily = remainingDays > 0 ? Math.floor(Math.max(0, simulatedRaw) / remainingDays) : Math.max(0, simulatedRaw);
  
  return {
    rawSafeToSpend,
    dailyAllowance: calculateDailyAllowance(data),
    simulatedRawSafeToSpend: simulatedRaw,
    simulatedDailyAllowance: simulatedDaily
  };
}

/**
 * Hoàn tác giao dịch gần nhất
 */
export function undoTransaction(data: HouseholdData, transactionId: string): HouseholdData {
  const txIndex = data.transactions.findIndex(t => t.id === transactionId);
  if (txIndex === -1) return data;
  
  const tx = data.transactions[txIndex];
  const newData = {
    ...data,
    transactions: data.transactions.filter(t => t.id !== transactionId),
    updatedAt: new Date().toISOString()
  };
  
  if (tx.type === 'expense') {
    newData.balance += tx.amount;
  } else if (tx.type === 'income') {
    newData.balance -= tx.amount;
  } else if (tx.type === 'bill_payment' && tx.obligationId) {
    newData.balance += tx.amount;
    newData.obligations = newData.obligations.map(ob => 
      ob.id === tx.obligationId 
        ? { ...ob, status: 'pending' as const, paidTransactionId: undefined }
        : ob
    );
  }
  
  return newData;
}
