import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { VideoProvider } from './context/VideoContext';
import { SidebarProvider } from './context/SidebarContext';
import { ModalProvider } from './context/ModalContext';
import AppRouter from './router/AppRouter';

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <VideoProvider>
        <SidebarProvider>
          <ModalProvider>
            <AppRouter />
          </ModalProvider>
        </SidebarProvider>
      </VideoProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
