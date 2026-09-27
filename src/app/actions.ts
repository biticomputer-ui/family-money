'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type Obligation = { id: string; name: string; amount: number; dueDate: Date | string; isPaid: boolean; };
export type Transaction = { id: string; amount: number; note: string; date: Date | string; };
export type ProtectedSaving = { id: string; name: string; amount: number; };

export type HouseholdData = {
  id: string;
  availableCash: number;
  nextIncomeDate: string | null;
  safetyBuffer: number;
  obligations: Obligation[];
  protectedSavings: ProtectedSaving[];
  transactions: Transaction[];
};

const COOKIE_NAME = 'family_money_data';

async function getHouseholdData(): Promise<HouseholdData> {
  const cookieStore = await cookies();
  const data = cookieStore.get(COOKIE_NAME)?.value;
  if (!data) {
    return {
      id: Math.random().toString(36).substring(7),
      availableCash: 0,
      nextIncomeDate: null,
      safetyBuffer: 0,
      obligations: [],
      protectedSavings: [],
      transactions: [],
    };
  }
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
  } catch (e) {
    return {
      id: Math.random().toString(36).substring(7),
      availableCash: 0,
      nextIncomeDate: null,
      safetyBuffer: 0,
      obligations: [],
      protectedSavings: [],
      transactions: [],
    };
  }
}

async function saveHouseholdData(data: HouseholdData) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function createHousehold() {
  const data = await getHouseholdData();
  await saveHouseholdData(data);
  return data.id;
}

export async function getHousehold() {
  const cookieStore = await cookies();
  const data = cookieStore.get(COOKIE_NAME)?.value;
  if (!data) return null;
  return await getHouseholdData();
}

export async function getOrCreateHousehold() {
  const data = await getHouseholdData();
  await saveHouseholdData(data);
  return data.id;
}

export async function updateAvailableCash(amount: number) {
  const data = await getHouseholdData();
  data.availableCash = amount;
  await saveHouseholdData(data);
}

export async function updateNextIncomeDate(date: Date) {
  const data = await getHouseholdData();
  data.nextIncomeDate = date.toISOString();
  await saveHouseholdData(data);
}

export async function addObligation(name: string, amount: number, dueDate: Date) {
  const data = await getHouseholdData();
  data.obligations.push({
    id: Math.random().toString(36).substring(7),
    name,
    amount,
    dueDate: dueDate.toISOString(),
    isPaid: false,
  });
  await saveHouseholdData(data);
}

export async function addProtectedSaving(name: string, amount: number) {
  const data = await getHouseholdData();
  data.protectedSavings.push({
    id: Math.random().toString(36).substring(7),
    name,
    amount,
  });
  await saveHouseholdData(data);
}

export async function updateSafetyBuffer(amount: number) {
  const data = await getHouseholdData();
  data.safetyBuffer = amount;
  await saveHouseholdData(data);
}

export async function addTransaction(amount: number, note: string) {
  const data = await getHouseholdData();
  data.transactions.push({
    id: Math.random().toString(36).substring(7),
    amount,
    note,
    date: new Date().toISOString(),
  });
  await saveHouseholdData(data);
}

export async function markObligationPaid(obligationId: string, isPaid: boolean) {
  const data = await getHouseholdData();
  const ob = data.obligations.find(o => o.id === obligationId);
  if (ob) {
    ob.isPaid = isPaid;
    await saveHouseholdData(data);
  }
}

export async function seedDemoData() {
  const today = new Date();
  const nextIncome = new Date(today);
  nextIncome.setDate(today.getDate() + 12);
  
  const demoData: HouseholdData = {
    id: 'demo-123',
    availableCash: 25000000,
    nextIncomeDate: nextIncome.toISOString(),
    safetyBuffer: 2000000,
    transactions: [],
    obligations: [
      { id: '1', name: 'Tiền nhà', amount: 7000000, dueDate: today.toISOString(), isPaid: false },
      { id: '2', name: 'Học phí', amount: 2500000, dueDate: today.toISOString(), isPaid: false },
      { id: '3', name: 'Điện nước', amount: 850000, dueDate: today.toISOString(), isPaid: false },
      { id: '4', name: 'Internet', amount: 300000, dueDate: today.toISOString(), isPaid: false },
    ],
    protectedSavings: [
      { id: '5', name: 'Tiết kiệm', amount: 4000000 },
    ],
  };
  
  await saveHouseholdData(demoData);
  redirect('/dashboard');
}
