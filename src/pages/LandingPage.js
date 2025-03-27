// src/pages/LandingPage.js
import React from 'react';
import ArtworkCard from '../components/ArtworkCard';
import { Link } from 'react-router-dom';
import '../styles.css';

function LandingPage() {
  // Hardcoded dummy images using your local images
  const featuredArtworks = [
    {
      artwork_id: '1',
      image_url: '/assets/14832017_dsc-0170-2.jpg', // Path to your first image
      title: 'The Elephant',
      artist: 'Jane Doe',
    },
    {
      artwork_id: '2',
      image_url: '/assets/a70abe41b4a2173e60000c9463ac000a.jpg', // Path to your second image
      title: 'Vase',
      artist: 'John Smith',
    },
    {
      artwork_id: '3',
      image_url: '/assets/images (1).jpeg', // Path to your second image
      title: 'Abstract Weave',
      artist: 'John Smith',
    },
    {
      artwork_id: '4',
      image_url: '/assets/painting-savuti-in-botswana-dry-season-wildlife-n-n-akkash.jpg', // Path to your second image
      title: 'Savuti in Botswana',
      artist: 'John Smith',
    },
  ];

  // Categories for the "Explore by Category" section
  const categories = [
    'Paintings',
    'Ceramics',
    'Sculptures',
    'Textile Art',
    'Photography',
    'Jewelry Design',
    'Graphic Art',
    'Fashion Design',
  ];

  return (
    <div className="container">
      {/* Discover Section */}
      <div className="text-center m-bottom">
        <h1>Discover Local Artists</h1>
        <p>Explore Unique Artworks From Your Community</p>
        <Link to="/artworks" className="button">Browse Artworks</Link>
      </div>

      {/* Featured Artworks Section */}
      <h2>Featured Artworks</h2>
      <div className="artwork-list">
        {featuredArtworks.map(artwork => (
          <ArtworkCard key={artwork.artwork_id} artwork={artwork} />
        ))}
      </div>

      {/* Explore by Category Section */}
      <h2>Explore by Category</h2>
      <div className="category-buttons">
        {categories.map(category => (
          <Link
            key={category}
            to={`/artworks?category=${category.toLowerCase()}`}
            className="category-button"
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;