import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Home from '../pages/Home';
import Player from '../pages/Player';
import { useSidebar } from '../context/SidebarContext';

/** Shared layout wrapper — header, sidebar, modal, main content */
const Layout = () => {
  const { open } = useSidebar();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <Sidebar />
      <Modal />
      <main className={`transition-all duration-300 pt-14 ${open ? 'lg:ml-56' : 'ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
};

const AppRouter = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="search/:query" element={<Home />} />
      <Route path="watch/:videoId" element={<Player />} />
      <Route path="trending" element={<Home />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default AppRouter;
