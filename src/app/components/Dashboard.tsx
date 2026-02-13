import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import type { PaymentRecord } from '../types';
import { DEFAULT_PAYMENTS } from '../data/demoData';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';
import { applyPaymentDelta, getRemaining, normalizePayments } from '../utils/payments';
import { formatDate, formatCurrency } from '../utils/format';

type Rental = PaymentRecord;

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [rentals, setRentals] = useState<Rental[]>(() =>
    loadFromStorage(STORAGE_KEYS.payments, DEFAULT_PAYMENTS)
  );
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.payments, rentals);
  }, [rentals]);

  const viewRentals = useMemo(() => normalizePayments(rentals), [rentals]);

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePayClick = (rental: Rental) => {
    setSelectedRental(rental);
    setIsModalOpen(true);
  };

  const handleConfirmPayment = (payload: { paidDeltaAmount: number; paidDeltaCommission: number }) => {
    if (selectedRental) {
      setRentals(rentals.map(r => (r.id !== selectedRental.id ? r : applyPaymentDelta(r, payload))));
    }
  };

  const totalPending = viewRentals
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + getRemaining(r).remainingTotal, 0);

  const nextDue = viewRentals
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const totalPaid = viewRentals.filter(r => r.status === 'paid').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Pagado</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Pendiente</span>;
      case 'overdue':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Vencido</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onLogoClick={onBack} />
      
      {/* Hero Banner */}
      <div className="relative h-[180px] sm:h-[250px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1718201525336-095240724352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzaG9wcGluZyUyMGNlbnRlciUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzA4MzE0Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Shopping Mall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Mis Alquileres
          </h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-[#E91E63]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pendiente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalPending)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Próximo Vencimiento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {nextDue ? formatDate(nextDue.dueDate) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Alquileres Pagados</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPaid}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Mis Alquileres Pendientes
          </h2>
          
          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Local</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Periodo</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Fecha de Vencimiento</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Monto</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {viewRentals.map((rental) => {
                    const remaining = getRemaining(rental);
                    const totalWithCommission = rental.amount + remaining.commission;
                    const displayAmount = rental.status === 'paid' ? totalWithCommission : remaining.remainingTotal;
                    return (
                      <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{rental.local}</td>
                        <td className="px-6 py-4 text-gray-700">{rental.period}</td>
                        <td className="px-6 py-4 text-gray-700">{formatDate(rental.dueDate)}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatCurrency(displayAmount)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(rental.status)}</td>
                        <td className="px-6 py-4">
                          {remaining.remainingTotal <= 0 ? (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                            >
                              Pagado
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayClick(rental)}
                              className="px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
                            >
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-200">
              {viewRentals.map((rental) => {
                const remaining = getRemaining(rental);
                const totalWithCommission = rental.amount + remaining.commission;
                const displayAmount = rental.status === 'paid' ? totalWithCommission : remaining.remainingTotal;
                return (
                  <div key={rental.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Local</p>
                        <p className="font-medium text-gray-900">{rental.local}</p>
                      </div>
                      {getStatusBadge(rental.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Periodo</p>
                        <p className="text-gray-900">{rental.period}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vencimiento</p>
                        <p className="text-gray-900">{formatDate(rental.dueDate)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Monto</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(displayAmount)}</p>
                      </div>
                    </div>
                    <div>
                      {remaining.remainingTotal <= 0 ? (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                        >
                          Pagado
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePayClick(rental)}
                          className="w-full px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2026 MallPlaza. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-[#E91E63] text-sm transition-colors">
                Términos y Condiciones
              </a>
              <a href="#" className="text-gray-600 hover:text-[#E91E63] text-sm transition-colors">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rental={selectedRental}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}
