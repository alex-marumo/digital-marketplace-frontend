import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import CategoryButtons from '../components/CategoryButtons';
import { API_BASE_URL } from '../config';
import { useSearchParams } from 'react-router-dom';

function Artworks() {
  const { user, token } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false); // Start false to avoid flash
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOptions, setSortOptions] = useState({ field: 'created_at', order: 'desc' });
  const [searchParams] = useSearchParams();
  const initialArtistId = searchParams.get('artist');

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCategories(res.data))
      .catch(err => {
        console.error('Fetch categories error:', err.message);
        setError('Failed to load categories');
      });
  }, [token]);

  useEffect(() => {
  const hash = window.location.hash;
  if (hash === '#search-section') {
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 100); // slight delay to wait for render
    }
  }
}, []);

  useEffect(() => {
    if (!user || !token) {
      setError('Please log in to view artworks');
      setArtworks([]);
      setLoading(false);
      return;
    }
    const fetchArtworks = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (!user || !user.role) {
        setError('Invalid user role');
        setArtworks([]);
        setLoading(false);
        return; 
      }
     
      if (initialArtistId) {
        params.append('artist', initialArtistId);
      } else if (user.role === 'artist' && user.keycloak_id) {
        params.append('artist', user.keycloak_id);
      }
     
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort_by', sortOptions.field);
      params.append('order', sortOptions.order);

      const url = `${API_BASE_URL}/api/artworks${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching artworks with URL:', url, 'Search Query:', searchQuery);
      try {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched artworks:', res.data);
        setArtworks(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch artworks error:', {
          status: err.response?.status,
          message: err.response?.data?.error,
          details: err.response?.data?.details
        });
        setError(err.response?.data?.details || 'Failed to fetch artworks.');
        setArtworks([]);
        setLoading(false);
      }
    };
    fetchArtworks();
  }, [user, token, selectedCategory, searchQuery, sortOptions]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Clear search when selecting category
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchQuery.trim()); // Trigger useEffect
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update searchQuery on input
  };

  const handleSortFieldChange = (e) => {
    setSortOptions((prev) => ({ ...prev, field: e.target.value }));
  };

  const handleSortOrderChange = (e) => {
    setSortOptions((prev) => ({ ...prev, order: e.target.value }));
  };

  // Define the delete handler for artworks
  const handleDelete = async (artworkId) => {
  console.log('🚀 Deleting artwork:', { artworkId, token: token ? 'present' : 'missing' });
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/artworks/${artworkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Delete success:', response.status, response.data);
    setArtworks(artworks.filter(a => a.artwork_id !== artworkId));
    alert('Artwork deleted! 🎉');
  } catch (err) {
    console.error('❌ Delete error:', {
      status: err.response?.status,
      message: err.response?.data?.error || err.message,
      details: err.response?.data?.details
    });
    alert(`Failed to delete artwork: ${err.response?.data?.error || err.message}`);
  }
};

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-teal-600 mb-6 text-center">
        {user?.role === 'artist' ? 'My Artworks' : 'Browse All Artworks'}
      </h1>

      {/* Unified Search & Sort Section */}
      <div id="search-section" className="search-sort-wrapper mb-6 flex flex-col sm:flex-row justify-center gap-4 items-center"></div>
      <div className="search-sort-wrapper mb-6 flex flex-col sm:flex-row justify-center gap-4 items-center">
        <form onSubmit={handleSearch} className="search-bar flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search artworks..."
            className="search-input border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button type="submit" className="search-button bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
            Search
          </button>
        </form>
        
        <div className="sort-options flex gap-2">
          <select
            value={sortOptions.field}
            onChange={handleSortFieldChange}
            className="sort-select border border-gray-300 rounded px-2 py-1"
          >
            <option value="created_at">Date</option>
            <option value="price">Price</option>
            <option value="category_id">Category</option>
          </select>
          <select
            value={sortOptions.order}
            onChange={handleSortOrderChange}
            className="sort-select border border-gray-300 rounded px-2 py-1"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      <div className="sticky top-0 bg-white z-10 py-4">
        <CategoryButtons
          categories={categories.map(cat => ({ id: cat.category_id, name: cat.name }))}
          onCategorySelect={handleCategorySelect}
        />
      </div>

      {loading && <p className="text-center text-gray-500">Loading artworks...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      <div className="artwork-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.length > 0 ? (
          artworks.map((artwork) => (
            artwork.artwork_id ? (

              <ArtworkCard 
                key={artwork.artwork_id} 
                artwork={artwork} 
                userRole={user?.role}
                onDelete={user?.role === 'artist' ? handleDelete : undefined} // Pass onDelete only for artists
              />
            ) : (
              console.warn('Skipping artwork with missing ID:', artwork)
            )
          ))
        ) : (
          !loading && (
            <p className="text-center text-gray-500 col-span-full">
              {searchQuery ? `No artworks found for "${searchQuery}"` : 'No artworks found.'}
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default Artworks;