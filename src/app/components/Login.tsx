import { Header } from './Header';
import { Mail, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function Login({ onLogin, onBack }: LoginProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onLogoClick={onBack} />
      
      {/* Hero Section */}
      <div className="relative h-[420px] sm:h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://www.accep.org.pe/wp-content/uploads/2025/03/mallplaza-peru.png"
            alt="Shopping Mall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Login Card */}
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-10 w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Portal de Arrendatarios
              </h1>
              <p className="text-gray-600">
                Accede para visualizar y pagar tus alquileres
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-[#E91E63] text-white py-3 rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
              >
                Ingresar
              </button>
              
              <div className="text-center">
                <a href="#" className="text-sm text-[#E91E63] hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>
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
