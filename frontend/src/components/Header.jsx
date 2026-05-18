import { useVideo } from '../context/VideoContext';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import HamburgerButton from './HamburgerButton';
import reactLogo from '../assets/react.png';

const Header = () => {
  const { loadDefault } = useVideo();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 sm:px-4 h-14
                       bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Hamburger */}
      <HamburgerButton />

      {/* Logo */}
      <button
        onClick={() => { loadDefault(); window.history.pushState({}, '', '/'); }}
        aria-label="Go home"
        className="shrink-0 flex items-center hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        {/* Mobile Logo */}
        <img src={reactLogo} alt="Logo" className="w-7 h-7 sm:hidden object-contain" />
        {/* Desktop Text */}
        <span className="hidden sm:block text-lg font-extrabold tracking-tight text-red-600">
          GoTube
        </span>
      </button>

      {/* Search bar — takes remaining space */}
      <div className="flex flex-1 justify-center min-w-0 px-1 sm:px-2">
        <SearchBar />
      </div>

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
};

export default Header;
