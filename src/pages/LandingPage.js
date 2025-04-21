// src/pages/LandingPage.js
import React from 'react';
import ArtworkCard from '../components/ArtworkCard';
import { Link } from 'react-router-dom';
import { Paintbrush, Box, Scissors, Camera, Star, Target, PenTool, Shirt } from 'lucide-react';
import '../styles/styles.css';

function LandingPage() {
  // Hardcoded dummy images using your local images
  const featuredArtworks = [
    {
      artwork_id: '1',
      image_url: '/assets/artwork1.jpg',
      title: 'The Elephant',
    },
    {
      artwork_id: '2',
      image_url: '/assets/artwork2.jpg',
      title: 'Vase',
    },
    {
      artwork_id: '3',
      image_url: '/assets/artwork3.jpeg',
      title: 'Abstract Weave',
    },
    {
      artwork_id: '4',
      image_url: '/assets/artwork4.jpg',
      title: 'Savuti in Botswana',
    },
  ];

  // Categories for the "Explore by Category" section with their respective Lucide icons
  const categories = [
    { name: 'Paintings', icon: <Paintbrush /> },
    { name: 'Ceramics', icon: <Box /> },  // Changed Cube to Box for ceramics
    { name: 'Sculptures', icon: <Scissors /> },
    { name: 'Textile Art', icon: <Target /> },
    { name: 'Photography', icon: <Camera /> },
    { name: 'Jewelry Design', icon: <Star /> },
    { name: 'Graphic Art', icon: <PenTool /> },
    { name: 'Fashion Design', icon: <Shirt /> },
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
          <ArtworkCard key={artwork.artwork_id} artwork={artwork} showDetails={false} />
        ))}
      </div>

      {/* Explore by Category Section */}
      <h2>Explore by Category</h2>
      <div className="category-buttons">
        {categories.map(category => (
          <Link
            key={category.name}
            to={`/artworks?category=${category.name.toLowerCase()}`}
            className="category-button"
          >
            {category.icon}
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;