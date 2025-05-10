import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/styles.css';

function Messages() {
  const { token, user, logout } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);

  const isValidUUID = (str) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Fetch artworks for starting threads
  useEffect(() => {
    if (!token || !user) return;

    const fetchArtworks = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/artworks', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setArtworks(res.data);
      } catch (err) {
        console.error('Fetch artworks error:', err);
      }
    };

    fetchArtworks();
  }, [token, user]);

  // Fetch threads
  useEffect(() => {
    console.log('Auth state:', { token: !!token, user, keycloak_id: user?.keycloak_id });
    if (!token || !user) {
      setError('Please log in to view messages.');
      setIsLoading(false);
      return;
    }
    if (!isValidUUID(user.keycloak_id)) {
      setError('Invalid user ID. Try logging out and back in.');
      setIsLoading(false);
      return;
    }

    const fetchThreads = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get('http://localhost:3000/api/threads', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setThreads(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load conversations.');
        console.error('Fetch threads error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [token, user]);

  // Fetch messages and set polling
  useEffect(() => {
    if (!selectedThread || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/threads/${selectedThread.id}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setMessages(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load messages.');
        console.error('Fetch messages error:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedThread, token]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !token) {
      setError('Please type a message and select a conversation.');
      return;
    }

    try {
      await axios.post(
        `http://localhost:3000/api/threads/${selectedThread.id}/messages`,
        { content: newMessage.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setNewMessage('');
      const res = await axios.get(
        `http://localhost:3000/api/threads/${selectedThread.id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setMessages(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message.');
      console.error('Send message error:', err);
    }
  };

  // Start new thread
  const handleCreateThread = async () => {
    if (!token || !user || !selectedArtwork) {
      setError('Please select an artwork to start a conversation.');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3000/api/threads',
        { artworkId: parseInt(selectedArtwork) },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setThreads([res.data, ...threads]);
      setSelectedThread(res.data);
      setSelectedArtwork('');
      setShowArtworkPicker(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation.');
      console.error('Create thread error:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = 'http://localhost:3001';
    } catch (err) {
      setError('Failed to log out.');
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="messages-container">
      <header className="messages-header">
        <h1>Messages</h1>
        {user && (
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        )}
      </header>

      {error && <p className="error-message">{error}</p>}
      {isLoading ? (
        <p>Loading conversations...</p>
      ) : (
        <div className="messages-grid">
          <div className="thread-list">
            <h2>Conversations</h2>
            <button
              className="new-thread-button"
              onClick={() => setShowArtworkPicker(!showArtworkPicker)}
            >
              Start New Conversation
            </button>
            {showArtworkPicker && (
              <div className="artwork-picker">
                <select
                  value={selectedArtwork}
                  onChange={(e) => setSelectedArtwork(e.target.value)}
                  className="artwork-select"
                >
                  <option value="">Select an artwork</option>
                  {artworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}>
                      {artwork.title} by {artwork.artist_username || 'Unknown'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCreateThread}
                  className="create-thread-button"
                  disabled={!selectedArtwork}
                >
                  Start Chat
                </button>
              </div>
            )}
            {threads.length === 0 ? (
              <p>No conversations yet. Start one!</p>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`thread-card ${
                    selectedThread?.id === thread.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <p className="thread-user">
                    {thread.role === 'artist' ? 'Artist' : 'Buyer'}: {thread.username || 'Unknown'}
                  </p>
                  <p className="thread-preview">
                    {thread.artwork_title ? `About: ${thread.artwork_title}` : 'General chat'}
                  </p>
                  <p className="thread-last-message">{thread.last_message || 'No messages'}</p>
                </div>
              ))
            )}
          </div>

          <div className="message-view">
            {selectedThread ? (
              <>
                <h2>
                  Chat with {selectedThread.role === 'artist' ? 'Artist' : 'Buyer'}: {selectedThread.username || 'Unknown'}
                  {selectedThread.artwork_title && ` about ${selectedThread.artwork_title}`}
                </h2>
                <div className="message-list">
                  {messages.length === 0 ? (
                    <p>No messages yet. Say something!</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-card ${
                          msg.sender_id === user?.keycloak_id ? 'sent' : 'received'
                        }`}
                      >
                        <p className="message-content">{msg.content}</p>
                        <p className="message-meta">
                          {msg.sender_id === user?.keycloak_id ? 'You' : msg.username || 'Unknown'} •{' '}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSend} className="message-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                  />
                  <button type="submit" className="send-button">Send</button>
                </form>
              </>
            ) : (
              <p>Select a conversation to start chatting.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;