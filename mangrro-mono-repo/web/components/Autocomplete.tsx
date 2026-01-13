'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/data/products';

interface Props {
  query: string;
  products: Product[];
  onSelect: (value: string) => void;
}

export default function Autocomplete({ query, products, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const q = query.toLowerCase();

    const matches = products.filter(p =>
      [
        p.name,
        p.description ?? '',
        p.category ?? '',
        ...(p.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );

    setSuggestions(matches.slice(0, 7)); // limit suggestions
  }, [query, products]);

  if (!query.trim()) return null;

  return (
    <div className="mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-auto z-30">
      {suggestions.length === 0 && (
        <div className="p-4 text-gray-500 text-sm">No results found…</div>
      )}

      {suggestions.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.name)}
          className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
        >
          <span className="font-semibold text-gray-900">{p.name}</span>
          <div className="text-xs text-gray-500">{p.category}</div>
        </button>
      ))}
    </div>
  );
}
