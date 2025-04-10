import React from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

Modal.setAppElement('#root');

function RolePromptModal({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const history = useNavigate();

  const handleRoleSelect = async (role) => {
    try {
      await axios.post(
        '/api/user/role',
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      user.role = role;
      if (role === 'artist') {
        history.push('/request-artist');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error selecting role:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} className="container" overlayClassName="overlay">
      <h2>Choose Your Role</h2>
      <p>Please select how you’d like to use the marketplace:</p>
      <button className="button" onClick={() => handleRoleSelect('buyer')}>
        Buyer
      </button>
      <button className="button m-bottom" onClick={() => handleRoleSelect('artist')}>
        Artist
      </button>
    </Modal>
  );
}

export default RolePromptModal;