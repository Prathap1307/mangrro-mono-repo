export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  img?: string;
  tag?: string;
  category?: string;
  ageRestricted?: boolean;
  keywords?: string[];
  available: boolean;
  closingSoon?: boolean;
  closingMinutes?: number;
}

export const products: Product[] = [
  {
    id: 'espresso-tonic',
    name: 'Iced Espresso Tonic',
    price: 7.5,
    available: true,
    description: 'Single-origin espresso poured over artisan tonic with citrus zest and crushed ice.',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80',
    tag: 'Signature',
    category: 'Drinks',
  },
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
    id: 'midnight-ramen',
    name: 'Midnight Black Garlic Ramen',
    price: 18.0,
    available: true,
    description: 'Charred corn, soy-glazed shiitake, and molten soy egg in a rich black garlic tonkotsu.',
    image: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=80',
    tag: 'Chef Special',
    category: 'Meals',
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
  {
    id: 'citrus-burst',
    name: 'Citrus Burst Cold Press',
    price: 8.0,
    available: true,
    description: 'Grapefruit, yuzu, pineapple, and mint pressed to a vibrant, vitamin-rich juice.',
    image: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80',
    tag: 'Wellness',
    category: 'Drinks',
  },
  {
    id: 'truffle-fries',
    name: 'Black Truffle Shoestring Fries',
    price: 9.0,
    available: true,
    description: 'Crispy shoestring potatoes tossed in white truffle oil, parmesan snow, and sea salt.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    tag: 'Bestseller',
    category: 'Snacks',
  },
];
