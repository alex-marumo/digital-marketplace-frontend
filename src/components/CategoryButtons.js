import React from 'react';

function CategoryButtons({ categories, onCategorySelect }) {
  return (
    <div className="category-buttons">
      {categories.map((category) => (
        <button
          key={category}
          className="category-button"
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryButtons;