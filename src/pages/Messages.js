import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/styles.css';

function Messages() {
  const { token, user } = useAuth();

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);
  const messageEndRef = useRef(null);

  const isValidUUID = (str) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  };

  useEffect(() => {
    if (!token || !user) return;
    axios
      .get('http://localhost:3000/api/artworks', authHeaders)
      .then((res) => setArtworks(res.data))
      .catch((err) => console.error('Error fetching artworks:', err));
  }, [token, user]);

  useEffect(() => {
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

    setIsLoading(true);
    axios
      .get('http://localhost:3000/api/threads', authHeaders)
      .then((res) => setThreads(res.data))
      .catch((err) =>
        setError(err.response?.data?.error || 'Failed to load conversations.')
      )
      .finally(() => setIsLoading(false));
  }, [token, user]);

  useEffect(() => {
    if (!selectedThread || !token) return;

    const fetchMessages = () =>
      axios
        .get(`http://localhost:3000/api/threads/${selectedThread.id}/messages`, authHeaders)
        .then((res) => {
          setMessages(res.data);
          setError('');
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Failed to load messages.');
          console.error(err);
        });

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedThread, token]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `http://localhost:3000/api/threads/${selectedThread.id}/messages`,
        { content: newMessage },
        authHeaders
      );
      setNewMessage('');
      const res = await axios.get(
        `http://localhost:3000/api/threads/${selectedThread.id}/messages`,
        authHeaders
      );
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message.');
    }
  };

  const handleCreateThread = async () => {
    if (!selectedArtwork) {
      setError('Please select an artwork to start a conversation.');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3000/api/threads',
        { artworkId: parseInt(selectedArtwork) },
        authHeaders
      );
      setThreads([res.data, ...threads]);
      setSelectedThread(res.data);
      setSelectedArtwork('');
      setShowArtworkPicker(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation.');
    }
  };

  return (
    <div className="messages-container">
      <header className="messages-header">
        <h1>Messages</h1>
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
                  className={`thread-card ${selectedThread?.id === thread.id ? 'active' : ''}`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <p className="thread-user">
                    {thread.role === 'artist' ? 'Artist' : 'Buyer'}: {thread.username || 'Unknown'}
                  </p>
                  <p className="thread-preview">
                    {thread.artwork_title ? `About: ${thread.artwork_title}` : 'General chat'}
                  </p>
                  <p className="thread-last-message">
                    {thread.last_message || 'No messages'}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="message-view">
  {selectedThread ? (
    <>
      <h2>
        Chat with {selectedThread.role === 'artist' ? 'Artist' : 'Buyer'}:{" "}
        {selectedThread.username || "Unknown"}
        {selectedThread.artwork_title && ` about ${selectedThread.artwork_title}`}
      </h2>
      <div className="message-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${
              msg.sender_id === user.id ? "sent" : "received"
            }`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </>
  ) : (
    <p>Select a conversation to start chatting 💬</p>
  )}
</div>

        </div>
      )}
    </div>
  );
}

export default Messages;