export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentHistoryEntry {
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  merchantCode: string;
  operationNumber: string;
  transactionId: string;
  token: string;
  algApiVersion: string;
}

export interface PaymentRecord {
  id: number;
  commerceCode: string;
  businessName: string;
  local: string;
  period: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidDate?: string;
  transactionNumber?: string;
  paymentMethod?: string;
  paidAmount?: number;
  paidCommission?: number;
  history?: PaymentHistoryEntry[];
}

export interface LocalRecord {
  id: number;
  code: string;
  businessName: string;
  commerceCode: string;
  area: number;
  monthlyRent: number;
  status: 'active' | 'inactive';
}
