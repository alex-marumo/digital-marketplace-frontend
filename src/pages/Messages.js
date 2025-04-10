import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Messages() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    axios.get('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMessages(res.data));
  }, [token]);

  const handleSend = async (e) => {
    e.preventDefault();
    await axios.post('/api/messages', { content: newMessage }, { headers: { Authorization: `Bearer ${token}` } });
    setNewMessage('');
    // Refresh messages
  };

  return (
    <div className="container">
      <h1>Messages</h1>
      {messages.map((msg) => (
        <div key={msg.id} className="card">
          <div className="card-content">
            <p>{msg.content}</p>
            <p>From: {msg.sender}</p>
          </div>
        </div>
      ))}
      <form onSubmit={handleSend}>
        <div className="form-group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
          />
        </div>
        <button type="submit" className="button">Send</button>
      </form>
    </div>
  );
}

export default Messages;