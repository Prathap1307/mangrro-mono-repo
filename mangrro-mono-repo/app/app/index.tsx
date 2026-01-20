import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import type {
  Category,
  CategoryRaw,
  CategorySchedule,
  DayName,
  MainCategory,
  MainCategoryRaw,
  MainCategorySchedule,
} from "../types/homepage";
import type {
  ItemMeta as BaseItemMeta,
  ItemSchedule,
  Subcategory,
  SubcategoryRaw,
  SubcategorySchedule,
} from "../types/catalog";
import {
  isCategoryOpen,
  isEntityActive,
  isItemListVisible,
  isScheduleOpen,
} from "../lib/visibility/items";

interface SchedulerSelection {
  ids: string[];
}

interface ItemMeta extends Omit<BaseItemMeta, "categoryId"> {
  id?: string;
  category?: string;
  categoryId?: string;
  imageKey?: string;
  description?: string;
  keywords?: string[];
  subcategoryId?: string;
  subcategoryName?: string;
  schedule?: ItemSchedule;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  ageRestricted?: boolean;
  keywords?: string[];
}

interface DeliveryAddress {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressValue {
  label: string;
  latitude: number;
  longitude: number;
  source: "mapbox" | "manual";
  shopOrDoor?: string;
  postcode?: string;
}

type ParcelSize = "small" | "medium" | "large";

type PickupType = "now" | "schedule";

type PostcodeStatus = "idle" | "validating" | "valid" | "invalid";

function getTodayInfo(): { dayName: DayName; minutes: number } {
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toString() as DayName;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { dayName, minutes };
}

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

function filterProductAutocomplete(products: Product[], q: string) {
  if (!q.trim()) return [];
  const query = q.toLowerCase();
  return products
    .filter((p) =>
      [p.name, p.description ?? "", p.category ?? "", ...(p.keywords ?? [])]
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

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionTitleWrapper}>
      <View>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

function CategoryIconTile({
  name,
  imageUrl,
  imageKey,
  onPress,
}: {
  name: string;
  imageUrl?: string;
  imageKey?: string;
  onPress?: () => void;
}) {
  const imageSrc = imageKey
    ? `/api/image-proxy?key=${encodeURIComponent(imageKey)}`
    : imageUrl;
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Pressable style={styles.categoryTileWrapper} onPress={onPress}>
      <View style={styles.categoryTileImageContainer}>
        <View style={styles.categoryTileImageWrapper}>
          {imageSrc ? (
            <Image source={{ uri: imageSrc }} style={styles.categoryTileImage} />
          ) : (
            <Text style={styles.categoryTileInitial}>{initial}</Text>
          )}
        </View>
      </View>
      <Text style={styles.categoryTileLabel}>{name}</Text>
    </Pressable>
  );
}

function TimePicker({
  pickupType,
  setPickupType,
  pickupTime,
  setPickupTime,
}: {
  pickupType: PickupType;
  setPickupType: (value: PickupType) => void;
  pickupTime: string;
  setPickupTime: (value: string) => void;
}) {
  return (
    <View style={styles.timePickerWrapper}>
      <Text style={styles.formLabel}>Pickup time</Text>
      <View style={styles.timePickerRow}>
        <Pressable
          style={[
            styles.timePickerButton,
            pickupType === "now" ? styles.timePickerButtonActive : styles.timePickerButtonIdle,
          ]}
          onPress={() => setPickupType("now")}
        >
          <Text
            style={
              pickupType === "now"
                ? styles.timePickerButtonTextActive
                : styles.timePickerButtonTextIdle
            }
          >
            Now
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.timePickerButton,
            pickupType === "schedule" ? styles.timePickerButtonActive : styles.timePickerButtonIdle,
          ]}
          onPress={() => setPickupType("schedule")}
        >
          <Text
            style={
              pickupType === "schedule"
                ? styles.timePickerButtonTextActive
                : styles.timePickerButtonTextIdle
            }
          >
            Schedule
          </Text>
        </Pressable>
      </View>
      {pickupType === "schedule" ? (
        <View style={styles.selectWrapper}>
          <Text style={styles.selectLabel}>Select a time</Text>
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeOptionsRow}
            renderItem={({ item }) => (
              <Pressable
                style={
                  item === pickupTime
                    ? styles.timeOptionActive
                    : styles.timeOptionIdle
                }
                onPress={() => setPickupTime(item)}
              >
                <Text
                  style={
                    item === pickupTime
                      ? styles.timeOptionTextActive
                      : styles.timeOptionTextIdle
                  }
                >
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

function AddressPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; label: string; session?: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [manualMode, setManualMode] = useState(false);
  const [shopOrDoor, setShopOrDoor] = useState("");
  const [postcode, setPostcode] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<PostcodeStatus>("idle");
  const [manualCoords, setManualCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const showManualPrompt = useMemo(() => {
    return (
      open &&
      !manualMode &&
      !loading &&
      searchAttempted &&
      query.trim().length >= 3 &&
      results.length === 0
    );
  }, [open, manualMode, loading, searchAttempted, query, results.length]);

  useEffect(() => {
    if (!open || value) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setSearchAttempted(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setSearchAttempted(false);

      try {
        const res = await fetch(
          `/api/address/mapbox-search?q=${encodeURIComponent(trimmed)}`
        );

        if (!res.ok) {
          if (requestIdRef.current === currentRequestId) {
            setResults([]);
            setSearchAttempted(true);
          }
          return;
        }

        const data = (await res.json()) as { suggestions?: typeof results };
        if (requestIdRef.current === currentRequestId) {
          setResults(data.suggestions ?? []);
          setSearchAttempted(true);
        }
      } catch {
        if (requestIdRef.current === currentRequestId) {
          setResults([]);
          setSearchAttempted(true);
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, query, value]);

  useEffect(() => {
    if (!manualMode) return;

    const trimmed = postcode.trim().toUpperCase();
    if (trimmed.length < 3) {
      setPostcodeStatus("idle");
      setManualCoords(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPostcodeStatus("validating");
      try {
        const res = await fetch(
          `/api/address/mapbox-geocode?q=${encodeURIComponent(trimmed)}`
        );

        if (!res.ok) {
          setPostcodeStatus("invalid");
          setManualCoords(null);
          return;
        }

        const data = (await res.json()) as {
          suggestions?: { latitude: number; longitude: number }[];
        };
        const first = data.suggestions?.[0];

        if (!first) {
          setPostcodeStatus("invalid");
          setManualCoords(null);
          return;
        }

        setPostcodeStatus("valid");
        setManualCoords({
          latitude: first.latitude,
          longitude: first.longitude,
        });
      } catch {
        setPostcodeStatus("invalid");
        setManualCoords(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [manualMode, postcode]);

  useEffect(() => {
    setErrorMessage(null);
  }, [query, manualMode, shopOrDoor, postcode]);

  async function selectSuggestion(item: { id: string; label: string; session?: string }) {
    try {
      const res = await fetch(
        `/api/address/mapbox-retrieve?id=${encodeURIComponent(
          item.id
        )}&session=${encodeURIComponent(item.session ?? "")}`
      );

      if (!res.ok) {
        setErrorMessage("We couldn't load that location. Please try again.");
        return;
      }

      const data = (await res.json()) as {
        name?: string;
        address?: string;
        postcode?: string;
        latitude?: number;
        longitude?: number;
      };

      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        setErrorMessage("We couldn't resolve that location. Try another option.");
        return;
      }

      const labelValue = [data.name, data.address, data.postcode]
        .filter(Boolean)
        .join(", ");

      onChange({
        label: labelValue || item.label,
        latitude: data.latitude,
        longitude: data.longitude,
        source: "mapbox",
      });

      setQuery(labelValue || item.label);
      setOpen(true);
      setResults([]);
    } catch {
      setErrorMessage("We couldn't load that location. Please try again.");
    }
  }

  function handleManualConfirm() {
    if (postcodeStatus !== "valid" || !manualCoords) {
      setErrorMessage("Please enter a valid postcode.");
      return;
    }

    const normalizedPostcode = postcode.trim().toUpperCase();
    const labelValue = [shopOrDoor.trim(), normalizedPostcode]
      .filter(Boolean)
      .join(", ");

    onChange({
      label: labelValue || normalizedPostcode,
      latitude: manualCoords.latitude,
      longitude: manualCoords.longitude,
      source: "manual",
      shopOrDoor: shopOrDoor.trim() || undefined,
      postcode: normalizedPostcode,
    });

    setQuery(labelValue || normalizedPostcode);
    setManualMode(false);
    setResults([]);
  }

  function reset() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setSearchAttempted(false);
    setManualMode(false);
    setShopOrDoor("");
    setPostcode("");
    setPostcodeStatus("idle");
    setManualCoords(null);
    setErrorMessage(null);
    onChange(null);
  }

  return (
    <View style={styles.addressPickerWrapper}>
      <Text style={styles.formLabel}>{label}</Text>

      {value ? (
        <View style={styles.addressPickerSelected}>
          <TextInput
            value={value.label}
            editable={false}
            style={styles.addressPickerInputDisabled}
          />
          <Pressable style={styles.addressPickerReset} onPress={reset}>
            <Text style={styles.addressPickerResetText}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {!open ? (
            <Pressable
              style={styles.addressPickerAddButton}
              onPress={() => setOpen(true)}
            >
              <Text style={styles.addressPickerAddText}>Add address</Text>
            </Pressable>
          ) : (
            <View style={styles.addressPickerSearchWrapper}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                style={styles.addressPickerInput}
                placeholder="Search place, postcode or address"
              />
              {loading ? (
                <Text style={styles.addressPickerLoading}>Searching…</Text>
              ) : null}
            </View>
          )}
        </>
      )}

      {!value && open && results.length > 0 ? (
        <View style={styles.addressPickerResults}>
          {results.map((result) => (
            <Pressable
              key={result.id}
              style={styles.addressPickerResultRow}
              onPress={() => selectSuggestion(result)}
            >
              <Text style={styles.addressPickerResultIcon}>📍</Text>
              <Text style={styles.addressPickerResultText}>{result.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!value && showManualPrompt ? (
        <Pressable
          style={styles.addressPickerManualButton}
          onPress={() => setManualMode(true)}
        >
          <Text style={styles.addressPickerManualIcon}>✎</Text>
          <Text style={styles.addressPickerManualText}>Add address manually</Text>
        </Pressable>
      ) : null}

      {!value && manualMode ? (
        <View style={styles.addressPickerManualContainer}>
          <TextInput
            placeholder="Shop name / Door number"
            value={shopOrDoor}
            onChangeText={setShopOrDoor}
            style={styles.addressPickerManualInput}
          />

          <View style={styles.addressPickerPostcodeRow}>
            <TextInput
              placeholder="Postcode"
              value={postcode}
              onChangeText={setPostcode}
              style={styles.addressPickerManualInput}
            />
            {postcodeStatus === "valid" ? (
              <Text style={styles.addressPickerPostcodeIconValid}>✔</Text>
            ) : null}
            {postcodeStatus === "invalid" ? (
              <Text style={styles.addressPickerPostcodeIconInvalid}>!</Text>
            ) : null}
          </View>

          {postcodeStatus === "invalid" ? (
            <Text style={styles.addressPickerErrorText}>Invalid postcode</Text>
          ) : null}

          <Pressable
            style={
              postcodeStatus === "valid"
                ? styles.addressPickerConfirm
                : styles.addressPickerConfirmDisabled
            }
            onPress={handleManualConfirm}
            disabled={postcodeStatus !== "valid"}
          >
            <Text style={styles.addressPickerConfirmText}>Use this address</Text>
          </Pressable>
        </View>
      ) : null}

      {errorMessage ? (
        <Text style={styles.addressPickerErrorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

function BookDeliveryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pickupAddress, setPickupAddress] = useState<AddressValue | null>(null);
  const [dropAddress, setDropAddress] = useState<AddressValue | null>(null);

  const [pickupType, setPickupType] = useState<PickupType>("now");
  const [pickupTime, setPickupTime] = useState<string>("");

  const [receipt, setReceipt] = useState<{ name: string; type: string } | null>(null);
  const [parcelSize, setParcelSize] = useState<ParcelSize | "">("");
  const [instructions, setInstructions] = useState("");

  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [booking, setBooking] = useState<"idle" | "saving" | "success">("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);

  const readyForPrice = useMemo(() => {
    return Boolean(pickupAddress && dropAddress && parcelSize);
  }, [pickupAddress, dropAddress, parcelSize]);

  useEffect(() => {
    setPrice(null);
    setPriceError(null);
    setBooking("idle");
    setBookingError(null);
  }, [pickupAddress, dropAddress, parcelSize]);

  async function calculatePrice() {
    if (!pickupAddress || !dropAddress || !parcelSize) return;

    setLoadingPrice(true);
    setPriceError(null);

    try {
      const res = await fetch("/api/delivery-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: pickupAddress,
          to: dropAddress,
          location: "pickup",
          parcelSize,
        }),
      });

      if (!res.ok) {
        setAddrError("Could not retrieve address details.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setPriceError(data.error ?? "Failed to calculate price.");
        return;
      }

      if (!data.available) {
        setPriceError(data.message ?? "Sorry, we don’t deliver to this location.");
        return;
      }

      if (typeof data.finalPrice !== "number") {
        setPriceError("Failed to calculate price.");
        return;
      }

      setPrice(data.finalPrice);
    } catch {
      setPriceError("Failed to calculate price. Try again.");
    } finally {
      setLoadingPrice(false);
    }
  }

  async function uploadReceipt(file: { name: string; type: string }) {
    const res = await fetch(
      `/api/upload-url?file=${encodeURIComponent(file.name)}&type=${file.type}`
    );
    if (!res.ok) {
      throw new Error("Failed to get upload URL.");
    }
    const { uploadUrl, key } = (await res.json()) as {
      uploadUrl: string;
      key: string;
    };

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: "",
    });

    return {
      s3Key: key,
      s3Url: `/api/image?key=${encodeURIComponent(key)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: 0,
    };
  }

  function buildIsoTime(timeValue: string) {
    if (!timeValue) return undefined;
    const [hours, minutes] = timeValue.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;

    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    return scheduled.toISOString();
  }

  async function handleBookDelivery() {
    if (!pickupAddress || !dropAddress || price === null) return;
    if (pickupType === "schedule" && !pickupTime) {
      setBookingError("Please select a pickup time.");
      return;
    }

    setBooking("saving");
    setBookingError(null);

    try {
      const image = receipt ? await uploadReceipt(receipt) : undefined;
      const payload = {
        pickupAddress,
        dropoffAddress: dropAddress,
        parcelSize:
          parcelSize === "small"
            ? "Small"
            : parcelSize === "medium"
              ? "Medium"
              : "Large",
        pickupTime:
          pickupType === "now" ? new Date().toISOString() : buildIsoTime(pickupTime),
        dropTime: undefined,
        instructions,
        image,
        price,
      };

      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to book delivery.");
      }

      setBooking("success");
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Failed to book delivery.");
      setBooking("idle");
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Pickup & Delivery</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AddressPicker
              label="Pickup location"
              value={pickupAddress}
              onChange={setPickupAddress}
            />

            <AddressPicker
              label="Drop-off location"
              value={dropAddress}
              onChange={setDropAddress}
            />

            <TimePicker
              pickupType={pickupType}
              setPickupType={setPickupType}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Upload receipt (if store pickup)</Text>
              <Pressable
                style={styles.uploadButton}
                onPress={() => setReceipt({ name: "receipt", type: "image" })}
              >
                <Text style={styles.uploadButtonText}>
                  {receipt ? "Receipt selected" : "Choose file"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parcel size</Text>
              <View style={styles.parcelRow}>
                {([
                  { id: "small", label: "Small (bag)" },
                  { id: "medium", label: "Medium (box)" },
                  { id: "large", label: "Large / bulky" },
                ] as const).map((option) => (
                  <Pressable
                    key={option.id}
                    style={
                      parcelSize === option.id
                        ? styles.parcelOptionActive
                        : styles.parcelOption
                    }
                    onPress={() => setParcelSize(option.id)}
                  >
                    <Text
                      style={
                        parcelSize === option.id
                          ? styles.parcelOptionTextActive
                          : styles.parcelOptionText
                      }
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Instructions</Text>
              <TextInput
                value={instructions}
                onChangeText={setInstructions}
                style={styles.instructionsInput}
                placeholder="Add delivery notes (optional)"
              />
            </View>

            {loadingPrice ? (
              <Text style={styles.helpText}>Calculating price…</Text>
            ) : null}

            {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

            {typeof price === "number" ? (
              <Text style={styles.priceText}>Delivery Price: £{price.toFixed(2)}</Text>
            ) : null}

            {bookingError ? <Text style={styles.errorText}>{bookingError}</Text> : null}

            {booking === "success" ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>
                  Booking confirmed! We’ll notify you shortly with the courier details.
                </Text>
              </View>
            ) : null}

            {price === null ? (
              <Pressable
                onPress={calculatePrice}
                disabled={!readyForPrice || loadingPrice}
                style={
                  !readyForPrice || loadingPrice
                    ? styles.primaryButtonDisabled
                    : styles.primaryButton
                }
              >
                <Text style={styles.primaryButtonText}>Calculate Price</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleBookDelivery}
                disabled={booking === "saving" || booking === "success"}
                style={
                  booking === "saving" || booking === "success"
                    ? styles.primaryButtonDisabled
                    : styles.primaryButton
                }
              >
                <Text style={styles.primaryButtonText}>
                  {booking === "saving"
                    ? "Booking..."
                    : booking === "success"
                      ? "Booked"
                      : "Book Delivery"}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Navbar({
  cartQuantity,
  favouritesCount,
  onOpenCart,
  onOpenFavourites,
  onOpenAccount,
}: {
  cartQuantity: number;
  favouritesCount: number;
  onOpenCart: () => void;
  onOpenFavourites: () => void;
  onOpenAccount: () => void;
}) {
  return (
    <View style={styles.navbar}>
      <View style={styles.navbarInner}>
        <View style={styles.brandRow}>
          <View style={styles.brandImageWrapper}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.brandImage}
            />
          </View>
          <Text style={styles.brandText}>Delivery Star</Text>
        </View>
        <View style={styles.navIcons}>
          <Pressable style={styles.navIconButton} onPress={onOpenCart}>
            <Text style={styles.navIcon}>🛒</Text>
            {cartQuantity > 0 ? (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{cartQuantity}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.navIconButton} onPress={onOpenFavourites}>
            <Text style={styles.navIcon}>❤</Text>
            {favouritesCount > 0 ? (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{favouritesCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.navIconButton} onPress={onOpenAccount}>
            <Text style={styles.navIcon}>👤</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HomePage() {
  const router = useRouter();
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

  const [address, setAddress] = useState<DeliveryAddress | null>(null);

  const [addrInput, setAddrInput] = useState("");
  const [addrSuggestions, setAddrSuggestions] = useState<any[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("delivery-address");
        if (raw) setAddress(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        if (address) {
          localStorage.setItem("delivery-address", JSON.stringify(address));
        } else {
          localStorage.removeItem("delivery-address");
        }
      }
    } catch {
      // ignore
    }
  }, [address]);

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

      const categorySelectionIds = Array.isArray((catSelJ as SchedulerSelection)?.ids)
        ? (catSelJ as SchedulerSelection).ids
        : [];
      const itemSelectionIds = Array.isArray((itemSelJ as SchedulerSelection)?.ids)
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

  const { dayName, minutes } = getTodayInfo();
  const nowDate = useMemo(() => new Date(), [dayName, minutes]);

  const allProducts = useMemo(() => {
    if (loading) return [];

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const mainCatMap = new Map(mainCategories.map((c) => [c.id, c]));
    const subcatMap = new Map(subcategories.map((s) => [s.id, s]));
    const subcatNameMap = new Map(subcategories.map((s) => [s.name.toLowerCase(), s]));
    const mainCatSchedMap = new Map(mainCatSched.map((c) => [c.mainCategoryId, c]));
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
        const mainCatSchedule = mainCat ? mainCatSchedMap.get(mainCat.id) : undefined;
        const subcategory = resolveSubcategory(it, subcatMap, subcatNameMap);
        const subcategorySchedule = resolveSubcategorySchedule(
          subcategory,
          it,
          subcatSchedById,
          subcatSchedByName
        );

        const itemSchedule =
          itemSchedMap.get(it.itemId) ?? (it.id ? itemSchedMap.get(it.id) : undefined);
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
        position: Number.isFinite(cat.position) ? cat.position : Number.MAX_SAFE_INTEGER,
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
            ? mainCategories.find((mainCategory) => mainCategory.id === category.mainCategoryId)
            : undefined,
          category.mainCategoryId
            ? mainCatSched.find((sched) => sched.mainCategoryId === category.mainCategoryId)
            : undefined,
          nowDate
        )
      )
      .map((cat) => ({
        ...cat,
        position: Number.isFinite(cat.position) ? cat.position : Number.MAX_SAFE_INTEGER,
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

    map.forEach((children) => children.sort((a, b) => a.position - b.position));

    return map;
  }, [sortedCategories]);

  const visibleMainCategories = useMemo(() => {
    if (!filteredCategoryNames) return derivedMainCategories;

    return derivedMainCategories.filter((category) => {
      const children = childCategoriesByParent.get(category.id) ?? [];
      return children.some(
        (child) =>
          filteredCategoryNames.has(child.name) ||
          (child.subcategoryName && filteredCategoryNames.has(child.subcategoryName))
      );
    });
  }, [childCategoriesByParent, derivedMainCategories, filteredCategoryNames]);

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
    setAddress(addr);
    setAddrSuggestions([]);
    setAddrInput("");
    setAddrError("");

    await persistAddressIfLoggedIn(addr);

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
      const res = await fetch(`/api/address/details?id=${s.id}`);
      if (!res.ok) {
        setAddrError("Could not retrieve address details.");
        return;
      }

      const data = await res.json();

      if (!data.address) {
        setAddrError("Could not retrieve address details.");
        return;
      }

      const addr = data.address;

      if (typeof addr.latitude !== "number" || typeof addr.longitude !== "number") {
        setAddrError("This address does not have coordinates.");
        return;
      }

      const ok = await checkRadius(addr.latitude, addr.longitude);
      if (!ok) {
        setAddrError(
          "Sorry, we don’t currently deliver to this address. It’s a bit too far. If you still need delivery, please contact our team."
        );
        return;
      }

      await handleAddressAccepted(addr);
    } catch (err) {
      console.error("Select address failed:", err);
      setAddrError("Something went wrong. Please try again.");
    } finally {
      setAddrLoading(false);
    }
  };

  const detectLocation = () => {
    if (!globalThis.navigator?.geolocation) {
      setAddrError("Geolocation not supported.");
      return;
    }

    setAddrLoading(true);
    setAddrError("");

    globalThis.navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/address/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) {
            setAddrError("Unable to detect address.");
            return;
          }

          const data = await res.json();

          if (!data.address) {
            setAddrError("Unable to detect address.");
            return;
          }

          const addr = data.address;

          if (typeof addr.latitude !== "number" || typeof addr.longitude !== "number") {
            setAddrError("Detected address has no coordinates.");
            return;
          }

          const ok = await checkRadius(addr.latitude, addr.longitude);
          if (!ok) {
            setAddrError(
              "Sorry, we don’t currently deliver to this location. It’s a bit too far. If you still need delivery, please contact our team."
            );
            return;
          }

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

  const mustSelectAddress = !address;
  const sheetVisible = mustSelectAddress || locationSheetOpen;

  const addressLabel = address
    ? [address.town, address.postcode].filter(Boolean).join(" • ") ||
      address.line1 ||
      "Saved address"
    : "Set delivery address";

  const addressSubLabel = address ? address.line1 || "Delivery location" : "Tap to choose location";

  const cartQuantity = 0;
  const favouritesCount = 0;

  return (
    <View style={styles.page}>
      <Navbar
        cartQuantity={cartQuantity}
        favouritesCount={favouritesCount}
        onOpenCart={() => router.push("/cart")}
        onOpenFavourites={() => router.push("/favourites")}
        onOpenAccount={() => router.push("/account")}
      />

      {sheetVisible ? (
        <View style={styles.sheetBackdrop}>
          {!mustSelectAddress ? <View style={styles.sheetHandle} /> : null}

          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetEyebrow}>Set delivery address</Text>
                <Text style={styles.sheetTitle}>Where should we deliver?</Text>
                <Text style={styles.sheetSubtitle}>
                  We currently deliver in Luton, Harpenden and nearby areas.
                </Text>
              </View>

              {!mustSelectAddress ? (
                <Pressable onPress={() => setLocationSheetOpen(false)}>
                  <Text style={styles.sheetClose}>Close</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={detectLocation}
              disabled={addrLoading}
              style={
                addrLoading
                  ? styles.locationButtonDisabled
                  : styles.locationButton
              }
            >
              <Text style={styles.locationButtonIcon}>◎</Text>
              <Text style={styles.locationButtonText}>
                {addrLoading ? "Detecting your location..." : "Use my current location"}
              </Text>
            </Pressable>

            <View style={styles.sheetDivider}>
              <View style={styles.sheetDividerLine} />
              <Text style={styles.sheetDividerText}>or</Text>
              <View style={styles.sheetDividerLine} />
            </View>

            <View style={styles.addressInputWrapper}>
              <TextInput
                value={addrInput}
                onChangeText={setAddrInput}
                placeholder="Start typing your postcode or address"
                style={styles.addressInput}
              />

              {addrSuggestions.length > 0 ? (
                <View style={styles.addressSuggestions}>
                  <ScrollView style={styles.addressSuggestionsScroll}>
                    {addrSuggestions.map((s) => (
                      <Pressable
                        key={s.id}
                        onPress={() => selectAddressSuggestion(s)}
                        style={styles.addressSuggestionItem}
                      >
                        <Text style={styles.addressSuggestionText}>{s.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            {addrError ? (
              <Text style={styles.addressError}>{addrError}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <BookDeliveryModal open={bookOpen} onClose={() => setBookOpen(false)} />

        <View style={styles.heroRow}>
          <Pressable
            onPress={() => setLocationSheetOpen(true)}
            style={styles.locationPill}
          >
            <View style={styles.locationIconCircle}>
              <Text style={styles.locationIcon}>📍</Text>
            </View>
            <View style={styles.locationTextCol}
            >
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationValue}>{addressLabel}</Text>
              <Text style={styles.locationSubLabel}>{addressSubLabel}</Text>
            </View>
          </Pressable>

          <View style={styles.searchWrapper}>
            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setSearchOpen(true);
              }}
              placeholder="Search dishes, essentials..."
              style={styles.searchInput}
            />

            {search.length > 0 ? (
              <Pressable
                onPress={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
                style={styles.searchClear}
              >
                <Text style={styles.searchClearText}>✕</Text>
              </Pressable>
            ) : null}

            {searchOpen && productSuggestions.length > 0 ? (
              <View style={styles.searchSuggestions}>
                {productSuggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setSearch(s.name);
                      setSearchOpen(false);
                    }}
                    style={styles.searchSuggestionRow}
                  >
                    <Text style={styles.searchSuggestionTitle}>{s.name}</Text>
                    {s.description ? (
                      <Text style={styles.searchSuggestionDescription}>
                        {s.description}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle
            eyebrow="Tonight's Picks"
            title="Discover the New Essentials"
            action={
              <View style={styles.sectionAction}>
                <Text style={styles.sectionActionText}>Curated by category</Text>
              </View>
            }
          />

          {loading ? (
            <FlatList
              data={Array.from({ length: 6 }).map((_, index) => index)}
              keyExtractor={(item) => String(item)}
              numColumns={1}
              scrollEnabled={false}
              contentContainerStyle={styles.loadingGrid}
              renderItem={() => (
                <View style={styles.loadingCard}>
                  <View style={styles.loadingImage} />
                  <View style={styles.loadingContent}>
                    <View style={styles.loadingLinePrimary} />
                    <View style={styles.loadingLineSecondary} />
                  </View>
                </View>
              )}
            />
          ) : derivedMainCategories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No categories available right now. Please check back soon.
              </Text>
            </View>
          ) : search.trim().length > 0 && visibleMainCategories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No categories match your search right now.</Text>
            </View>
          ) : (
            <View style={styles.mainCategoryStack}>
              {visibleMainCategories.map((category) => {
                const childCategories = childCategoriesByParent.get(category.id) ?? [];
                const visibleChildCategories = filteredCategoryNames
                  ? childCategories.filter(
                      (child) =>
                        filteredCategoryNames.has(child.name) ||
                        (child.subcategoryName &&
                          filteredCategoryNames.has(child.subcategoryName))
                    )
                  : childCategories;

                return (
                  <View key={category.id} style={styles.mainCategoryBlock}>
                    <View style={styles.mainCategoryHeader}>
                      <Text style={styles.mainCategoryTitle}>{category.name}</Text>
                      {category.highlightText ? (
                        <Text style={styles.mainCategoryHighlight}>
                          {category.highlightText}
                        </Text>
                      ) : null}
                    </View>
                    {visibleChildCategories.length === 0 ? (
                      <View style={styles.emptySubCard}>
                        <Text style={styles.emptySubText}>
                          No subcategories available right now.
                        </Text>
                      </View>
                    ) : (
                      <FlatList
                        data={visibleChildCategories}
                        keyExtractor={(item) => item.id}
                        numColumns={4}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.categoryGridRow}
                        renderItem={({ item }) => (
                          <CategoryIconTile
                            name={item.name}
                            imageUrl={item.imageUrl}
                            imageKey={item.imageKey}
                            onPress={() => router.push(`/categories/${item.id}`)}
                          />
                        )}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  navbar: {
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  navbarInner: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  brandImage: {
    width: "100%",
    height: "100%",
  },
  brandText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  navIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navIconButton: {
    padding: 6,
  },
  navIcon: {
    fontSize: 18,
  },
  navBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  sheetHandle: {
    alignSelf: "center",
    marginBottom: 8,
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  sheetCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#9333ea",
    letterSpacing: 0.8,
  },
  sheetTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  sheetClose: {
    fontSize: 12,
    color: "#9ca3af",
  },
  locationButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#9333ea",
    borderRadius: 999,
    paddingVertical: 12,
  },
  locationButtonDisabled: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#9333ea",
    borderRadius: 999,
    paddingVertical: 12,
    opacity: 0.6,
  },
  locationButtonIcon: {
    fontSize: 16,
    color: "#7e22ce",
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7e22ce",
  },
  sheetDivider: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  sheetDividerText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#9ca3af",
  },
  addressInputWrapper: {
    marginTop: 16,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  addressSuggestions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 56,
    marginBottom: 8,
    maxHeight: 256,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    zIndex: 50,
  },
  addressSuggestionsScroll: {
    maxHeight: 256,
  },
  addressSuggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addressSuggestionText: {
    fontSize: 14,
    color: "#111827",
  },
  addressError: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#b91c1c",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroRow: {
    marginTop: 24,
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ede9fe",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  locationIconCircle: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  locationIcon: {
    fontSize: 16,
    color: "#7e22ce",
  },
  locationTextCol: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#9ca3af",
  },
  locationValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    maxWidth: 160,
  },
  locationSubLabel: {
    fontSize: 11,
    color: "#6b7280",
    maxWidth: 160,
  },
  searchWrapper: {
    position: "relative",
  },
  searchInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchClear: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  searchClearText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  searchSuggestions: {
    position: "absolute",
    top: 52,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 30,
  },
  searchSuggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchSuggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  searchSuggestionDescription: {
    marginTop: 2,
    fontSize: 11,
    color: "#6b7280",
  },
  section: {
    marginTop: 40,
  },
  sectionTitleWrapper: {
    marginBottom: 24,
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 3,
    color: "#a855f7",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  sectionAction: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionActionText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#7e22ce",
  },
  loadingGrid: {
    gap: 16,
  },
  loadingCard: {
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    overflow: "hidden",
  },
  loadingImage: {
    height: 112,
    backgroundColor: "#f3f4f6",
  },
  loadingContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  loadingLinePrimary: {
    height: 16,
    width: 112,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  loadingLineSecondary: {
    height: 12,
    width: 80,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  mainCategoryStack: {
    gap: 32,
  },
  mainCategoryBlock: {
    gap: 16,
  },
  mainCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mainCategoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  mainCategoryHighlight: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#9ca3af",
  },
  emptySubCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
  },
  categoryGridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryTileWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  categoryTileImageContainer: {
    width: "100%",
    alignItems: "center",
  },
  categoryTileImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryTileImage: {
    width: "70%",
    height: "70%",
    resizeMode: "contain",
  },
  categoryTileInitial: {
    fontSize: 24,
    fontWeight: "600",
    color: "#7e22ce",
  },
  categoryTileLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalClose: {
    fontSize: 14,
    color: "#9ca3af",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  formGroup: {
    marginTop: 16,
  },
  uploadButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#111827",
  },
  parcelRow: {
    marginTop: 8,
    gap: 8,
  },
  parcelOption: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  parcelOptionActive: {
    borderWidth: 1,
    borderColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#7c3aed",
  },
  parcelOptionText: {
    color: "#111827",
    fontSize: 14,
  },
  parcelOptionTextActive: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  instructionsInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  helpText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6b7280",
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#ef4444",
  },
  priceText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  successBanner: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#ecfdf3",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successText: {
    fontSize: 14,
    color: "#15803d",
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    marginTop: 24,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  timePickerWrapper: {
    marginTop: 16,
    gap: 12,
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 12,
  },
  timePickerButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  timePickerButtonIdle: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timePickerButtonActive: {
    backgroundColor: "#7c3aed",
  },
  timePickerButtonTextIdle: {
    color: "#111827",
    fontWeight: "500",
  },
  timePickerButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  selectWrapper: {
    gap: 8,
  },
  selectLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  timeOptionsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  timeOptionIdle: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeOptionActive: {
    borderWidth: 1,
    borderColor: "#7c3aed",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#7c3aed",
  },
  timeOptionTextIdle: {
    fontSize: 12,
    color: "#111827",
  },
  timeOptionTextActive: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  addressPickerWrapper: {
    marginTop: 16,
  },
  addressPickerSelected: {
    marginTop: 8,
  },
  addressPickerInputDisabled: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    fontSize: 14,
  },
  addressPickerReset: {
    position: "absolute",
    right: 8,
    top: 10,
  },
  addressPickerResetText: {
    color: "#6b7280",
  },
  addressPickerAddButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  addressPickerAddText: {
    fontSize: 14,
    color: "#6b7280",
  },
  addressPickerSearchWrapper: {
    marginTop: 8,
  },
  addressPickerInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addressPickerLoading: {
    position: "absolute",
    right: 12,
    top: 12,
    fontSize: 12,
    color: "#9ca3af",
  },
  addressPickerResults: {
    position: "absolute",
    top: 80,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 20,
  },
  addressPickerResultRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressPickerResultIcon: {
    color: "#7e22ce",
  },
  addressPickerResultText: {
    fontSize: 14,
    color: "#111827",
  },
  addressPickerManualButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressPickerManualIcon: {
    color: "#7e22ce",
  },
  addressPickerManualText: {
    fontSize: 14,
    color: "#7e22ce",
    fontWeight: "600",
  },
  addressPickerManualContainer: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 12,
    gap: 8,
  },
  addressPickerManualInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addressPickerPostcodeRow: {
    position: "relative",
    justifyContent: "center",
  },
  addressPickerPostcodeIconValid: {
    position: "absolute",
    right: 12,
    color: "#22c55e",
  },
  addressPickerPostcodeIconInvalid: {
    position: "absolute",
    right: 12,
    color: "#ef4444",
  },
  addressPickerConfirm: {
    borderRadius: 10,
    backgroundColor: "#7c3aed",
    paddingVertical: 10,
    alignItems: "center",
  },
  addressPickerConfirmDisabled: {
    borderRadius: 10,
    backgroundColor: "#7c3aed",
    paddingVertical: 10,
    alignItems: "center",
    opacity: 0.6,
  },
  addressPickerConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  addressPickerErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#ef4444",
  },
});
