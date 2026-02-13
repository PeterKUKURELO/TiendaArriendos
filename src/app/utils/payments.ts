import type { PaymentRecord } from '../types';

export const COMMISSION_RATE = 0.02;

export const calculateCommission = (amount: number) => amount * COMMISSION_RATE;

const toDateOnly = (dateString: string) => {
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return new Date(dateString);
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export const isPastDue = (dateString: string, today = new Date()) => {
  const due = toDateOnly(dateString);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDate < now;
};

export const getRemaining = (payment: Pick<PaymentRecord, 'amount' | 'paidAmount' | 'paidCommission'>) => {
  const commission = calculateCommission(payment.amount);
  const paidAmount = payment.paidAmount ?? 0;
  const paidCommission = payment.paidCommission ?? 0;
  const remainingAmount = Math.max(payment.amount - paidAmount, 0);
  const remainingCommission = Math.max(commission - paidCommission, 0);
  const remainingTotal = remainingAmount + remainingCommission;
  return { remainingAmount, remainingCommission, remainingTotal, commission };
};

export const normalizePayment = (payment: PaymentRecord, today = new Date()): PaymentRecord => {
  const commission = calculateCommission(payment.amount);
  const paidAmount = payment.paidAmount ?? (payment.status === 'paid' ? payment.amount : 0);
  const paidCommission = payment.paidCommission ?? (payment.status === 'paid' ? commission : 0);
  const remainingAmount = Math.max(payment.amount - paidAmount, 0);
  const remainingCommission = Math.max(commission - paidCommission, 0);
  const remainingTotal = remainingAmount + remainingCommission;
  const status = remainingTotal <= 0 ? 'paid' : isPastDue(payment.dueDate, today) ? 'overdue' : 'pending';
  return {
    ...payment,
    paidAmount,
    paidCommission,
    status,
  };
};

export const normalizePayments = (payments: PaymentRecord[], today = new Date()) =>
  payments.map((p) => normalizePayment(p, today));

export const applyPaymentDelta = (
  payment: PaymentRecord,
  delta: { paidDeltaAmount: number; paidDeltaCommission: number }
) => {
  const nextPaidAmount = (payment.paidAmount ?? 0) + delta.paidDeltaAmount;
  const nextPaidCommission = (payment.paidCommission ?? 0) + delta.paidDeltaCommission;
  return normalizePayment({
    ...payment,
    paidAmount: nextPaidAmount,
    paidCommission: nextPaidCommission,
  });
};
