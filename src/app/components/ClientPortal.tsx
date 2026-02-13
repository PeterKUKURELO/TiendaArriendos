import { useState } from 'react';
import { Header } from './Header';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { Search, ArrowLeft } from 'lucide-react';
import type { PaymentRecord } from '../types';
import { DEFAULT_LOCALS, DEFAULT_PAYMENTS } from '../data/demoData';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';
import { applyPaymentDelta, getRemaining, normalizePayments } from '../utils/payments';
import { formatCurrency, formatDate } from '../utils/format';

interface ClientPortalProps {
  onBack: () => void;
}

type Rental = PaymentRecord;

export function ClientPortal({ onBack }: ClientPortalProps) {
  const [commerceCode, setCommerceCode] = useState('');
  const [searchResult, setSearchResult] = useState<{ businessName: string; rentals: Rental[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [payments, setPayments] = useState<Rental[]>(() =>
    loadFromStorage(STORAGE_KEYS.payments, DEFAULT_PAYMENTS)
  );
  const savePayments = (next: Rental[]) => {
    setPayments(next);
    saveToStorage(STORAGE_KEYS.payments, next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = commerceCode.toUpperCase();
    const latestLocals = loadFromStorage(STORAGE_KEYS.locals, DEFAULT_LOCALS);
    const latestPayments = normalizePayments(
      loadFromStorage(STORAGE_KEYS.payments, DEFAULT_PAYMENTS)
    );
    setPayments(latestPayments);

    const rentals = latestPayments.filter(r => r.commerceCode.toUpperCase() === normalized);
    const businessName =
      latestLocals.find(l => l.commerceCode.toUpperCase() === normalized)?.businessName ??
      rentals[0]?.businessName;

    if (businessName) {
      setSearchResult({ businessName, rentals });
      setNotFound(false);
    } else {
      setSearchResult(null);
      setNotFound(true);
    }
  };

  const handlePayClick = (rental: Rental) => {
    setSelectedRental(rental);
    setIsModalOpen(true);
  };

  const handleConfirmPayment = (payload: { paidDeltaAmount: number; paidDeltaCommission: number }) => {
    if (!selectedRental) return;
    const nextPayments = payments.map(p =>
      p.id === selectedRental.id ? applyPaymentDelta(p, payload) : p
    );
    savePayments(nextPayments);

    const normalized = commerceCode.toUpperCase();
    const rentals = normalizePayments(nextPayments).filter(r => r.commerceCode.toUpperCase() === normalized);
    if (searchResult) {
      setSearchResult({ ...searchResult, rentals });
    }
  };

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

  const searchRentals = searchResult ? normalizePayments(searchResult.rentals) : [];
  const totalPending = searchRentals
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + getRemaining(r).remainingTotal, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onLogoClick={onBack} />
      
      {/* Hero Banner */}
      <div className="relative h-[180px] sm:h-[250px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://www.accep.org.pe/wp-content/uploads/2025/03/mallplaza-peru.png"
            alt="Shopping Mall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Consulta de Cliente
          </h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#E91E63] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </button>
          
          {/* Search Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Consulta tus Deudas
            </h2>
            <p className="text-gray-600 mb-6">
              Ingresa tu código de comercio para ver tus alquileres pendientes
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={commerceCode}
                  onChange={(e) => setCommerceCode(e.target.value)}
                  placeholder="Ej: COM-001"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
              >
                Buscar
              </button>
            </form>
            
            {/* Demo codes hint */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Códigos de prueba:</strong> COM-001, COM-002, COM-003
              </p>
            </div>
          </div>
          
          {/* Not Found Message */}
          {notFound && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700">
                No se encontró información para el código ingresado. Verifica e intenta nuevamente.
              </p>
            </div>
          )}
          
          {/* Results */}
          {searchResult && (
            <div>
              {/* Business Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchResult.businessName}
                </h3>
                <p className="text-gray-600">
                  Código: <span className="font-medium text-gray-900">{commerceCode.toUpperCase()}</span>
                </p>
                    {totalPending > 0 && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <strong>Total Pendiente:</strong> {formatCurrency(totalPending)}
                        </p>
                      </div>
                    )}
              </div>
              
              {/* Rentals Table */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">
                    Historial de Alquileres
                  </h3>
                </div>
                
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Local</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Periodo</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Vencimiento</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Monto</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {searchRentals.map((rental) => {
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
                                type="button"
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
                {searchRentals.map((rental) => {
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
                            type="button"
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
        )}
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
