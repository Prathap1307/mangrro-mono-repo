// Updated versions with Navbar added and improved PC layout without changing UI

// app/favourites/page.tsx
'use client';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/components/context/CartContext';
import { useFavourites } from '@/components/context/FavouritesContext';
import Navbar from '@/components/Navbar';

export default function FavouritesPage() {
  const { addItem } = useCart();
  const { favourites, toggleFavourite, isFavourite, isFavouriteAvailable } =
    useFavourites();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl p-6 lg:p-12 space-y-8">
        <SectionTitle eyebrow="Saved" title="Favourites" />

        {favourites.length === 0 ? (
          <EmptyState
            title="No favourites yet"
            description="Tap the heart on any product to save it for later and build your personal list."
            ctaLabel="Explore products"
            ctaHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  available: isFavouriteAvailable(product.id),
                }}
                onAddToCart={addItem}
                onQuickView={() => {}}
                onToggleFavourite={toggleFavourite}
                isFavourite={isFavourite(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
