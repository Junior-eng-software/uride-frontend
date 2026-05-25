import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterForm from './components/auth/RegisterForm';
import VerifyAccountForm from './components/auth/VerifyAccountForm';
import LoginForm from './components/auth/LoginForm';
import UserProfile from './components/profile/UserProfile';
import EditProfileForm from './components/profile/EditProfileForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import SearchRidesView from './pages/SearchRidesView';
import JoinRideView from './pages/JoinRideView';
import ManageRideView from './pages/ManageRideView';
import RideRatingView from './pages/RideRatingView';
import DashboardView from './pages/dashBoardView';
import AdminDashboardView from './pages/adminDashboardView';
import { getCurrentUserRole } from './utils/auth';

// --- Importaciones del Sprint 6 ---
import CreateRideView from './pages/createRideView';
// Importaremos la vista de búsqueda en el siguiente paso
// import SearchRidesView from './pages/SearchRidesView'; 

import type { ReactNode } from 'react';

// 1. [CRÍTICO] Creamos un "Guardián" que lee el token en tiempo real
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  // Nota: Respeto tu clave 'accessToken' de la versión estable. 
  // Asegúrate de que tu LoginForm guarde el token exactamente con este mismo nombre.
  const isAuth = !!localStorage.getItem('accessToken');
  return isAuth ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const role = getCurrentUserRole();

  return role === 'Admin' ? children : <Navigate to="/dashboard" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ─── RUTAS PÚBLICAS ─── */}
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify" element={<VerifyAccountForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/search" element={<SearchRidesView />} />
        <Route path="/rides/search" element={<SearchRidesView />} />


        {/* ─── RUTAS PROTEGIDAS ─── */}
        {/* 2. Envolvemos nuestras pantallas privadas con el Guardián */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboardView />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* --- Rutas del Módulo de Viajes (Sprint 6) --- */}
        <Route
          path="/rides/create"
          element={
            <ProtectedRoute>
              <CreateRideView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/:id/join"
          element={
            <ProtectedRoute>
              <JoinRideView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/:id/manage"
          element={
            <ProtectedRoute>
              <ManageRideView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/:id/rating"
          element={
            <ProtectedRoute>
              <RideRatingView />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}