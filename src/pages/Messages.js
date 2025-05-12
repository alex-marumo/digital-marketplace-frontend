// FULLY RESTORED + UPDATED MESSAGES.JS
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function Messages() {
  const { token, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messageEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  };

  useEffect(() => {
    if (!token || !user) return;
    axios.get(`${API_BASE_URL}/api/artworks`, authHeaders)
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
    axios.get(`${API_BASE_URL}/api/threads`, authHeaders)
      .then((res) => {
        const filteredThreads = res.data.filter(thread => thread.status !== 'deleted');
        setThreads(filteredThreads);
        if (filteredThreads.length === 0) {
          setError('No conversations yet. Start one!');
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('No conversations found. Start a new one!');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login-register');
        } else {
          setError(err.response?.data?.error || 'Failed to load conversations.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [token, user, navigate]);

  useEffect(() => {
    if (!selectedThread || !token) return;
    const fetchMessages = () => {
      axios.get(`${API_BASE_URL}/api/threads/${selectedThread.id}/messages`, authHeaders)
        .then((res) => {
          setMessages(res.data.filter(msg => msg.status !== 'deleted'));
          setError('');
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Failed to load messages.');
        });
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [selectedThread, token]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!searchTerm.trim()) return setFilteredArtworks([]);
    const term = searchTerm.toLowerCase();
    const filtered = artworks.filter(
      (art) =>
        art.title.toLowerCase().includes(term) ||
        (art.artist_username && art.artist_username.toLowerCase().includes(term))
    );
    setFilteredArtworks(filtered);
  }, [searchTerm, artworks]);

  let lastSend = 0;
  const handleSend = async (e) => {
    e.preventDefault();
    if (Date.now() - lastSend < 3000) return; // 3s cooldown
    lastSend = Date.now();
    if (!newMessage.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/threads/${selectedThread.id}/messages`, { content: newMessage }, authHeaders);
      if (!selectedThread || !selectedThread.id) {
        setError("No conversation selected.");
        return;
      }
      console.log("Sending to:", `${API_BASE_URL}/api/threads/${selectedThread.id}/messages`);
      console.log("Message content:", newMessage);

      setNewMessage('');
      const res = await axios.get(`${API_BASE_URL}/api/threads/${selectedThread.id}/messages`, authHeaders);
      setMessages(res.data.filter(msg => msg.status !== 'deleted'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message.');
    }
  };

  const handleCreateThread = async () => {
    if (!selectedArtwork) {
      setError('Please select an artwork.');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/threads`, { artworkId: parseInt(selectedArtwork) }, authHeaders);
      if (!res.data || (!res.data.id && !res.data.thread?.id)) {
        setError('Unexpected response. Try again.');
        return;
      }
      const thread = res.data.redirect ? res.data.thread : res.data;
      setThreads([thread, ...threads]);
      setSelectedThread(thread);
      navigate(`/messages/${thread.id}`);
      setSelectedArtwork('');
      setSearchTerm('');
      setShowArtworkPicker(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation.');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Yo, you sure you wanna trash this convo?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/threads/${threadId}`, authHeaders);
      setThreads(threads.filter(thread => thread.id !== threadId));
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
        setMessages([]);
        navigate('/messages');
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete conversation.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', backgroundColor: '#f4f1de', minHeight: '100vh', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ff6200', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Messages</h1>
      </header>
      {error && (
        <p style={{ color: '#d00000', fontSize: '1rem', textAlign: 'center', marginBottom: '1rem', fontWeight: '600' }}>{error}</p>
      )}
      {isLoading ? (
        <p style={{ color: '#2b2d42', fontSize: '1.5rem', textAlign: 'center', fontWeight: '600' }}>Loading conversations...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
            gap: '1.5rem',
            maxHeight: '70vh'
          }}
        >
          {/* THREAD LIST */}
          <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem', backgroundColor: '#f4f1de', borderRadius: '8px', border: '2px solid #2b2d42' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6200', marginBottom: '1rem' }}>Conversations</h2>
            <button onClick={() => setShowArtworkPicker(!showArtworkPicker)} style={{ display: 'block', width: '100%', padding: '0.75rem', backgroundColor: '#ff6200', color: '#f4f1de', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}>Start New Conversation</button>
            {showArtworkPicker && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f4f1de', borderRadius: '4px', border: '1px solid #ff6200' }}>
                <input
                  type="text"
                  placeholder="Search by artwork or artist name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '2px solid #ff6200', borderRadius: '4px', marginBottom: '0.5rem' }}
                />
                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '0.5rem' }}>
                  {filteredArtworks.map((art) => (
                    <div key={art.id} onClick={() => setSelectedArtwork(art.id)} style={{ padding: '0.5rem', backgroundColor: selectedArtwork == art.id ? '#ffe8d6' : '#fff', cursor: 'pointer', borderBottom: '1px solid #ccc' }}>
                      {art.title} by {art.artist_username || 'Unknown'}
                    </div>
                  ))}
                </div>
                <button onClick={handleCreateThread} disabled={!selectedArtwork} style={{ width: '100%', padding: '0.75rem', backgroundColor: selectedArtwork ? '#ff6200' : '#6b7280', color: '#fff', fontWeight: '600', borderRadius: '4px', border: 'none', cursor: selectedArtwork ? 'pointer' : 'not-allowed' }}>Start Chat</button>
              </div>
            )}
            {threads.map((thread) => (
              <div key={thread.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', marginBottom: '0.5rem', backgroundColor: selectedThread?.id === thread.id ? '#ff6200' : '#f4f1de', borderRadius: '4px', border: '1px solid #2b2d42', cursor: 'pointer' }} onClick={() => { setSelectedThread(thread); navigate(`/messages/${thread.id}`); }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: selectedThread?.id === thread.id ? '#f4f1de' : '#2b2d42', fontWeight: '600' }}>{thread.role === 'artist' ? 'Artist' : 'Buyer'}: {thread.username || 'Unknown'}</p>
                  <p style={{ fontSize: '0.875rem', color: selectedThread?.id === thread.id ? '#f4f1de' : '#6b7280' }}>{thread.artwork_title ? `About: ${thread.artwork_title}` : 'General chat'}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }} style={{ background: 'transparent', border: 'none', color: '#d00000', cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>

          {/* MESSAGE PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f4f1de', borderRadius: '8px', border: '2px solid #2b2d42', padding: '1rem' }}>
            {selectedThread ? (
              <>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6200', marginBottom: '1rem' }}>
                  Chat with {selectedThread.role === 'artist' ? 'Artist' : 'Buyer'}: {selectedThread.username || 'Unknown'}
                  {selectedThread.artwork_title && ` about ${selectedThread.artwork_title}`}
                </h2>
                <div style={{ flex: 1, maxHeight: '50vh', overflowY: 'auto', marginBottom: '1rem', padding: '1rem' }}>
                  {messages.map((msg, index) => (
                    <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_id === user.keycloak_id ? 'flex-end' : 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ maxWidth: '70%', padding: '0.75rem', backgroundColor: msg.sender_id === user.keycloak_id ? '#ff6200' : '#2b2d42', color: '#f4f1de', borderRadius: '8px' }}>{msg.content}</div>
                      <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: '0.75rem', border: '2px solid #ff6200', borderRadius: '4px', backgroundColor: '#f4f1de' }} />
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ff6200', color: '#f4f1de', fontWeight: '600', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Send</button>
                </form>
              </>
            ) : (
              <p style={{ color: '#2b2d42', textAlign: 'center', marginTop: '2rem' }}>Select a conversation to start chatting 💬</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
