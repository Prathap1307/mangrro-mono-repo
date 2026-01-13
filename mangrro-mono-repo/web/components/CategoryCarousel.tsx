'use client';

import { useState } from 'react';

const categories = ['Groceries', 'Alcohol', 'Snacks', 'Beverages', 'Essentials'];

export default function CategoryCarousel() {
  const [selected, setSelected] = useState<string>(categories[0]);

  return (
    <div className="hidden md:flex overflow-x-auto gap-4 py-4 px-6">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            selected === cat ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'
          } shadow-sm hover:bg-purple-500 hover:text-white transition`}
          onClick={() => setSelected(cat)}
          aria-pressed={selected === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
