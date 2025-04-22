import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import CategoryButtons from '../components/CategoryButtons';

function Artworks() {
  const { user, token } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [categories] = useState(['Painting', 'Sculpture', 'Photography', 'Ceramics', 'Textile Art', 'Jewelry Design', 'Graphic Art', 'Fashion Design']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOptions, setSortOptions] = useState({ field: 'created_at', order: 'desc' });

  useEffect(() => {
    setLoading(true);
    let url;
    if (user.role === 'artist') {
      url = `/api/artworks?artist=${user.keycloak_id}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      url += `&sort_by=${sortOptions.field}&order=${sortOptions.order}`;
    } else {
      if (searchQuery) {
        url = `/api/search?query=${searchQuery}`;
      } else {
        url = '/api/artworks';
        if (selectedCategory) url += `?category=${selectedCategory}`;
      }
    }
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setArtworks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch artworks. Try again later.');
        setLoading(false);
      });
  }, [user, token, selectedCategory, searchQuery, sortOptions]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when selecting category
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSelectedCategory(null); // Clear category when searching
  };

  const handleSortFieldChange = (e) => {
    setSortOptions((prev) => ({ ...prev, field: e.target.value }));
  };

  const handleSortOrderChange = (e) => {
    setSortOptions((prev) => ({ ...prev, order: e.target.value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-teal-600 mb-6 text-center">
        {user.role === 'artist' ? 'My Artworks' : 'Browse All Artworks'}
      </h1>
      {user.role === 'buyer' && (
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks..."
            className="w-full max-w-md p-2 border border-teal-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 transition-colors"
          >
            Search
          </button>
        </div>
      )}
      <div className="sticky top-0 bg-white z-10 py-4">
        <CategoryButtons categories={categories} onCategorySelect={handleCategorySelect} />
        {user.role === 'artist' && (
          <div className="mt-4 flex gap-2">
            <select value={sortOptions.field} onChange={handleSortFieldChange} className="border rounded px-3 py-2">
              <option value="created_at">Date</option>
              <option value="price">Price</option>
              <option value="category">Category</option>
            </select>
            <select value={sortOptions.order} onChange={handleSortOrderChange} className="border rounded px-3 py-2">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        )}
      </div>
      {loading && <p className="text-center text-gray-500">Loading artworks...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      <div className="artwork-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.length > 0 ? (
          artworks.map((artwork) => (
            <ArtworkCard key={artwork.artwork_id} artwork={artwork} />
          ))
        ) : (
          !loading && <p className="text-center text-gray-500 col-span-full">No artworks found.</p>
        )}
      </div>
    </div>
  );
}

export default Artworks;