import logoMallPlaza from '../assets/images/logo_mallplaza.png';

interface HeaderProps {
  onLogoClick?: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
      return;
    }
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={handleLogoClick} className="flex items-center">
            <img
              src={logoMallPlaza}
              alt="MallPlaza"
              className="h-8 w-auto"
            />
          </button>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-[#E91E63] transition-colors">
              Corporativo
            </a>
            <a href="#" className="text-gray-600 hover:text-[#E91E63] transition-colors">
              Inversionistas
            </a>
            <a href="#" className="text-gray-600 hover:text-[#E91E63] transition-colors">
              Portal Arrendatarios
            </a>
            <a href="#" className="text-gray-600 hover:text-[#E91E63] transition-colors">
              Contacto
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
