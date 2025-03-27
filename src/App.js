import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import ArtworkListingPage from './pages/ArtworkListingPage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrdersListPage from './pages/OrdersListPage';
import AddArtworkPage from './pages/AddArtworkPage';
import EditArtworkPage from './pages/EditArtworkPage';
import ArtworkManagementPage from './pages/ArtworkManagementPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login-register" element={<LoginRegisterPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/artworks" element={<ArtworkListingPage />} />
              <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
              <Route path="/payment/:orderId" element={<PaymentPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
              <Route path="/orders" element={<OrdersListPage />} />
              <Route path="/add-artwork" element={<AddArtworkPage />} />
              <Route path="/edit-artwork/:id" element={<EditArtworkPage />} />
              <Route path="/artwork-management" element={<ArtworkManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;