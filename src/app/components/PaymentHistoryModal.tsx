import { X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    commerceCode: string;
    businessName: string;
    local: string;
    period: string;
    amount: number;
    history?: Array<{
      paymentDate: string;
      paymentMethod: string;
      reference: string;
      notes: string;
      merchantCode: string;
      operationNumber: string;
      transactionId: string;
      token: string;
      algApiVersion: string;
    }>;
  } | null;
}

export function PaymentHistoryModal({ isOpen, onClose, payment }: PaymentHistoryModalProps) {
  if (!isOpen || !payment) return null;

  const history = payment.history ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial de Pago</h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Código Comercio</p>
              <p className="font-medium text-gray-900">{payment.commerceCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Negocio</p>
              <p className="font-medium text-gray-900">{payment.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Local</p>
              <p className="font-medium text-gray-900">{payment.local}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Periodo</p>
              <p className="font-medium text-gray-900">{payment.period}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Monto</p>
              <p className="text-xl font-bold text-[#E91E63]">{formatCurrency(payment.amount)}</p>
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-gray-600">Sin historial registrado.</div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, idx) => (
              <div key={`${entry.transactionId}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">Pago registrado</p>
                  <p className="text-xs text-gray-500">{entry.paymentDate}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Método:</span> {entry.paymentMethod}
                  </div>
                  <div>
                    <span className="text-gray-500">Referencia:</span> {entry.reference}
                  </div>
                  <div>
                    <span className="text-gray-500">Merchant Code:</span> {entry.merchantCode}
                  </div>
                  <div>
                    <span className="text-gray-500">Operation Number:</span> {entry.operationNumber}
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction ID:</span> {entry.transactionId}
                  </div>
                  <div>
                    <span className="text-gray-500">ALG-API-VERSION:</span> {entry.algApiVersion}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Token:</span> {entry.token}
                  </div>
                  {entry.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Notas:</span> {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
