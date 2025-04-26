import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Settings as SettingsIcon, User, Trash2, Lock } from 'lucide-react';

function Settings() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [settings, setSettings] = useState({ emailNotifications: true });
  const [loading, setLoading] = useState({ profile: false, settings: false, password: false, delete: false });
  const [message, setMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' });
      setSettings({ emailNotifications: user.emailNotifications || true });
    }
  }, [user]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, profile: true }));
    setMessage(null);
    try {
      await axios.put('/api/users/me', profile, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, settings: true }));
    setMessage(null);
    try {
      await axios.put('/api/settings', settings, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update settings.' });
    } finally {
      setLoading((prev) => ({ ...prev, settings: false }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, password: true }));
    setMessage(null);
    setPasswordError(null);

    const { oldPassword, newPassword, confirmPassword } = passwordData;

    // Client-side validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      setLoading((prev) => ({ ...prev, password: false }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setLoading((prev) => ({ ...prev, password: false }));
      return;
    }
    if (!validatePassword(newPassword)) {
      setPasswordError('New password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      setLoading((prev) => ({ ...prev, password: false }));
      return;
    }

    try {
      await axios.post(
        '/api/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handleDeleteAccount = async () => {
    setLoading((prev) => ({ ...prev, delete: true }));
    setMessage(null);
    try {
      await axios.post('/api/delete-account', {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out.' });
      setTimeout(() => window.location.href = '/logout', 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete account.' });
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange">Settings</h1>

      {/* Header Card */}
      <div className="card bg-teal/10 p-6 mb-8 text-center rounded-lg shadow-md">
        <SettingsIcon size={64} className="mx-auto mb-3 text-orange" />
        <h2 className="text-2xl font-semibold text-teal">Manage Your ARTISTIC Profile</h2>
        <p className="text-gray-600">Customize your experience and account details</p>
      </div>

      {message && (
        <div className={`message p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Form Card */}
      <div className="card mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="card-title text-xl font-semibold mb-4 flex items-center">
          <User size={24} className="mr-2 text-orange" /> Profile Information
        </h3>
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group mb-4">
            <label htmlFor="name" className="form-label block text-gray-700 font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={loading.profile}
              required
            />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="email" className="form-label block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled={loading.profile}
              required
            />
          </div>
          <button
            type="submit"
            className="button bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition disabled:opacity-50"
            disabled={loading.profile}
          >
            {loading.profile ? 'Updating...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Notification Settings Card */}
      <div className="card mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="card-title text-xl font-semibold mb-4">Notification Settings</h3>
        <form onSubmit={handleSettingsUpdate}>
          <div className="form-group mb-4">
            <label htmlFor="emailNotifications" className="form-label flex items-center">
              <input
                id="emailNotifications"
                type="checkbox"
                className="mr-2 h-5 w-5 text-orange focus:ring-orange"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                disabled={loading.settings}
              />
              Receive Email Notifications
            </label>
          </div>
          <button
            type="submit"
            className="button bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition disabled:opacity-50"
            disabled={loading.settings}
          >
            {loading.settings ? 'Updating...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Account Actions Card */}
      <div className="card p-6 bg-white rounded-lg shadow-md">
        <h3 className="card-title text-xl font-semibold mb-4">Account Actions</h3>
        <div className="action-buttons flex flex-col space-y-4">
          <button
            className="button button-secondary bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition disabled:opacity-50"
            onClick={() => setShowPasswordModal(true)}
            disabled={loading.password}
          >
            <Lock size={20} className="inline mr-2" /> Change Password
          </button>
          <button
            className="button button-danger bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition disabled:opacity-50"
            onClick={() => setShowDeleteModal(true)}
            disabled={loading.delete}
          >
            <Trash2 size={20} className="inline mr-2" /> Delete Account
          </button>
          <button className="button button-secondary bg-gray-300 text-gray-700 py-2 px-4 rounded-md cursor-not-allowed" disabled>
            Toggle Theme (Coming Soon)
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-orange">Change Password</h3>
            {passwordError && (
              <div className="message p-3 mb-4 bg-red-100 text-red-800 rounded-md">
                {passwordError}
              </div>
            )}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group mb-4">
                <label htmlFor="oldPassword" className="form-label block text-gray-700 font-medium mb-1">
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  disabled={loading.password}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label htmlFor="newPassword" className="form-label block text-gray-700 font-medium mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={loading.password}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label htmlFor="confirmPassword" className="form-label block text-gray-700 font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={loading.password}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="button bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError(null);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={loading.password}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition disabled:opacity-50"
                  disabled={loading.password}
                >
                  {loading.password ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Confirm Account Deletion</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete your account? This action cannot be undone, and all your data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="button bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="button bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                onClick={handleDeleteAccount}
                disabled={loading.delete}
              >
                {loading.delete ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;