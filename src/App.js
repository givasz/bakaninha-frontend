import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Navbar from './components/Navbar';
import MenuPage from './pages/MenuPage';
import MarmitaPage from './pages/MarmitaPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import api from './utils/api';

// Rota admin "obscura" — configurável via env (sem barra no início)
// Default: /painel-bk-2026
const ADMIN_BASE = `/${(process.env.REACT_APP_ADMIN_PATH || 'painel-bk-2026').replace(/^\/+|\/+$/g, '')}`;
const ADMIN_LOGIN = `${ADMIN_BASE}/login`;

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to={ADMIN_LOGIN} replace />;
}

function AppRoutes() {
  const [scheduleStatus, setScheduleStatus] = useState(null);

  useEffect(() => {
    api.get('/schedule/status')
      .then(r => setScheduleStatus(r.data))
      .catch(() => setScheduleStatus({ open: true, message: 'Aberto' }));

    const interval = setInterval(() => {
      api.get('/schedule/status')
        .then(r => setScheduleStatus(r.data))
        .catch(() => {});
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes – no navbar */}
        <Route path={ADMIN_LOGIN} element={<LoginPage />} />
        <Route path={ADMIN_BASE} element={
          <PrivateRoute><AdminPage /></PrivateRoute>
        } />

        {/* Public routes – with navbar */}
        <Route path="/*" element={
          <>
            <Navbar scheduleStatus={scheduleStatus} />
            <Routes>
              <Route path="/"         element={<MenuPage scheduleStatus={scheduleStatus} />} />
              <Route path="/marmita"  element={<MarmitaPage scheduleStatus={scheduleStatus} />} />
              <Route path="/checkout" element={<CheckoutPage scheduleStatus={scheduleStatus} />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// expose for components that need to navigate to the admin
export { ADMIN_BASE, ADMIN_LOGIN };
