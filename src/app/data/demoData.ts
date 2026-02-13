import type { LocalRecord, PaymentRecord } from '../types';

export const DEFAULT_LOCALS: LocalRecord[] = [
  { id: 1, code: 'A-101', businessName: 'Tienda de Ropa Fashion Style', commerceCode: 'COM-001', area: 45, monthlyRent: 12000, status: 'active' },
  { id: 2, code: 'B-205', businessName: 'Cafetería El Buen Café', commerceCode: 'COM-002', area: 30, monthlyRent: 8500, status: 'active' },
  { id: 3, code: 'C-310', businessName: 'Electrónica Digital Store', commerceCode: 'COM-003', area: 55, monthlyRent: 9500, status: 'active' },
  { id: 4, code: 'D-112', businessName: 'Zapatería Paso Firme', commerceCode: 'COM-004', area: 35, monthlyRent: 7800, status: 'inactive' },
];

export const DEFAULT_PAYMENTS: PaymentRecord[] = [
  { id: 1, commerceCode: 'COM-001', businessName: 'Tienda de Ropa Fashion Style', local: 'A-101', period: 'Febrero 2026', amount: 12000, dueDate: '2026-02-15', status: 'pending' },
  { id: 2, commerceCode: 'COM-002', businessName: 'Cafetería El Buen Café', local: 'B-205', period: 'Febrero 2026', amount: 8500, dueDate: '2026-02-20', status: 'pending' },
  { id: 3, commerceCode: 'COM-003', businessName: 'Electrónica Digital Store', local: 'C-310', period: 'Febrero 2026', amount: 9500, dueDate: '2026-02-25', status: 'pending' },
  { id: 4, commerceCode: 'COM-001', businessName: 'Tienda de Ropa Fashion Style', local: 'A-101', period: 'Enero 2026', amount: 12000, dueDate: '2026-01-15', status: 'paid', paidDate: '2026-01-14' },
  { id: 5, commerceCode: 'COM-002', businessName: 'Cafetería El Buen Café', local: 'B-205', period: 'Enero 2026', amount: 8500, dueDate: '2026-01-20', status: 'overdue' },
];
