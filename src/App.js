import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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

function PrivateRoute({ component: Component }) {
  const { authenticated } = useAuth();
  return authenticated ? <Component /> : <Navigate to="/login-register" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login-register" element={<LoginRegister />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/upload-artist-docs" element={<UploadArtistDocs />} />
              <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
              <Route path="/profile" element={<PrivateRoute component={Profile} />} />
              <Route path="/artworks" element={<PrivateRoute component={Artworks} />} />
              <Route path="/artwork/:id" element={<PrivateRoute component={ArtworkDetail} />} />
              <Route path="/add-artwork" element={<PrivateRoute component={AddArtwork} />} />
              <Route path="/edit-artwork/:id" element={<PrivateRoute component={EditArtwork} />} />
              <Route path="/orders" element={<PrivateRoute component={Orders} />} />
              <Route path="/sales" element={<PrivateRoute component={Sales} />} />
              <Route path="/request-artist" element={<PrivateRoute component={RequestArtist} />} />
              <Route path="/messages" element={<PrivateRoute component={Messages} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
