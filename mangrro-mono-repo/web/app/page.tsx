  // app/page.tsx
  "use client";

  import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import CategoryIconTile from "@/components/CategoryIconTile";

import { useDelivery } from "@/components/context/DeliveryContext";

import type { Product } from "@/data/products";
import type { Item } from "@/types";
import { FiMapPin, FiTarget } from "react-icons/fi";
import BookDeliveryModal from "@/components/BookDeliveryModal";
import type {
  CategorySchedule,
  DayName,
  ItemSchedule,
  MainCategorySchedule,
  SubcategorySchedule,
} from "@/lib/visibility/items";
import {
  isCategoryOpen,
  isEntityActive,
  isItemListVisible,
  isScheduleOpen,
  isSubcategoryVisible,
} from "@/lib/visibility/items";

  /* --------------------------------------------------------
    Types
  -------------------------------------------------------- */

interface MainCategoryRaw {
  id?: string;
  mainCategoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  reactivateOn?: string | null;
}

interface CategoryRaw {
  id?: string;
  categoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  subcategoryName?: string | null;
  parentCategoryId?: string | null;
  mainCategoryId?: string | null;
  reactivateOn?: string | null;
}

interface MainCategory {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  reactivateOn?: string;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  imageUrl?: string;
  imageKey?: string;
  subcategoryName?: string;
  mainCategoryId?: string;
  reactivateOn?: string;
}

