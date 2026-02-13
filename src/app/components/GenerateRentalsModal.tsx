import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/format';

interface GenerateRentalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locals: Array<{
    id: number;
    code: string;
    businessName: string;
    commerceCode: string;
    monthlyRent: number;
    status: 'active' | 'inactive';
  }>;
  onGenerate: (data: {
    period: string;
    dueDate: string;
    selectedLocals: number[];
  }) => void;
}

export function GenerateRentalsModal({ isOpen, onClose, locals, onGenerate }: GenerateRentalsModalProps) {
  const [selectedLocals, setSelectedLocals] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeLocals = locals.filter(l => l.status === 'active');

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLocals([]);
    } else {
      setSelectedLocals(activeLocals.map(l => l.id));
    }
    setSelectAll(!selectAll);
    setErrorMessage('');
  };

  const handleToggleLocal = (id: number) => {
    if (selectedLocals.includes(id)) {
      setSelectedLocals(selectedLocals.filter(l => l !== id));
    } else {
      setSelectedLocals([...selectedLocals, id]);
    }
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (selectedLocals.length === 0) {
      setErrorMessage('Debes seleccionar al menos un local.');
      return;
    }
    
    onGenerate({
      period: formData.get('period') as string,
      dueDate: formData.get('dueDate') as string,
      selectedLocals
    });
    
    setSelectedLocals([]);
    setSelectAll(false);
    setErrorMessage('');
    onClose();
  };

  const totalAmount = activeLocals
    .filter(l => selectedLocals.includes(l.id))
    .reduce((sum, l) => sum + l.monthlyRent, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Generar Cobros de Alquiler
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periodo *
              </label>
              <input
                type="text"
                name="period"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                placeholder="Ej: Marzo 2026"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                name="dueDate"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Seleccionar Locales *
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-[#E91E63] hover:underline"
              >
                {selectAll ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#E91E63] rounded focus:ring-[#E91E63]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Negocio</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código Comercio</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Alquiler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeLocals.map((local) => (
                      <tr 
                        key={local.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedLocals.includes(local.id) ? 'bg-pink-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLocals.includes(local.id)}
                            onChange={() => handleToggleLocal(local.id)}
                            className="w-4 h-4 text-[#E91E63] rounded focus:ring-[#E91E63]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{local.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{local.businessName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{local.commerceCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {formatCurrency(local.monthlyRent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedLocals.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">
                    <strong>{selectedLocals.length}</strong> locales seleccionados
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    Total: {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            )}
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
              Generar Cobros
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
