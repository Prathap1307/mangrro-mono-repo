import type { CartItem } from '@/components/context/CartContext';

export const cartItems: CartItem[] = [
  {
    id: 'midnight-ramen',
    name: 'Midnight Black Garlic Ramen',
    price: 18,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'truffle-fries',
    name: 'Black Truffle Shoestring Fries',
    price: 9,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
  },
];
