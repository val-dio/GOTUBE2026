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
  const { view } = useVideo();
  const { open } = useSidebar();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <Sidebar />
      <Modal />

      {/* Main content — shifts right on desktop when sidebar open */}
      <main className={`transition-all duration-300 ${open ? 'lg:ml-56' : 'ml-0'}`}>
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
