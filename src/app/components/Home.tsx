import { Header } from './Header';
import { Building2, UserCircle2, Shield } from 'lucide-react';

interface HomeProps {
  onSelectPortal: (portal: 'tenant' | 'client' | 'admin') => void;
}

export function Home({ onSelectPortal }: HomeProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[260px] sm:h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://www.accep.org.pe/wp-content/uploads/2025/03/mallplaza-peru.png"
            alt="Shopping Mall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Gestión de Alquileres
            </h1>
            <p className="text-xl text-white/90">
              Selecciona el portal al que deseas acceder
            </p>
          </div>
        </div>
      </div>
      
      {/* Portal Selection */}
      <div className="flex-1 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tenant Portal */}
            <button
              onClick={() => onSelectPortal('tenant')}
              className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-[#E91E63] hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-pink-50 rounded-full mb-4 group-hover:bg-pink-100 transition-colors">
                  <Building2 className="w-12 h-12 text-[#E91E63]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Portal de Arrendatarios
                </h3>
                <p className="text-gray-600">
                  Acceso para locatarios. Visualiza y gestiona tus pagos de alquiler.
                </p>
              </div>
            </button>
            
            {/* Client Portal */}
            <button
              onClick={() => onSelectPortal('client')}
              className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-[#E91E63] hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-50 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                  <UserCircle2 className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Consulta de Cliente
                </h3>
                <p className="text-gray-600">
                  Consulta tus deudas pendientes ingresando tu código de comercio.
                </p>
              </div>
            </button>
            
            {/* Admin Portal */}
            <button
              onClick={() => onSelectPortal('admin')}
              className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-[#E91E63] hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-purple-50 rounded-full mb-4 group-hover:bg-purple-100 transition-colors">
                  <Shield className="w-12 h-12 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Back-office
                </h3>
                <p className="text-gray-600">
                  Panel administrativo. Gestiona locales, alquileres y pagos.
                </p>
              </div>
            </button>
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
    </div>
  );
}
