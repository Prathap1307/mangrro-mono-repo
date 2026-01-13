
'use client'

import Image from 'next/image';
import { useCart } from '@/components/context/CartContext';

export default function ProductCard({ product }) { // Removed ": Props" here
  // Use the global context
  const { getItemQuantity, increaseCartQuantity, decreaseCartQuantity } = useCart();
  
  // Check how many of THIS product are in the cart
  const quantity = getItemQuantity(product.id);

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col hover:scale-105 transition-transform bg-white">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={400}
        height={200}
        className="h-48 w-full object-cover"
        priority
      />
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
        <p className="text-gray-500 text-sm">{product.category}</p>
        
        {product.isAlcohol && (
          <p className="text-red-600 text-xs mt-1 font-semibold">18+ ID Required</p>
        )}
        
        <p className="mt-auto font-bold text-xl text-gray-900">£{product.price}</p>

        {/* LOGIC: Toggle between Add Button and Counter */}
        <div className="mt-3">
          {quantity === 0 ? (
            <button
              onClick={() => increaseCartQuantity(product)}
              className="w-full bg-purple-600 text-white py-2 rounded-full font-semibold hover:bg-purple-700 transition"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center justify-between bg-purple-100 rounded-full overflow-hidden">
              <button 
                onClick={() => decreaseCartQuantity(product.id)}
                className="bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 font-bold"
              >
                -
              </button>
              <span className="font-bold text-purple-900 text-lg">{quantity}</span>
              <button 
                onClick={() => increaseCartQuantity(product)}
                className="bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}