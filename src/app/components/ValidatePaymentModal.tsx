import { X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface ValidatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: number;
    commerceCode: string;
    businessName: string;
    local: string;
    period: string;
    amount: number;
  } | null;
  onValidate: (data: {
    merchantCode: string;
    operationNumber: string;
    transactionId: string;
    token: string;
    algApiVersion: string;
    paymentMethod: string;
    paymentDate: string;
    reference: string;
    notes: string;
  }) => void;
}

export function ValidatePaymentModal({ isOpen, onClose, payment, onValidate }: ValidatePaymentModalProps) {
  if (!isOpen || !payment) return null;

  const chargeUrlTemplate =
    'https://api.preprod.alignet.io/charges/{{MERCHANT_CODE}}/{{OPERATION_NUMBER}}/{{TRANSACTION_ID}}';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onValidate({
      merchantCode: formData.get('merchantCode') as string,
      operationNumber: formData.get('operationNumber') as string,
      transactionId: formData.get('transactionId') as string,
      token: formData.get('token') as string,
      algApiVersion: formData.get('algApiVersion') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      paymentDate: formData.get('paymentDate') as string,
      reference: formData.get('reference') as string,
      notes: formData.get('notes') as string
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Validar Pago Manual
        </h2>
        
        {/* Payment Info */}
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
              <p className="text-xl font-bold text-[#E91E63]">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Validation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de comercio (demo) *
            </label>
            <input
              type="text"
              name="merchantCode"
              defaultValue={payment.commerceCode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Ej: COM-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Number *
            </label>
            <input
              type="text"
              name="operationNumber"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Ej: 579640436514"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID *
            </label>
            <input
              type="text"
              name="transactionId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Ej: c0x4r991p5bfiolf90jrr7by3"
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <p>URL de consulta:</p>
            <span className="font-mono block break-all mt-1">
              {chargeUrlTemplate}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token (Bearer) *
            </label>
            <input
              type="text"
              name="token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Bearer {{TOKEN}}"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ALG-API-VERSION *
            </label>
            <input
              type="text"
              name="algApiVersion"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Ej: 1709847567"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              name="paymentMethod"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              required
            >
              <option value="">Seleccionar método</option>
              <option value="transfer">Transferencia Bancaria</option>
              <option value="credit_card">Tarjeta de Crédito</option>
              <option value="debit_card">Tarjeta de Débito</option>
              <option value="cash">Efectivo</option>
              <option value="check">Cheque</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Pago *
            </label>
            <input
              type="date"
              name="paymentDate"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia / Comprobante *
            </label>
            <input
              type="text"
              name="reference"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Número de comprobante o referencia bancaria"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder="Observaciones o comentarios..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
            >
              Validar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
