export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isAlcohol: boolean;
  stock: number; // add stock
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Beer',
    category: 'Alcohol',
    price: 3.5,
    imageUrl: 'https://via.placeholder.com/200x200.png?text=Beer',
    isAlcohol: true,
    stock: 50,
  },
  {
    id: '2',
    name: 'Milk',
    category: 'Groceries',
    price: 1.2,
    imageUrl: 'https://via.placeholder.com/200x200.png?text=Milk',
    isAlcohol: false,
    stock: 100,
  },
  {
    id: '3',
    name: 'Chips',
    category: 'Snacks',
    price: 1.0,
    imageUrl: 'https://via.placeholder.com/200x200.png?text=Chips',
    isAlcohol: false,
    stock: 80,
  },
  {
    id: '4',
    name: 'Wine',
    category: 'Alcohol',
    price: 7.5,
    imageUrl: 'https://via.placeholder.com/200x200.png?text=Wine',
    isAlcohol: true,
    stock: 30,
  },
  {
    id: '5',
    name: 'Bread',
    category: 'Groceries',
    price: 1.5,
    imageUrl: 'https://via.placeholder.com/200x200.png?text=Bread',
    isAlcohol: false,
    stock: 60,
  },
];
