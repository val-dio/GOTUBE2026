import { useEffect } from 'react';
import {
  Home, TrendingUp, Star, Film, Gamepad2,
  Music, Trophy, Newspaper, Radio, Mic2, Play,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useVideo } from '../context/VideoContext';
import { useModal } from '../context/ModalContext';
import SidebarItem from './SidebarItem';

const YEAR = new Date().getFullYear();

const CATEGORIES = [
  { label: 'Home',       icon: Home,       query: null },
  { label: 'Trending',   icon: TrendingUp,  query: `trending viral ${YEAR}` },
  { label: 'Highlights', icon: Star,        query: `best highlights ${YEAR}` },
  { label: 'Movies',     icon: Film,        query: `movies trailers ${YEAR}` },
  { label: 'Gaming',     icon: Gamepad2,    query: `gaming videos ${YEAR}` },
  { label: 'Music',      icon: Music,       query: `music videos ${YEAR}` },
  { label: 'Sports',     icon: Trophy,      query: `sports highlights ${YEAR}` },
  { label: 'News',       icon: Newspaper,   query: 'world news today' },
  { label: 'Live',       icon: Radio,       query: 'live stream now' },
  { label: 'Podcasts',   icon: Mic2,        query: `best podcasts ${YEAR}` },
  { label: 'Shorts',     icon: Play,        query: `youtube shorts ${YEAR}` },
];

const FOOTER_LINKS = [
  { label: 'About Us',   modal: 'about'   },
  { label: 'FAQs',       modal: 'faqs'    },
  { label: 'Contact Us', modal: 'contact' },
];

const Sidebar = () => {
  const { open, close }         = useSidebar();
  const { search, loadDefault } = useVideo();
  const { open: openModal }     = useModal();

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const handleCategory = (label) => {
    const cat = CATEGORIES.find(c => c.label === label);
    if (!cat) return;
    if (!cat.query) loadDefault();
    else search(cat.query);
    if (window.innerWidth < 1024) close();
  };

  const handleFooterLink = (modal) => {
    openModal(modal);
    if (window.innerWidth < 1024) close();
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-56
                    bg-white dark:bg-gray-900
                    border-r border-gray-200 dark:border-gray-800
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Nav categories */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {CATEGORIES.map(({ label, icon }) => (
            <SidebarItem
              key={label}
              label={label}
              icon={icon}
              onClick={handleCategory}
            />
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 border-t border-gray-200 dark:border-gray-700" />

        {/* Footer links */}
        <div className="px-3 py-2 space-y-0.5">
          {FOOTER_LINKS.map(({ label, modal }) => (
            <button
              key={label}
              onClick={() => handleFooterLink(modal)}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500
                         hover:text-gray-700 dark:hover:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-gray-200 dark:border-gray-700" />

        {/* Copyright */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">© Valdiosolution</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
