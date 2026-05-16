import { useVideo } from '../context/VideoContext';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import HamburgerButton from './HamburgerButton';

const Header = () => {
  const { loadDefault } = useVideo();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-2 px-3 sm:px-4 h-14
                        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Hamburger */}
      <HamburgerButton />

      {/* Logo — always visible */}
      <button
        onClick={loadDefault}
        aria-label="Go home"
        className="shrink-0 text-lg font-extrabold tracking-tight text-red-600
                   hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        GoTube
      </button>

      {/* Search — takes remaining space */}
      <div className="flex flex-1 justify-center min-w-0 px-1 sm:px-2">
        <SearchBar />
      </div>

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
};

export default Header;
