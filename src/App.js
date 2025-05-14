import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginRegister from './pages/LoginRegister';
import RoleSelection from './pages/RoleSelection';
import UploadArtistDocs from './pages/UploadArtistDocs';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Artworks from './pages/Artworks';
import ArtworkDetail from './pages/ArtworkDetail';
import AddArtwork from './pages/AddArtwork';
import EditArtwork from './pages/EditArtwork';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import RequestArtist from './pages/RequestArtist';
import Messages from './pages/Messages';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

function PrivateRoute({ component: Component, isAdminRoute = false }) {
  const { authenticated, user } = useAuth();
  console.log('🔐 PrivateRoute:', {
    path: Component.name,
    isAdminRoute,
    authenticated,
    role: user?.role,
    status: user?.status,
  });

  if (authenticated === null) {
    console.log('⏳ Auth loading...');
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    console.log('❌ Not authenticated, redirecting to /login-register');
    return <Navigate to="/login-register" replace />;
  }

  if (isAdminRoute && user?.role !== 'admin') {
    console.log('❌ Not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Rendering component:', Component.name);
  return <Component />;
}

function App() {
  console.log('🚀 App mounting routes');
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login-register" element={<LoginRegister />} />
              <Route path="/verify-email" element={<LoginRegister />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/upload-artist-docs" element={<UploadArtistDocs />} />
              <Route path="/admin" element={<PrivateRoute component={AdminPanel} isAdminRoute={true} />} />
              <Route path="/admin-bypass" element={<AdminPanel />} />
              <Route path="/admin-force" element={<AdminPanel />} />
              <Route path="/debug-admin" element={<AdminPanel />} />
              <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
              <Route path="/profile" element={<PrivateRoute component={Profile} />} />
              <Route path="/settings" element={<PrivateRoute component={Settings} />} />
              <Route path="/artworks/:id" element={<PrivateRoute component={ArtworkDetail} />} />
              <Route path="/artworks/:userId" element={<PrivateRoute component={Artworks} />} />
              <Route path="/artworks" element={<PrivateRoute component={Artworks} />} />
              <Route path="/add-artwork" element={<PrivateRoute component={AddArtwork} />} />
              <Route path="/edit-artwork/:id" element={<PrivateRoute component={EditArtwork} />} />
              <Route path="/orders" element={<PrivateRoute component={Orders} />} />
              <Route path="/sales" element={<PrivateRoute component={Sales} />} />
              <Route path="/request-artist" element={<PrivateRoute component={RequestArtist} />} />
              <Route path="/messages" element={<PrivateRoute component={Messages} />} />
              <Route path="/messages/:threadId" element={<PrivateRoute component={Messages} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;