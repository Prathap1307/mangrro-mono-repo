import type { Product } from './products';

export const favouriteItems: Product[] = [
  {
    id: 'artisan-bread',
    name: 'Artisan Sourdough Loaf',
    price: 5.0,
    available: true,
    description: 'Slow-fermented sourdough with a crackly crust and tender crumb, baked this morning.',
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80',
    tag: 'Freshly Baked',
    category: 'Bakery',
  },
  {
    id: 'matcha-croissant',
    name: 'Matcha Pistachio Cruffin',
    price: 6.5,
    available: true,
    description: 'Buttery laminated pastry swirled with ceremonial matcha cream and crushed pistachios.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    tag: 'Trending',
    category: 'Dessert',
  },
];
