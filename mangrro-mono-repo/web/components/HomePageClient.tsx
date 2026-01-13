'use client';

import { useEffect, useMemo, useState } from 'react';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import QuickViewModal from '@/components/QuickViewModal';
import BookDeliveryModal from '@/components/BookDeliveryModal';
import { products, type Product } from '@/data/products';
import { favouriteItems } from '@/data/favourites';
import { useCart } from '@/components/context/CartContext';
import Link from 'next/link';
import { FiMapPin, FiNavigation } from 'react-icons/fi';

type Category = {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  parentCategoryId?: string;
  subcategoryName?: string;
};

type CategoryRaw = {
  id?: string;
  categoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string;
  parentCategoryId?: string;
  subcategoryName?: string;
};

const parsePosition = (value?: number | string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const normalizeCategory = (raw: CategoryRaw): Category | null => {
  const id = raw.id ?? raw.categoryId;
  if (!id || !raw.name) return null;
  const highlight = raw.highlightText?.trim();
  const parentCategoryId = raw.parentCategoryId?.trim();
  const subcategoryName = raw.subcategoryName?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: Boolean(raw.active ?? true),
    position: parsePosition(raw.position),
    highlightText: highlight || undefined,
    parentCategoryId: parentCategoryId || undefined,
    subcategoryName: subcategoryName || undefined,
  };
};

const buildFallbackCategories = (): Category[] => {
  const unique = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  ) as string[];

  const fallbackRoot: Category = {
    id: 'fallback-root',
    name: 'Categories',
    active: true,
    position: 0,
  };

  const fallbackChildren = unique.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    active: true,
    position: index + 1,
    parentCategoryId: fallbackRoot.id,
  }));

  return [fallbackRoot, ...fallbackChildren];
};

function InStorePickupBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white shadow-2xl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-10 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
            <FiMapPin /> In-Store Pickup ready
          </p>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">We deliver and also support In-Store Pickup.</h2>
            <p className="text-base text-purple-50">
              Upload screenshot OR type pickup location + drop location. Pay delivery fee and tap ‘Book In-Store Pickup’.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-700 shadow-lg transition hover:-translate-y-0.5"
            >
              <FiNavigation /> Book Delivery For In-Store Pickup
            </Link>
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white/90">
              Lightning-fast rider dispatch
            </span>
          </div>
        </div>
        <div className="relative w-full max-w-xs self-end md:self-center">
          <div className="absolute inset-0 -translate-y-4 translate-x-4 rounded-3xl bg-white/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl bg-white/10 p-4 shadow-xl backdrop-blur">
            <div className="space-y-3 rounded-2xl bg-white/10 p-4 text-sm text-purple-50 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Pickup</span>
                <span className="text-white/80">Market Street</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Dropoff</span>
                <span className="text-white/80">Sunset District</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">ETA</span>
                <span className="text-white/80">35 mins</span>
              </div>
              <p className="text-xs text-purple-100/90">Fully touch-friendly. Works on every phone.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePageClient() {
  const { addItem } = useCart();
  const [favourites, setFavourites] = useState<Product[]>(favouriteItems);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [usingFallbackCategories, setUsingFallbackCategories] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : [])
          .map(normalizeCategory)
          .filter(Boolean) as Category[];
        if (!cancelled) {
          if (normalized.length) {
            setCategories(normalized);
            setUsingFallbackCategories(false);
          } else {
            setCategories(buildFallbackCategories());
            setUsingFallbackCategories(true);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCategories(buildFallbackCategories());
          setUsingFallbackCategories(true);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((category) => category.active)
      .sort((a, b) => a.position - b.position);
  }, [categories]);

  const mainCategories = useMemo(
    () => sortedCategories.filter((category) => !category.parentCategoryId),
    [sortedCategories]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    sortedCategories
      .filter((category) => category.parentCategoryId)
      .forEach((category) => {
        const parentId = category.parentCategoryId as string;
        const current = map.get(parentId) ?? [];
        current.push(category);
        map.set(parentId, current);
      });
    map.forEach((items) => items.sort((a, b) => a.position - b.position));
    return map;
  }, [sortedCategories]);

  const handleFavouriteToggle = (product: Product) => {
    setFavourites((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  };

  return (
    <div className="space-y-10 pb-6">
      <InStorePickupBanner />
      <Hero setBookOpen={setBookOpen} />
      <BookDeliveryModal open={bookOpen} onClose={() => setBookOpen(false)} />

      <section className="space-y-6">
        <SectionTitle eyebrow="Browse" title="Shop by category" />
        {usingFallbackCategories && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Category data is unavailable right now. Showing sample categories from the static product list.
          </p>
        )}
        {categoriesLoading ? (
          <p className="text-sm text-gray-500">Loading categories…</p>
        ) : mainCategories.length ? (
          <div className="space-y-8">
            {mainCategories.map((mainCategory) => {
              const childCategories = childrenByParent.get(mainCategory.id) ?? [];
              return (
                <div key={mainCategory.id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{mainCategory.name}</h3>
                      {mainCategory.highlightText && (
                        <p className="text-sm text-gray-500">{mainCategory.highlightText}</p>
                      )}
                    </div>
                    <Link
                      href={`/categories/${mainCategory.id}`}
                      className="text-sm font-semibold text-purple-600 transition hover:text-purple-700"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {childCategories.length ? (
                      childCategories.map((category) => {
                        const subcategories = childrenByParent.get(category.id) ?? [];
                        const categoryName = category.subcategoryName ?? category.name;
                        return (
                          <div
                            key={category.id}
                            className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/categories/${category.id}`}
                                className="text-base font-semibold text-gray-900 transition hover:text-purple-600"
                              >
                                {categoryName}
                                ll
                              </Link>
                              <Link
                                href={`/categories/${category.id}`}
                                className="text-xs font-semibold text-purple-500 hover:text-purple-600"
                              >
                                Explore
                              </Link>
                            </div>
                            {category.highlightText && (
                              <p className="mt-2 text-xs text-gray-500">{category.highlightText}</p>
                            )}
                            {subcategories.length ? (
                              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                                {subcategories.map((subcategory) => {
                                  const subcategoryName =
                                    subcategory.subcategoryName ?? subcategory.name;
                                  return (
                                    <li key={subcategory.id}>
                                      <Link
                                        href={`/categories/${subcategory.id}`}
                                        className="transition hover:text-purple-600"
                                      >
                                        {subcategoryName}
                                        ,lll
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="mt-3 text-xs text-gray-400">No subcategories available.</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">No categories available right now.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No categories available right now.</p>
        )}
      </section>

      <section className="space-y-6">
        <SectionTitle eyebrow="Tonight's picks" title="Discover the new essentials" />
        <p className="text-sm text-gray-500">
          Products are currently loaded from static sample data while the live catalog feed is being connected.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addItem}
              onQuickView={() => handleQuickView(product)}
              onToggleFavourite={handleFavouriteToggle}
              isFavourite={favourites.some((fav) => fav.id === product.id)}
            />
          ))}
        </div>
      </section>

      <QuickViewModal
        open={quickViewOpen}
        product={selectedProduct}
        onClose={() => setQuickViewOpen(false)}
        onAddToCart={(product: Product) => {
          addItem(product);
          setQuickViewOpen(false);
        }}
        onFavourite={(product: Product) => handleFavouriteToggle(product)}
      />
    </div>
  );
}
