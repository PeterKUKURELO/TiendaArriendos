import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { ValidatePaymentModal } from './ValidatePaymentModal';
import { GenerateRentalsModal } from './GenerateRentalsModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, History } from 'lucide-react';
import type { LocalRecord, PaymentRecord } from '../types';
import { DEFAULT_LOCALS, DEFAULT_PAYMENTS } from '../data/demoData';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';
import { calculateCommission, normalizePayments } from '../utils/payments';
import { formatDate, formatCurrency } from '../utils/format';

interface BackOfficeProps {
  onBack: () => void;
}

type Payment = PaymentRecord;
type Local = LocalRecord;

export function BackOffice({ onBack }: BackOfficeProps) {
  const [activeTab, setActiveTab] = useState<'locals' | 'payments'>('locals');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedHistoryPayment, setSelectedHistoryPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Local | null>(null);
  
  // Filtros para locales
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showLocalFilters, setShowLocalFilters] = useState(false);
  
  // Filtros para pagos
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [showPaymentFilters, setShowPaymentFilters] = useState(false);

  const [locals, setLocals] = useState<Local[]>(() =>
    loadFromStorage(STORAGE_KEYS.locals, DEFAULT_LOCALS)
  );

  const [payments, setPayments] = useState<Payment[]>(() =>
    loadFromStorage(STORAGE_KEYS.payments, DEFAULT_PAYMENTS)
  );

  const [newLocal, setNewLocal] = useState<Partial<Local>>({
    code: '',
    businessName: '',
    commerceCode: 'COM-001',
    area: 0,
    monthlyRent: 0,
    status: 'active'
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.locals, locals);
  }, [locals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.payments, payments);
  }, [payments]);

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const viewPayments = useMemo(() => normalizePayments(payments), [payments]);

  const getNextCommerceCode = () => {
    const maxNum = locals.reduce((acc, local) => {
      const match = local.commerceCode.match(/COM-(\d+)/);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(acc, num) : acc;
    }, 0);
    const next = maxNum + 1;
    return `COM-${String(next).padStart(3, '0')}`;
  };

  const handleAddLocal = (e: React.FormEvent) => {
    e.preventDefault();
    const local: Local = {
      id: locals.length + 1,
      code: newLocal.code!,
      businessName: newLocal.businessName!,
      commerceCode: newLocal.commerceCode!,
      area: newLocal.area!,
      monthlyRent: newLocal.monthlyRent!,
      status: newLocal.status as 'active' | 'inactive'
    };
    setLocals([...locals, local]);
    setShowAddModal(false);
    setNewLocal({ code: '', businessName: '', commerceCode: getNextCommerceCode(), area: 0, monthlyRent: 0, status: 'active' });
  };

  const handleDeleteLocal = (local: Local) => {
    setDeleteTarget(local);
  };

  const confirmDeleteLocal = () => {
    if (!deleteTarget) return;
    setLocals(locals.filter(l => l.id !== deleteTarget.id));
    setFlashMessage(`Se eliminó el local ${deleteTarget.code}.`);
    setDeleteTarget(null);
  };

  const handleGenerateRentals = (data: { period: string; dueDate: string; selectedLocals: number[] }) => {
    const selectedLocalsData = locals.filter(l => data.selectedLocals.includes(l.id));
    const existingKeys = new Set(
      payments.map(p => `${p.commerceCode}|${p.local}|${p.period}`)
    );
    const baseId = Math.max(0, ...payments.map(p => p.id));
    const newPayments: Payment[] = selectedLocalsData
      .filter(local => !existingKeys.has(`${local.commerceCode}|${local.code}|${data.period}`))
      .map((local, index) => ({
        id: baseId + index + 1,
        commerceCode: local.commerceCode,
        businessName: local.businessName,
        local: local.code,
        period: data.period,
        amount: local.monthlyRent,
        dueDate: data.dueDate,
        status: 'pending'
      }));
    const skipped = selectedLocalsData.length - newPayments.length;
    setPayments([...payments, ...newPayments]);
    if (newPayments.length > 0) {
      const suffix = skipped > 0 ? ` Se omitieron ${skipped} por duplicados.` : '';
      setFlashMessage(`Se generaron ${newPayments.length} cobros para ${data.period}.${suffix}`);
    } else {
      setFlashMessage(`No se generaron cobros nuevos para ${data.period} (ya existían).`);
    }
  };

  const handleValidatePayment = (paymentData: {
    merchantCode: string;
    operationNumber: string;
    transactionId: string;
    token: string;
    algApiVersion: string;
    paymentMethod: string;
    paymentDate: string;
    reference: string;
    notes: string;
  }) => {
    if (selectedPayment) {
      setPayments(payments.map(p =>
        p.id === selectedPayment.id
          ? {
              ...p,
              status: 'paid' as const,
              paidDate: paymentData.paymentDate,
              transactionNumber: paymentData.transactionId,
              paymentMethod: paymentData.paymentMethod,
              paidAmount: p.amount,
              paidCommission: calculateCommission(p.amount),
              history: [
                ...(p.history ?? []),
                {
                  paymentDate: paymentData.paymentDate,
                  paymentMethod: paymentData.paymentMethod,
                  reference: paymentData.reference,
                  notes: paymentData.notes,
                  merchantCode: paymentData.merchantCode,
                  operationNumber: paymentData.operationNumber,
                  transactionId: paymentData.transactionId,
                  token: paymentData.token,
                  algApiVersion: paymentData.algApiVersion
                }
              ]
            }
          : p
      ));
      setFlashMessage(`Pago validado para ${selectedPayment.local} (${selectedPayment.period}).`);
    }
  };

  const handleMarkAsPaid = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowValidateModal(true);
  };

  const handleViewHistory = (payment: Payment) => {
    setSelectedHistoryPayment(payment);
    setShowHistoryModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Activo</span>;
      case 'inactive':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Inactivo</span>;
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

  // Filtrado de locales
  const filteredLocals = locals.filter(l => {
    const matchesSearch = 
      l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.commerceCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = localStatusFilter === 'all' || l.status === localStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtrado de pagos
  const filteredPayments = viewPayments.filter(p => {
    const matchesSearch =
      p.commerceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    const matchesPeriod = periodFilter === 'all' || p.period === periodFilter;
    
    const matchesMinAmount = !minAmountFilter || p.amount >= Number(minAmountFilter);
    const matchesMaxAmount = !maxAmountFilter || p.amount <= Number(maxAmountFilter);
    
    return matchesSearch && matchesStatus && matchesPeriod && matchesMinAmount && matchesMaxAmount;
  });

  // Obtener periodos únicos
  const uniquePeriods = Array.from(new Set(viewPayments.map(p => p.period)));

  const clearLocalFilters = () => {
    setLocalStatusFilter('all');
  };

  const clearPaymentFilters = () => {
    setPaymentStatusFilter('all');
    setPeriodFilter('all');
    setMinAmountFilter('');
    setMaxAmountFilter('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onLogoClick={onBack} />
      
      {/* Hero Banner */}
      <div className="relative h-[160px] sm:h-[200px] w-full overflow-hidden">
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
            Back-office
          </h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#E91E63] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </button>

          {flashMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {flashMessage}
            </div>
          )}
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('locals')}
                className={`pb-4 px-2 border-b-2 transition-colors font-medium ${
                  activeTab === 'locals'
                    ? 'border-[#E91E63] text-[#E91E63]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Gestión de Locales
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-4 px-2 border-b-2 transition-colors font-medium ${
                  activeTab === 'payments'
                    ? 'border-[#E91E63] text-[#E91E63]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Gestión de Alquileres
              </button>
            </div>
          </div>
          
          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => {
                if (activeTab === 'locals') {
                  setShowLocalFilters(!showLocalFilters);
                } else {
                  setShowPaymentFilters(!showPaymentFilters);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
            
            {activeTab === 'locals' && (
              <button
                onClick={() => {
                  setNewLocal({
                    code: '',
                    businessName: '',
                    commerceCode: getNextCommerceCode(),
                    area: 0,
                    monthlyRent: 0,
                    status: 'active'
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Agregar Local
              </button>
            )}
            
            {activeTab === 'payments' && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Generar Cobros
              </button>
            )}
          </div>
          
          {/* Locals Filters */}
          {activeTab === 'locals' && showLocalFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filtros de Locales</h3>
                <button
                  onClick={clearLocalFilters}
                  className="text-sm text-[#E91E63] hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Estado</label>
                  <select
                    value={localStatusFilter}
                    onChange={(e) => setLocalStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Filters */}
          {activeTab === 'payments' && showPaymentFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filtros de Alquileres</h3>
                <button
                  onClick={clearPaymentFilters}
                  className="text-sm text-[#E91E63] hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Estado</label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="paid">Pagados</option>
                    <option value="overdue">Vencidos</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Periodo</label>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  >
                    <option value="all">Todos</option>
                    {uniquePeriods.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Monto mínimo</label>
                  <input
                    type="number"
                    value={minAmountFilter}
                    onChange={(e) => setMinAmountFilter(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Monto máximo</label>
                  <input
                    type="number"
                    value={maxAmountFilter}
                    onChange={(e) => setMaxAmountFilter(e.target.value)}
                    placeholder="999999999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            Mostrando {activeTab === 'locals' ? filteredLocals.length : filteredPayments.length} resultados
          </div>
          
          {/* Locals Table */}
          {activeTab === 'locals' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Código</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Nombre del Negocio</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Código Comercio</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Área (m²)</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Alquiler Mensual</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLocals.map((local) => (
                      <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{local.code}</td>
                        <td className="px-6 py-4 text-gray-700">{local.businessName}</td>
                        <td className="px-6 py-4 text-gray-700">{local.commerceCode}</td>
                        <td className="px-6 py-4 text-gray-700">{local.area}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatCurrency(local.monthlyRent)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(local.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocal(local)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {filteredLocals.map((local) => (
                  <div key={local.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Local</p>
                        <p className="font-medium text-gray-900">{local.code}</p>
                      </div>
                      {getStatusBadge(local.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="col-span-2">
                        <p className="text-gray-500">Negocio</p>
                        <p className="text-gray-900">{local.businessName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Código comercio</p>
                        <p className="text-gray-900">{local.commerceCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Área (m²)</p>
                        <p className="text-gray-900">{local.area}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Alquiler mensual</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(local.monthlyRent)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteLocal(local)}
                        className="flex-1 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Payments Table */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Código Comercio</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Negocio</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Local</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Periodo</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Monto</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Vencimiento</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{payment.commerceCode}</td>
                        <td className="px-6 py-4 text-gray-700">{payment.businessName}</td>
                        <td className="px-6 py-4 text-gray-700">{payment.local}</td>
                        <td className="px-6 py-4 text-gray-700">{payment.period}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{formatDate(payment.dueDate)}</td>
                        <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4">
                          {payment.status !== 'paid' ? (
                            <button
                              onClick={() => handleMarkAsPaid(payment)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Validar Pago
                            </button>
                          ) : (
                            <div className="text-sm flex items-center gap-2">
                              <div>
                                <span className="text-gray-500 block">
                                  Pagado {payment.paidDate && formatDate(payment.paidDate)}
                                </span>
                                {payment.transactionNumber && (
                                  <span className="text-gray-400 text-xs">
                                    {payment.transactionNumber}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleViewHistory(payment)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Ver historial de pago"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Negocio</p>
                        <p className="font-medium text-gray-900">{payment.businessName}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Código comercio</p>
                        <p className="text-gray-900">{payment.commerceCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Local</p>
                        <p className="text-gray-900">{payment.local}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Periodo</p>
                        <p className="text-gray-900">{payment.period}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vencimiento</p>
                        <p className="text-gray-900">{formatDate(payment.dueDate)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Monto</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                      </div>
                    </div>
                    <div>
                      {payment.status !== 'paid' ? (
                        <button
                          onClick={() => handleMarkAsPaid(payment)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Validar Pago
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                          <span className="text-gray-600">
                            Pagado {payment.paidDate && formatDate(payment.paidDate)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleViewHistory(payment)}
                            className="px-3 py-1 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Historial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Local Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Agregar Nuevo Local
            </h2>
            
            <form onSubmit={handleAddLocal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Código del Local</label>
                  <input
                    type="text"
                    value={newLocal.code}
                    onChange={(e) => setNewLocal({ ...newLocal, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                    placeholder="Ej: A-101"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Código de Comercio</label>
                  <input
                    type="text"
                    value={newLocal.commerceCode}
                    onChange={(e) => setNewLocal({ ...newLocal, commerceCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                    placeholder="Ej: COM-005"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nombre del Negocio</label>
                <input
                  type="text"
                  value={newLocal.businessName}
                  onChange={(e) => setNewLocal({ ...newLocal, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  placeholder="Ej: Tienda de Ropa Fashion"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Área (m²)</label>
                  <input
                    type="number"
                    value={newLocal.area}
                    onChange={(e) => setNewLocal({ ...newLocal, area: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                    placeholder="45"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Alquiler Mensual</label>
                  <input
                    type="number"
                    value={newLocal.monthlyRent}
                    onChange={(e) => setNewLocal({ ...newLocal, monthlyRent: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                    placeholder="1200000"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Estado</label>
                <select
                  value={newLocal.status}
                  onChange={(e) => setNewLocal({ ...newLocal, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewLocal({
                      code: '',
                      businessName: '',
                      commerceCode: getNextCommerceCode(),
                      area: 0,
                      monthlyRent: 0,
                      status: 'active'
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
                >
                  Agregar Local
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />

          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Eliminar local</h2>
            <p className="text-sm text-gray-600 mb-6">
              ¿Seguro que deseas eliminar el local <strong>{deleteTarget.code}</strong>?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteLocal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
      
      {/* Validate Payment Modal */}
      <ValidatePaymentModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        payment={selectedPayment}
        onValidate={handleValidatePayment}
      />

      <PaymentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedHistoryPayment(null);
        }}
        payment={selectedHistoryPayment}
      />
      
      {/* Generate Rentals Modal */}
      <GenerateRentalsModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        locals={locals}
        onGenerate={handleGenerateRentals}
      />
    </div>
  );
}
