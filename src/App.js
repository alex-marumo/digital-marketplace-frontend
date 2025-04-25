import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
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

function PrivateRoute({ component: Component, isAdminRoute = false, ...rest }) {
  const { authenticated, user } = useAuth();
  const navigate = useNavigate();
  console.log('PrivateRoute props:', { isAdminRoute, path: rest.path, authenticated, role: user?.role, status: user?.status, user });

  useEffect(() => {
    if (user?.role === 'admin' && isAdminRoute) {
      console.log('Admin user, admin route, allowing render:', { path: rest.path, isAdminRoute });
      return;
    }
    if (isAdminRoute && (!user || !authenticated || user?.role !== 'admin')) {
      console.log('Admin route blocked, redirecting to /dashboard:', { authenticated, role: user?.role });
      navigate('/dashboard', { replace: true });
    } else if (!isAdminRoute && !authenticated) {
      console.log('Non-admin route, not authenticated, redirecting to /login-register');
      navigate('/login-register', { replace: true });
    } else {
      console.log('PrivateRoute allowing render:', { path: rest.path, isAdminRoute });
    }
  }, [authenticated, user, isAdminRoute, navigate, rest.path]);

  if (user?.role === 'admin' && isAdminRoute) {
    console.log('Rendering admin component:', { component: Component.name });
    return <Component />;
  }
  if (isAdminRoute && (!user || !authenticated || user?.role !== 'admin')) {
    return <div>Redirecting to dashboard...</div>;
  }
  if (!isAdminRoute && !authenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <Component />;
}

function App() {
  console.log('App rendering, mounting routes');
  return (
    <AuthProvider>
      <Router>
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
              <Route path="/dashboard" element={<PrivateRoute component={Dashboard} isAdminRoute={false} />} />
              <Route path="/profile" element={<PrivateRoute component={Profile} />} />
              <Route path="/settings" element={<PrivateRoute component={Settings} />} />
              <Route path="/artworks/:userId" element={<PrivateRoute component={Artworks} />} />
              <Route path="/artworks" element={<PrivateRoute component={Artworks} />} />
              <Route path="/artwork/:id" element={<PrivateRoute component={ArtworkDetail} />} />
              <Route path="/add-artwork" element={<PrivateRoute component={AddArtwork} />} />
              <Route path="/edit-artwork/:id" element={<PrivateRoute component={EditArtwork} />} />
              <Route path="/orders" element={<PrivateRoute component={Orders} />} />
              <Route path="/sales" element={<PrivateRoute component={Sales} />} />
              <Route path="/request-artist" element={<PrivateRoute component={RequestArtist} />} />
              <Route path="/messages" element={<PrivateRoute component={Messages} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;