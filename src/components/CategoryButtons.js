import React from 'react';

function CategoryButtons({ categories, onCategorySelect }) {
  return (
    <div className="category-buttons flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onCategorySelect(null)}
        className="category-button px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className="category-button px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryButtons;