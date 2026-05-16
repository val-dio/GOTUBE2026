import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center justify-center w-9 h-9 rounded-full shrink-0
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {dark
        ? <Sun  className="w-5 h-5 text-gray-200" strokeWidth={1.75} />
        : <Moon className="w-5 h-5 text-gray-700" strokeWidth={1.75} />
      }
    </button>
  );
};

export default ThemeToggle;
