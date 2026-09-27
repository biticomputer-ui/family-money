'use server';

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

async function getSessionHouseholdId() {
  const cookieStore = await cookies();
  return cookieStore.get('householdId')?.value;
}

export async function createHousehold() {
  const household = await prisma.household.create({
    data: {}
  });
  
  const cookieStore = await cookies();
  cookieStore.set('householdId', household.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  
  return household.id;
}

export async function getHousehold() {
  const id = await getSessionHouseholdId();
  if (!id) return null;
  
  return prisma.household.findUnique({
    where: { id },
    include: {
      obligations: true,
      protectedSavings: true,
      transactions: true,
    }
  });
}

export async function getOrCreateHousehold() {
  let id = await getSessionHouseholdId();
  if (!id) {
    id = await createHousehold();
  }
  return id;
}

export async function updateAvailableCash(amount: number) {
  const id = await getOrCreateHousehold();
  await prisma.household.update({
    where: { id },
    data: { availableCash: amount }
  });
}

export async function updateNextIncomeDate(date: Date) {
  const id = await getOrCreateHousehold();
  await prisma.household.update({
    where: { id },
    data: { nextIncomeDate: date }
  });
}

export async function addObligation(name: string, amount: number, dueDate: Date) {
  const id = await getOrCreateHousehold();
  await prisma.obligation.create({
    data: {
      householdId: id,
      name,
      amount,
      dueDate,
    }
  });
}

export async function addProtectedSaving(name: string, amount: number) {
  const id = await getOrCreateHousehold();
  await prisma.protectedSaving.create({
    data: {
      householdId: id,
      name,
      amount,
    }
  });
}

export async function updateSafetyBuffer(amount: number) {
  const id = await getOrCreateHousehold();
  await prisma.household.update({
    where: { id },
    data: { safetyBuffer: amount }
  });
}

export async function addTransaction(amount: number, note: string) {
  const id = await getSessionHouseholdId();
  if (!id) throw new Error("No household found");
  
  await prisma.transaction.create({
    data: {
      householdId: id,
      amount,
      note,
    }
  });
}

export async function markObligationPaid(obligationId: string, isPaid: boolean) {
  const id = await getSessionHouseholdId();
  if (!id) throw new Error("No household found");
  
  await prisma.obligation.update({
    where: { id: obligationId, householdId: id },
    data: { isPaid }
  });
}

export async function seedDemoData() {
  const id = await createHousehold();
  
  const today = new Date();
  const nextIncome = new Date(today);
  nextIncome.setDate(today.getDate() + 12);
  
  await prisma.household.update({
    where: { id },
    data: {
      availableCash: 25000000,
      nextIncomeDate: nextIncome,
      safetyBuffer: 2000000,
    }
  });
  
  await Promise.all([
    prisma.obligation.create({ data: { householdId: id, name: 'Tiền nhà', amount: 7000000, dueDate: today } }),
    prisma.obligation.create({ data: { householdId: id, name: 'Học phí', amount: 2500000, dueDate: today } }),
    prisma.obligation.create({ data: { householdId: id, name: 'Điện nước', amount: 850000, dueDate: today } }),
    prisma.obligation.create({ data: { householdId: id, name: 'Internet', amount: 300000, dueDate: today } }),
  ]);
  
  await prisma.protectedSaving.create({
    data: {
      householdId: id,
      name: 'Tiết kiệm',
      amount: 4000000,
    }
  });
  
  redirect('/dashboard');
}