interface SubcategoryRaw {
  id?: string;
  subcategoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  categoryId?: string | null;
  parentCategoryId?: string | null;
  reactivateOn?: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  imageUrl?: string;
  imageKey?: string;
  categoryId?: string;
  reactivateOn?: string;
}

  interface SchedulerSelection {
    ids: string[];
  }

  interface ItemMeta extends Omit<Item, "categoryId"> {
    id?: string;
    category?: string;
    categoryId?: string;
    imageKey?: string;
    description?: string;
    keywords?: string[];
    subcategoryId?: string;
    subcategoryName?: string;
  }

  /* --------------------------------------------------------
    Time helpers
  -------------------------------------------------------- */
  function getTodayInfo(): { dayName: DayName; minutes: number } {
    const now = new Date();
    const dayName = now
      .toLocaleDateString("en-GB", { weekday: "long" })
      .toString() as DayName;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return { dayName, minutes };
  }

  /* --------------------------------------------------------
    Normalisers
  -------------------------------------------------------- */

  const parsePosition = (value?: number | string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  };

  const normalizeActive = (value: unknown, fallback = true): boolean => {
    if (typeof value === "boolean") return value;
    if (value && typeof value === "object" && "BOOL" in value) {
      return Boolean((value as { BOOL?: boolean }).BOOL);
    }
    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      if (lowered === "true") return true;
      if (lowered === "false") return false;
    }
    return fallback;
  };

  const normalizeMainCategory = (raw: MainCategoryRaw): MainCategory | null => {
    const id = raw.id ?? raw.mainCategoryId;
    if (!id || !raw.name) return null;
    const highlight = raw.highlightText?.trim();
    return {
      id: String(id),
      name: String(raw.name),
      active: normalizeActive(raw.active, true),
      position: parsePosition(raw.position),
      highlightText: highlight || undefined,
      reactivateOn: raw.reactivateOn?.trim() || undefined,
    };
  };

  const normalizeCategory = (raw: CategoryRaw): Category | null => {
    const id = raw.id ?? raw.categoryId;
    if (!id || !raw.name) return null;
    const highlight = raw.highlightText?.trim();
    const subcategoryName = raw.subcategoryName?.trim();
    const mainCategoryId = raw.mainCategoryId?.trim() ?? raw.parentCategoryId?.trim();
    return {
      id: String(id),
      name: String(raw.name),
      active: normalizeActive(raw.active, true),
      position: parsePosition(raw.position),
      highlightText: highlight || undefined,
      imageUrl: raw.imageUrl ?? undefined,
      imageKey: raw.imageKey ?? undefined,
      subcategoryName: subcategoryName || undefined,
      mainCategoryId: mainCategoryId || undefined,
      reactivateOn: raw.reactivateOn?.trim() || undefined,
    };
  };

  const normalizeSubcategory = (raw: SubcategoryRaw): Subcategory | null => {
    const id = raw.id ?? raw.subcategoryId;
    if (!id || !raw.name) return null;
    const highlight = raw.highlightText?.trim();
    const categoryId = raw.categoryId?.trim() ?? raw.parentCategoryId?.trim();
    return {
      id: String(id),
      name: String(raw.name),
      active: normalizeActive(raw.active, true),
      position: parsePosition(raw.position),
      highlightText: highlight || undefined,
      imageUrl: raw.imageUrl ?? undefined,
      imageKey: raw.imageKey ?? undefined,
      categoryId: categoryId || undefined,
      reactivateOn: raw.reactivateOn?.trim() || undefined,
    };
  };

  const normalizeItem = (raw: any): ItemMeta => ({
    id: raw.id ?? raw.itemId ?? undefined,
    itemId: raw.itemId ?? raw.id ?? "",
    name: raw.name ?? "",
    price: Number(raw.price ?? 0),
    active: normalizeActive(raw.active, true),
    ageRestricted: Boolean(raw.ageRestricted),
    vegType: raw.vegType ?? "veg",
    description: raw.description ?? "",
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    imageUrl: raw.imageUrl,
    imageKey: raw.imageKey,
    categoryId: raw.categoryId?.trim?.() ?? raw.categoryId,
    category: raw.category,
    subcategoryId: raw.subcategoryId?.trim?.() ?? raw.subcategoryId,
    subcategoryName: raw.subcategoryName?.trim?.() ?? raw.subcategoryName,
    schedule: raw.schedule,
  });

  function resolveCategory(item: ItemMeta, cats: Category[]): string | undefined {
    if (item.categoryId) return item.categoryId;
    if (item.category) {
      const matchById = cats.find((x) => x.id === item.category);
      if (matchById) return matchById.id;
      const matchByName = cats.find((x) => x.name === item.category);
      if (matchByName) return matchByName.id;
    }
    return undefined;
  }

  function resolveSubcategory(
    item: ItemMeta,
    subsById: Map<string, Subcategory>,
    subsByName: Map<string, Subcategory>
  ): Subcategory | undefined {
    if (item.subcategoryId) return subsById.get(item.subcategoryId);
    if (item.subcategoryName) return subsByName.get(item.subcategoryName.toLowerCase());
    return undefined;
  }

  const resolveSubcategorySchedule = (
    subcategory: Subcategory | undefined,
    item: ItemMeta,
    scheduleById: Map<string, SubcategorySchedule>,
    scheduleByName: Map<string, SubcategorySchedule>
  ): SubcategorySchedule | undefined => {
    const id = subcategory?.id ?? item.subcategoryId;
    if (id) return scheduleById.get(id);
    const name = subcategory?.name ?? item.subcategoryName;
    return name ? scheduleByName.get(name.toLowerCase()) : undefined;
  };

  /* --------------------------------------------------------
    Product mapping
  -------------------------------------------------------- */
  const mapToProduct = (item: ItemMeta, cat?: Category): Product => {
    const image = item.imageKey
      ? `/api/image-proxy?key=${encodeURIComponent(item.imageKey)}`
      : item.imageUrl || "/placeholder.webp";

    return {
      id: item.itemId,
      name: item.name,
      price: item.price,
      image,
      category: cat?.name ?? item.category ?? "",
      description: item.description ?? "",
      ageRestricted: item.ageRestricted ?? false,
      keywords: item.keywords ?? [],
    };
  };

  /* --------------------------------------------------------
    TEXT Search Helper
  -------------------------------------------------------- */
  function filterProductAutocomplete(products: Product[], q: string) {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    return products
      .filter((p) =>
        [
          p.name,
          p.description ?? "",
          p.category ?? "",
          ...(p.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }

  function filterProductsByQuery(products: Product[], q: string) {
    const query = q.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.description ?? "", ...(product.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  /* --------------------------------------------------------
    MAIN PAGE
  -------------------------------------------------------- */
  export default function HomePage() {
    const { address, setAddress } = useDelivery();
    const { isSignedIn } = useAuth();

    const [loading, setLoading] = useState(true);

    const [items, setItems] = useState<ItemMeta[]>([]);
    const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [mainCatSched, setMainCatSched] = useState<MainCategorySchedule[]>([]);
    const [catSched, setCatSched] = useState<CategorySchedule[]>([]);
    const [subcatSched, setSubcatSched] = useState<SubcategorySchedule[]>([]);
    const [itemSched, setItemSched] = useState<ItemSchedule[]>([]);

    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);


    /* --- LOCATION SHEET STATE --- */
    const [addrInput, setAddrInput] = useState("");
    const [addrSuggestions, setAddrSuggestions] = useState<any[]>([]);
    const [addrLoading, setAddrLoading] = useState(false);
    const [addrError, setAddrError] = useState("");
    const [locationSheetOpen, setLocationSheetOpen] = useState(false);

    /* --------------------------------------------------------
      Fetch all backend data
    -------------------------------------------------------- */
    useEffect(() => {
      (async () => {
        setLoading(true);

        const [
          iR,
          mcR,
          cR,
          scR,
          mcsR,
          scsR,
          csR,
          isR,
          catSelR,
          itemSelR,
          mainCatSelR,
          subcatSelR,
        ] = await Promise.all([
          fetch("/api/items"),
          fetch("/api/main-categories"),
          fetch("/api/categories"),
          fetch("/api/subcategories"),
          fetch("/api/schedule/main-category"),
          fetch("/api/schedule/subcategory"),
          fetch("/api/schedule/category"),
          fetch("/api/schedule/item"),
          fetch("/api/admin/settings/category-schedule"),
          fetch("/api/admin/settings/item-schedule"),
          fetch("/api/admin/settings/main-category-schedule"),
          fetch("/api/admin/settings/subcategory-schedule"),
        ]);

        const [
          iJ,
          mcJ,
          cJ,
          scJ,
          mcsJ,
          scsJ,
          csJ,
          isJ,
          catSelJ,
          itemSelJ,
          mainCatSelJ,
          subcatSelJ,
        ] = await Promise.all([
          iR.json(),
          mcR.json(),
          cR.json(),
          scR.json(),
          mcsR.ok ? mcsR.json() : [],
          scsR.ok ? scsR.json() : [],
          csR.ok ? csR.json() : [],
          isR.ok ? isR.json() : [],
          catSelR.ok ? catSelR.json() : { ids: [] },
          itemSelR.ok ? itemSelR.json() : { ids: [] },
          mainCatSelR.ok ? mainCatSelR.json() : { ids: [] },
          subcatSelR.ok ? subcatSelR.json() : { ids: [] },
        ]);

        const mainCats = (Array.isArray(mcJ) ? mcJ : [])
          .map(normalizeMainCategory)
          .filter(Boolean) as MainCategory[];
        const cats = (Array.isArray(cJ) ? cJ : [])
          .map(normalizeCategory)
          .filter(Boolean) as Category[];
        const subs = (Array.isArray(scJ) ? scJ : [])
          .map(normalizeSubcategory)
          .filter(Boolean) as Subcategory[];

        const categorySelectionIds = Array.isArray(
          (catSelJ as SchedulerSelection)?.ids
        )
          ? (catSelJ as SchedulerSelection).ids
          : [];
        const itemSelectionIds = Array.isArray(
          (itemSelJ as SchedulerSelection)?.ids
        )
          ? (itemSelJ as SchedulerSelection).ids
          : [];
        const mainCategorySelectionIds = Array.isArray(
          (mainCatSelJ as SchedulerSelection)?.ids
        )
          ? (mainCatSelJ as SchedulerSelection).ids
          : [];
        const subcategorySelectionIds = Array.isArray(
          (subcatSelJ as SchedulerSelection)?.ids
        )
          ? (subcatSelJ as SchedulerSelection).ids
          : [];

        const filteredMainCategorySchedules = Array.isArray(mcsJ)
          ? mainCategorySelectionIds.length
            ? mcsJ.filter((schedule) =>
                mainCategorySelectionIds.includes(schedule.mainCategoryId)
              )
            : mcsJ
          : [];
        const filteredSubcategorySchedules = Array.isArray(scsJ)
          ? subcategorySelectionIds.length
            ? scsJ.filter((schedule) =>
                subcategorySelectionIds.includes(schedule.subcategoryId)
              )
            : scsJ
          : [];
        const filteredCategorySchedules = Array.isArray(csJ)
          ? categorySelectionIds.length
            ? csJ.filter((schedule) => categorySelectionIds.includes(schedule.categoryId))
            : csJ
          : [];
        const filteredItemSchedules = Array.isArray(isJ)
          ? itemSelectionIds.length
            ? isJ.filter((schedule) => itemSelectionIds.includes(schedule.itemId))
            : isJ
          : [];

        setMainCategories(mainCats);
        setCategories(cats);
        setSubcategories(subs);
        setItems((Array.isArray(iJ) ? iJ : []).map(normalizeItem));
        setMainCatSched(filteredMainCategorySchedules);
        setCatSched(filteredCategorySchedules);
        setSubcatSched(filteredSubcategorySchedules);
        setItemSched(filteredItemSchedules);

        setLoading(false);
      })();
    }, []);

    /* --------------------------------------------------------
      Build visible product list
    -------------------------------------------------------- */
    const { dayName, minutes } = getTodayInfo();
    const nowDate = useMemo(() => new Date(), [dayName, minutes]);

    const allProducts = useMemo(() => {
      if (loading) return [];

      const catMap = new Map(categories.map((c) => [c.id, c]));
      const mainCatMap = new Map(mainCategories.map((c) => [c.id, c]));
      const subcatMap = new Map(subcategories.map((s) => [s.id, s]));
      const subcatNameMap = new Map(
        subcategories.map((s) => [s.name.toLowerCase(), s])
      );
      const mainCatSchedMap = new Map(
        mainCatSched.map((c) => [c.mainCategoryId, c])
      );
      const catSchedMap = new Map(catSched.map((c) => [c.categoryId, c]));
      const subcatSchedById = new Map(
        subcatSched.map((schedule) => [schedule.subcategoryId, schedule])
      );
      const subcatSchedByName = new Map<string, SubcategorySchedule>();
      subcatSched.forEach((schedule) => {
        const subcategory = subcatMap.get(schedule.subcategoryId);
        if (subcategory?.name) {
          subcatSchedByName.set(subcategory.name.toLowerCase(), schedule);
        }
      });
      const itemSchedMap = new Map(itemSched.map((s) => [s.itemId, s]));

      return items
        .filter((it) => {
          const catId = resolveCategory(it, categories);
          const cat = catId ? catMap.get(catId) : undefined;
          const cs = catId ? catSchedMap.get(catId) : undefined;
          const mainCat = cat?.mainCategoryId
            ? mainCatMap.get(cat.mainCategoryId)
            : undefined;
          const mainCatSchedule = mainCat
            ? mainCatSchedMap.get(mainCat.id)
            : undefined;
          const subcategory = resolveSubcategory(it, subcatMap, subcatNameMap);
          const subcategorySchedule = resolveSubcategorySchedule(
            subcategory,
            it,
            subcatSchedById,
            subcatSchedByName
          );

          const itemSchedule =
            itemSchedMap.get(it.itemId) ?? (it.id ? itemSchedMap.get(it.id) : undefined);
          // List visibility uses schedule windows; direct access checks happen elsewhere.
          return isItemListVisible({
            item: it,
            category: cat,
            subcategory,
            mainCategory: mainCat,
            schedules: {
              category: cs,
              subcategory: subcategorySchedule,
              mainCategory: mainCatSchedule,
              item: itemSchedule,
            },
            dayName,
            minutes,
            now: nowDate,
          });
        })
        .map((it) => {
          const catId = resolveCategory(it, categories);
          return mapToProduct(it, catId ? catMap.get(catId) : undefined);
        });
    }, [
      items,
      categories,
      catSched,
      itemSched,
      loading,
      dayName,
      minutes,
      mainCategories,
      mainCatSched,
      subcategories,
      subcatSched,
      nowDate,
    ]);

    /* --------------------------------------------------------
      SEARCH IN PRODUCTS
    -------------------------------------------------------- */
    const productSuggestions = useMemo(
      () => filterProductAutocomplete(allProducts, search),
      [allProducts, search]
    );

    const filteredProducts = useMemo(
      () => filterProductsByQuery(allProducts, search),
      [allProducts, search]
    );

    const filteredCategoryNames = useMemo(() => {
      if (!search.trim()) return null;
      return new Set(
        filteredProducts
          .map((product) => product.category)
          .filter((category): category is string => Boolean(category))
      );
    }, [filteredProducts, search]);

    const sortedMainCategories = useMemo(() => {
      return [...mainCategories]
        .filter((category) => {
          if (!isEntityActive(category.active, category.reactivateOn, nowDate)) {
            return false;
          }
          return isScheduleOpen(
            mainCatSched.find((sched) => sched.mainCategoryId === category.id),
            dayName,
            minutes
          );
        })
        .map((cat) => ({
          ...cat,
          position: Number.isFinite(cat.position)
            ? cat.position
            : Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => a.position - b.position);
    }, [dayName, mainCategories, mainCatSched, minutes, nowDate]);

    const sortedCategories = useMemo(() => {
      return [...categories]
        .filter((category) =>
          isCategoryOpen(
            category,
            catSched.find((sched) => sched.categoryId === category.id),
            dayName,
            minutes,
            category.mainCategoryId
              ? mainCategories.find(
                  (mainCategory) => mainCategory.id === category.mainCategoryId
                )
              : undefined,
            category.mainCategoryId
              ? mainCatSched.find(
                  (sched) => sched.mainCategoryId === category.mainCategoryId
                )
              : undefined,
            nowDate
          )
        )
        .map((cat) => ({
          ...cat,
          position: Number.isFinite(cat.position)
            ? cat.position
            : Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => a.position - b.position);
    }, [catSched, categories, dayName, mainCatSched, mainCategories, minutes, nowDate]);

    const derivedMainCategories = useMemo(() => {
      if (sortedMainCategories.length) return sortedMainCategories;
      const fallback = sortedCategories.filter((category) => !category.mainCategoryId);
      return fallback.map((category, index) => ({
        id: category.id,
        name: category.name,
        active: category.active,
        position: Number.isFinite(category.position) ? category.position : index,
        highlightText: category.highlightText,
      }));
    }, [sortedCategories, sortedMainCategories]);

    const childCategoriesByParent = useMemo(() => {
      const map = new Map<string, Category[]>();
      sortedCategories
        .filter((category) => category.mainCategoryId)
        .forEach((category) => {
          const parentId = category.mainCategoryId as string;
          const current = map.get(parentId) ?? [];
          current.push(category);
          map.set(parentId, current);
        });

      map.forEach((children) =>
        children.sort((a, b) => a.position - b.position)
      );

      return map;
    }, [sortedCategories]);

    const visibleMainCategories = useMemo(() => {
      if (!filteredCategoryNames) return derivedMainCategories;

      return derivedMainCategories.filter((category) => {
        const children = childCategoriesByParent.get(category.id) ?? [];
        return children.some(
          (child) =>
            filteredCategoryNames.has(child.name) ||
            (child.subcategoryName &&
              filteredCategoryNames.has(child.subcategoryName))
        );
      });
    }, [childCategoriesByParent, derivedMainCategories, filteredCategoryNames]);

    /* --------------------------------------------------------
      FAVOURITES
    -------------------------------------------------------- */
    /* --------------------------------------------------------
      ADDRESS AUTOCOMPLETE (Ideal Postcodes) + RADIUS + SAVE
    -------------------------------------------------------- */
    useEffect(() => {
      if (addrInput.length < 3) {
        setAddrSuggestions([]);
        return;
      }

      const controller = new AbortController();
      let cancelled = false;

      const timeout = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/address/search?q=${encodeURIComponent(addrInput)}`,
            { signal: controller.signal }
          );

          if (!res.ok) return;

          const data = await res.json();
          if (!cancelled) setAddrSuggestions(data.suggestions || []);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Address autocomplete error:", err);
          }
        }
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timeout);
        controller.abort();
      };
    }, [addrInput]);

    const persistAddressIfLoggedIn = async (addr: any) => {
      if (!isSignedIn) return;
      try {
        await fetch("/api/customer/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr }),
        });
      } catch (err) {
        console.error("Failed to save address to customer record", err);
      }
    };

    const handleAddressAccepted = async (addr: any) => {
      // Save in context + localStorage
      setAddress(addr);
      setAddrSuggestions([]);
      setAddrInput("");
      setAddrError("");

      // Save to DB if logged in
      await persistAddressIfLoggedIn(addr);

      // Close sheet if it was manually opened
      setLocationSheetOpen(false);
    };

    const checkRadius = async (lat: number, lng: number) => {
      const radiusRes = await fetch("/api/delivery/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      const radiusData = await radiusRes.json();
      return radiusData.deliverable === true;
    };

    const selectAddressSuggestion = async (s: any) => {
      setAddrLoading(true);
      setAddrError("");

      try {
        // 1) Get full address details
        const res = await fetch(`/api/address/details?id=${s.id}`);
        const data = await res.json();

        if (!data.address) {
          setAddrError("Could not retrieve address details.");
          return;
        }

        const addr = data.address;

        if (
          typeof addr.latitude !== "number" ||
          typeof addr.longitude !== "number"
        ) {
          setAddrError("This address does not have coordinates.");
          return;
        }

        // 2) Check against delivery radius
        const ok = await checkRadius(addr.latitude, addr.longitude);
        if (!ok) {
          setAddrError(
            "Sorry, we don’t currently deliver to this address. It’s a bit too far. If you still need delivery, please contact our team."
          );
          return;
        }

        // 3) All good → accept
        await handleAddressAccepted(addr);
      } catch (err) {
        console.error("Select address failed:", err);
        setAddrError("Something went wrong. Please try again.");
      } finally {
        setAddrLoading(false);
      }
    };

    /* --------------------------------------------------------
      USE MY LOCATION (Mapbox reverse geocode) + RADIUS + SAVE
    -------------------------------------------------------- */
    const detectLocation = () => {
      if (!navigator.geolocation) {
        setAddrError("Geolocation not supported.");
        return;
      }

      setAddrLoading(true);
      setAddrError("");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `/api/address/reverse-geocode?lat=${latitude}&lng=${longitude}`
            );
            const data = await res.json();

            if (!data.address) {
              setAddrError("Unable to detect address.");
              return;
            }

            const addr = data.address;

            if (
              typeof addr.latitude !== "number" ||
              typeof addr.longitude !== "number"
            ) {
              setAddrError("Detected address has no coordinates.");
              return;
            }

            // Check radius
            const ok = await checkRadius(addr.latitude, addr.longitude);
            if (!ok) {
              setAddrError(
                "Sorry, we don’t currently deliver to this location. It’s a bit too far. If you still need delivery, please contact our team."
              );
              return;
            }

            // Accept address
            await handleAddressAccepted(addr);
          } catch (err) {
            console.error("Location detection failed:", err);
            setAddrError("Something went wrong. Please try again.");
          } finally {
            setAddrLoading(false);
          }
        },
        () => {
          setAddrError("Location permission denied.");
          setAddrLoading(false);
        },
        { enableHighAccuracy: true }
      );
    };

    /* --------------------------------------------------------
      If NO address → force sheet open (gate)
    -------------------------------------------------------- */
    const mustSelectAddress = !address;
    const sheetVisible = mustSelectAddress || locationSheetOpen;

    /* --------------------------------------------------------
      Login-aware add-to-cart for QuickViewModal
    -------------------------------------------------------- */
    /* --------------------------------------------------------
      Location pill label
    -------------------------------------------------------- */
    const addressLabel = address
      ? [address.town, address.postcode].filter(Boolean).join(" • ") ||
        address.line1 ||
        "Saved address"
      : "Set delivery address";

    const addressSubLabel = address
      ? address.line1 || "Delivery location"
      : "Tap to choose location";


    /* --------------------------------------------------------
      RENDER
    -------------------------------------------------------- */
    const [bookOpen, setBookOpen] = useState(false);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* NAVBAR (no location here) */}
        <Navbar onSearchChange={setSearch} />

        {/* LOCATION BOTTOM SHEET */}
        {sheetVisible && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
            {/* drag handle */}
            {!mustSelectAddress && (
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/70" />
            )}

            <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    Set delivery address
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-gray-900">
                    Where should we deliver?
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    We currently deliver in Luton, Harpenden and nearby areas.
                  </p>
                </div>

                {!mustSelectAddress && (
                  <button
                    onClick={() => setLocationSheetOpen(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                )}
              </div>

              {/* Use My Location */}
              <button
                onClick={detectLocation}
                disabled={addrLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-purple-600 px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60"
              >
                <FiTarget className={addrLoading ? "animate-pulse" : ""} />
                {addrLoading ? "Detecting your location..." : "Use my current location"}
              </button>

              {/* Divider */}
              <div className="mt-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                  or
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Address Search */}
              <div className="relative mt-4">
                <input
                  value={addrInput}
                  onChange={(e) => setAddrInput(e.target.value)}
                  placeholder="Start typing your postcode or address"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />

                {addrSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 bottom-full mb-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
                  {addrSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectAddressSuggestion(s)}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              </div>

              {/* Error */}
              {addrError && (
                <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {addrError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* HERO + LOCATION + SEARCH */}
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/*<Hero  setBookOpen={setBookOpen} /> */}
          <BookDeliveryModal
              open={bookOpen}
              onClose={() => setBookOpen(false)}
            />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 max-w-3xl mx-auto">
            {/* Location pill 30–35% */}
            <button
              onClick={() => setLocationSheetOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:shadow-md sm:flex-[0.35]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50">
                <FiMapPin className="text-purple-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Deliver to
                </span>
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[10rem] sm:max-w-[8rem]">
                  {addressLabel}
                </span>
                <span className="text-[11px] text-gray-500 truncate max-w-[10rem] sm:max-w-[8rem]">
                  {addressSubLabel}
                </span>
              </div>
            </button>

            {/* Product search 65–70% */}
            <div className="relative flex-1 sm:flex-[0.65]">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search dishes, essentials..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />

              {search.length > 0 && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}

              {searchOpen && productSuggestions.length > 0 && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                  {productSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSearch(s.name);
                        setSearchOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {s.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CATEGORY GRID */}
        <section className="mx-auto mt-10 max-w-7xl space-y-6 px-4 lg:px-8">
          <SectionTitle
            eyebrow="Tonight's Picks"
            title="Discover the New Essentials"
            action={
              <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                Curated by category
              </span>
            }
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 rounded-3xl bg-white shadow-sm"
                >
                  <div className="h-28 w-full rounded-t-3xl bg-gray-100" />
                  <div className="space-y-2 px-4 py-3">
                    <div className="h-4 w-28 rounded-full bg-gray-100" />
                    <div className="h-3 w-20 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : derivedMainCategories.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
              No categories available right now. Please check back soon.
            </div>
          ) : search.trim().length > 0 && visibleMainCategories.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
              No categories match your search right now.
            </div>
          ) : (
            <div className="space-y-8">
              {visibleMainCategories.map((category) => {
                const childCategories =
                  childCategoriesByParent.get(category.id) ?? [];
                const visibleChildCategories = filteredCategoryNames
                  ? childCategories.filter(
                      (child) =>
                        filteredCategoryNames.has(child.name) ||
                        (child.subcategoryName &&
                          filteredCategoryNames.has(child.subcategoryName))
                    )
                  : childCategories;

                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category.highlightText && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {category.highlightText}
                        </span>
                      )}
                    </div>
                    {visibleChildCategories.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
                        No subcategories available right now.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                        {visibleChildCategories.map((child) => (
                          <CategoryIconTile
                            key={child.id}
                            name={child.name}
                            imageUrl={child.imageUrl}
                            imageKey={child.imageKey}
                            href={`/categories/${child.id}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }
