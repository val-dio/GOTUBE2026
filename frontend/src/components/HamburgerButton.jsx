import { Menu, X } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const HamburgerButton = () => {
  const { toggle, open } = useSidebar();

  return (
    <button
      onClick={toggle}
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="flex items-center justify-center w-9 h-9 rounded-full shrink-0
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {open
        ? <X    className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        : <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      }
    </button>
  );
};

export default HamburgerButton;
