import { useSidebar } from '../context/SidebarContext';

const SidebarItem = ({ label, icon: Icon, onClick }) => {
  const { activeCategory, setActiveCategory, close } = useSidebar();
  const isActive = activeCategory === label;

  const handleClick = () => {
    setActiveCategory(label);
    onClick(label);
    if (window.innerWidth < 1024) close();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors text-left
                  ${isActive
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
    >
      <Icon
        className={`w-[18px] h-[18px] shrink-0 stroke-[1.75]
                    ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 shrink-0" />
      )}
    </button>
  );
};

export default SidebarItem;
