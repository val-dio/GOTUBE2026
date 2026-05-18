import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { VideoProvider, useVideo } from './context/VideoContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { ModalProvider } from './context/ModalContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import Home from './pages/Home';
import Player from './pages/Player';

const AppContent = () => {
  const { view, goHome } = useVideo();
  const { open } = useSidebar();

  // Browser back/forward button support
  useEffect(() => {
    const handlePop = () => {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        goHome();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [goHome]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <Sidebar />
      <Modal />
      <main className={`transition-all duration-300 pt-14 ${open ? 'lg:ml-56' : 'ml-0'}`}>
        {view === 'home'   && <Home />}
        {view === 'player' && <Player />}
      </main>
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <VideoProvider>
      <SidebarProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </SidebarProvider>
    </VideoProvider>
  </ThemeProvider>
);

export default App;
