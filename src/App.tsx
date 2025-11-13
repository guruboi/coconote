import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
// import { useUserStore } from '@/stores/userStore';
import { Header } from '@/components/Header';
import { Home } from '@/pages/Home';
import { FarmView } from '@/pages/FarmView';
import { FarmCreate } from '@/pages/FarmCreate';
import { Finance } from '@/pages/Finance';
import { Market } from '@/pages/Market';
import { News } from '@/pages/News';
import { Calendar } from '@/pages/Calendar';

function App() {
  const { initializeTheme } = useThemeStore();
  // const { isAuthenticated } = useUserStore(); // Will be used later for authentication

  // Initialize theme on app load
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // For now, we'll skip authentication and go straight to the app
  // Authentication will be implemented later
  const showApp = true; // In production, this would be: isAuthenticated

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-frost dark:bg-bg-dark transition-colors">
        {showApp && <Header />}

        <Routes>
          {/* Main routes */}
          <Route path="/" element={<Home />} />
          <Route path="/farm/view" element={<FarmView />} />
          <Route path="/farm/create" element={<FarmCreate />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/market" element={<Market />} />
          <Route path="/news" element={<News />} />
          <Route path="/calendar" element={<Calendar />} />

          {/* Placeholder routes for user menu items */}
          <Route path="/profile" element={<div className="p-6">Profile - Coming Soon</div>} />
          <Route path="/analytics" element={<div className="p-6">Analytics - Coming Soon</div>} />
          <Route path="/data-management" element={<div className="p-6">Data Management - Coming Soon</div>} />
          <Route path="/connectors" element={<div className="p-6">Connectors - Coming Soon</div>} />
          <Route path="/contacts" element={<div className="p-6">Contacts - Coming Soon</div>} />
          <Route path="/switch-user" element={<div className="p-6">Switch Users - Coming Soon</div>} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
