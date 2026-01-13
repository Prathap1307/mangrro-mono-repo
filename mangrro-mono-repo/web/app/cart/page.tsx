"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import SectionTitle from "@/components/SectionTitle";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";

import { useCart } from "@/components/context/CartContext";
import { useDelivery } from "@/components/context/DeliveryContext";

import {
  buildDeliveryQuote,
  type DeliveryQuote,
  type RadiusRule,
  type DeliveryChargeRule,
  type SurchargeRule,
} from "@/lib/deliveryPricing";
import { useSafeUser } from "@/lib/auth/useSafeUser";

type PaymentTokenResult = {
  status: string;
  token?: string;
  errors?: { message?: string }[];
};

type PaymentRequestOptions = {
  countryCode: string;
  currencyCode: string;
  total: { amount: string; label: string };
  requestBillingContact?: boolean;
};

type PaymentRequest = {
  update: (options: Partial<PaymentRequestOptions>) => void;
};

type WebPaymentMethod = {
  tokenize: (options?: Record<string, unknown>) => Promise<PaymentTokenResult>;
  attach: (selector: string) => Promise<HTMLElement | void>;
  canMakePayment?: () => Promise<boolean>;
  destroy?: () => void;
};

type SquarePayments = {
  paymentRequest: (options: PaymentRequestOptions) => PaymentRequest;
  card: () => Promise<WebPaymentMethod>;
  applePay: (request: PaymentRequest) => Promise<WebPaymentMethod>;
  googlePay: (request: PaymentRequest) => Promise<WebPaymentMethod>;
};

type FinderSuggestion = { id: string; label: string };

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string
      ) => Promise<SquarePayments>;
    };
  }
}

export default function CartPage() {
  const { items, increase, decrease, remove, subtotal, isItemAvailable } =
    useCart();
  const { address, setAddress } = useDelivery();
  const { user } = useSafeUser();

  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [, setDeliveryLoading] = useState(false);

  // Checkout / order creation
  const [creatingOrder, setCreatingOrder] = useState(false);

  const { clear } = useCart();

  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APP_ID?.trim();
  const [locationId, setLocationId] = useState<string | null>(null);

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [cardPayment, setCardPayment] = useState<WebPaymentMethod | null>(null);
  const [applePay, setApplePay] = useState<WebPaymentMethod | null>(null);
  const [googlePay, setGooglePay] = useState<WebPaymentMethod | null>(null);
  const [applePayReady, setApplePayReady] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [squareReady, setSquareReady] = useState(false);
  const squareInitializedRef = useRef(false);

  const cardPaymentRef = useRef<WebPaymentMethod | null>(null);
  const applePayRef = useRef<WebPaymentMethod | null>(null);
  const googlePayRef = useRef<WebPaymentMethod | null>(null);
  const handleApplePayClickRef = useRef<((event?: Event) => void) | null>(null);
  const handleGooglePayClickRef = useRef<((event?: Event) => void) | null>(null);

  const applePayButtonRef = useRef<HTMLElement | null>(null);
  const googlePayButtonRef = useRef<HTMLElement | null>(null);


  /* --------------------------------------------------------------------
     ADDRESS FINDER SHEET STATE (NO GEOLOCATION)
  -------------------------------------------------------------------- */
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderInput, setFinderInput] = useState("");
  const [finderSuggestions, setFinderSuggestions] = useState<
    FinderSuggestion[]
  >([]);
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState("");

  /* Editable form fields */
  const [editLine1, setEditLine1] = useState("");
  const [editLine2, setEditLine2] = useState("");
  const [editTown, setEditTown] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editLat, setEditLat] = useState<number | undefined>();
  const [editLng, setEditLng] = useState<number | undefined>();

  /* --------------------------------------------------------------------
     DELIVERY OPTIONS
  -------------------------------------------------------------------- */
  type DeliveryMethod = "leave_at_door" | "hand_to_me" | "meet_outside";
  type DeliveryPlace = "home" | "office" | "other";

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("leave_at_door");
  const [deliveryPlace, setDeliveryPlace] = useState<DeliveryPlace>("home");

  /* --------------------------------------------------------------------
     LOAD ADDRESS INTO EDITOR WHEN FINDER OPENS
  -------------------------------------------------------------------- */
  useEffect(() => {
    if (!finderOpen) return;

    setFinderError("");
    setFinderInput(address?.postcode ?? "");
    setEditLine1(address?.line1 ?? "");
    setEditLine2(address?.line2 ?? "");
    setEditTown(address?.town ?? "");
    setEditPostcode(address?.postcode ?? "");
    setEditLat(address?.latitude);
    setEditLng(address?.longitude);
  }, [finderOpen, address]);

  /* --------------------------------------------------------------------
     IDEAL POSTCODES AUTOCOMPLETE
  -------------------------------------------------------------------- */
  useEffect(() => {
    if (!finderOpen) return;

    if (finderInput.trim().length < 3) {
      setFinderSuggestions([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setFinderLoading(true);

        const res = await fetch(
          `/api/address/search?q=${encodeURIComponent(finderInput)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;

        const data = await res.json();
        const suggestions = Array.isArray(data.suggestions)
          ? (data.suggestions as FinderSuggestion[])
          : [];

        if (!cancelled) setFinderSuggestions(suggestions);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        if (!cancelled) setFinderLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [finderInput, finderOpen]);

  /* --------------------------------------------------------------------
     SELECT AUTOCOMPLETE SUGGESTION → FILL FIELDS
  -------------------------------------------------------------------- */
  const chooseSuggestion = async (s: FinderSuggestion) => {
    try {
      setFinderLoading(true);
      setFinderError("");

      const res = await fetch(`/api/address/details?id=${s.id}`);
      const data = await res.json();
      if (!data.address) {
        setFinderError("Could not retrieve full address details.");
        return;
      }

      const a = data.address;

      setEditLine1(a.line1 ?? "");
      setEditLine2(a.line2 ?? "");
      setEditTown(a.town ?? "");
      setEditPostcode(a.postcode ?? "");
      setEditLat(a.latitude);
      setEditLng(a.longitude);
      setFinderInput(a.postcode ?? "");
      setFinderSuggestions([]);
    } catch (err) {
      console.error("Cart suggestion select error:", err);
      setFinderError("Something went wrong selecting this address.");
    } finally {
      setFinderLoading(false);
    }
  };

  /* --------------------------------------------------------------------
     MANUAL ENTRY → TRY TO GET COORDS
  -------------------------------------------------------------------- */
  const resolveCoordsIfMissing = async () => {
    if (typeof editLat === "number" && typeof editLng === "number") return;

    const query = `${editLine1} ${editTown} ${editPostcode}`.trim();
    if (query.length < 5) return;

    try {
      const res = await fetch(
        `/api/address/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const first = data.suggestions?.[0];
      if (!first) return;

      const detailsRes = await fetch(`/api/address/details?id=${first.id}`);
      const details = await detailsRes.json();
      if (!details.address) return;

      const a = details.address;
      if (typeof a.latitude === "number" && typeof a.longitude === "number") {
        setEditLat(a.latitude);
        setEditLng(a.longitude);
      }
    } catch (err) {
      console.error("Manual address coord resolve failed:", err);
    }
  };

  /* --------------------------------------------------------------------
     SAVE ADDRESS FROM FINDER
  -------------------------------------------------------------------- */
  const saveFinderAddress = async () => {
    setFinderError("");

    if (!editLine1.trim() || !editTown.trim() || !editPostcode.trim()) {
      setFinderError("Please complete address line 1, town and postcode.");
      return;
    }

    await resolveCoordsIfMissing();

    const finalAddress = {
      line1: editLine1.trim(),
      line2: editLine2.trim() || undefined,
      town: editTown.trim(),
      postcode: editPostcode.trim().toUpperCase(),
      latitude: editLat,
      longitude: editLng,
    };

    setAddress(finalAddress);
    setFinderOpen(false);
  };

  /* --------------------------------------------------------------------
     DELIVERY PRICING WHEN ADDRESS OR ITEMS CHANGE
  -------------------------------------------------------------------- */
  useEffect(() => {
    if (!address) {
      setDeliveryQuote(null);
      return;
    }

    if (typeof address.latitude !== "number" || typeof address.longitude !== "number") {
      setDeliveryQuote(null);
      return;
    }

    if (items.length === 0) {
      setDeliveryQuote(null);
      return;
    }

    setDeliveryLoading(true);

    (async () => {
      try {
        const [radiusRes, chargeRes, surchargeRes] = await Promise.all([
          fetch("/api/radius"),
          fetch("/api/delivery-charges"),
          fetch("/api/surcharge"),
        ]);

        const [radiusJson, chargesJson, surchargeJson] = await Promise.all([
          radiusRes.json(),
          chargeRes.json(),
          surchargeRes.json(),
        ]);

        const radiusRules = radiusJson as RadiusRule[];
        const chargeRules = chargesJson as DeliveryChargeRule[];
        const surchargeRules = surchargeJson as SurchargeRule[];

        const quote = buildDeliveryQuote(
          address,
          radiusRules,
          chargeRules,
          surchargeRules
        );

        setDeliveryQuote(quote);
      } catch (err) {
        console.error("Delivery pricing error", err);
        setDeliveryQuote(null);
      } finally {
        setDeliveryLoading(false);
      }
    })();
  }, [address, items.length]);

  /* --------------------------------------------------------------------
     TOTALS
  -------------------------------------------------------------------- */
  const tax = subtotal * 0.08;
  const delivery = deliveryQuote?.totalDelivery ?? 0;
  const total = subtotal + tax + delivery;

  const customerEmail =
    user?.primaryEmailAddress?.emailAddress || "unknown@example.com";

  const customerName =
    user?.fullName ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    "Guest";

  const addressIncomplete =
    !address || !address.line1 || !address.postcode || !address.town;
  const addressIncompleteRef = useRef(addressIncomplete);
  const itemsLengthRef = useRef(items.length);
  const totalRef = useRef(total);

  useEffect(() => {
    cardPaymentRef.current = cardPayment;
  }, [cardPayment]);

  useEffect(() => {
    applePayRef.current = applePay;
  }, [applePay]);

  useEffect(() => {
    googlePayRef.current = googlePay;
  }, [googlePay]);

  useEffect(() => {
    addressIncompleteRef.current = addressIncomplete;
    itemsLengthRef.current = items.length;
  }, [addressIncomplete, items.length]);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  /* --------------------------------------------------------------------
     SQUARE WEB PAYMENTS SDK
  -------------------------------------------------------------------- */
  const explicitSquareEnv = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT?.trim().toLowerCase();
  const squareEnvironment =
    explicitSquareEnv === "production" || explicitSquareEnv === "sandbox"
      ? explicitSquareEnv
      : applicationId?.startsWith("sandbox-")
      ? "sandbox"
      : applicationId
      ? "production"
      : process.env.NODE_ENV === "production"
      ? "production"
      : "sandbox";

  const squareSdkUrl =
    squareEnvironment === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";



  const loadSquareScript = useCallback(async () => {
    if (typeof window === "undefined") return;
    const existingScript = document.getElementById("square-payments-script");
    if (existingScript) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "square-payments-script";
      script.src = squareSdkUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Square Web Payments SDK."));

      document.head.appendChild(script);
    });
  }, [squareSdkUrl]);

  const processSquarePayment = useCallback(
    async (sourceId: string) => {
      const amount = total;

      if (!amount || amount <= 0) {
        throw new Error("Invalid order total for payment.");
      }

      const res = await fetch("/api/square/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount,
          currency: "GBP",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok || !data.paymentId) {
        throw new Error(data?.error || "Payment could not be completed.");
      }

      return { id: data.paymentId as string, status: data.status as string };
    },
    [total]
  );

  const createOrderRecord = useCallback(
    async (paymentId?: string) => {
      /* -------------------------------------------
         Fetch REAL customer phone
      ------------------------------------------- */
      let customerPhone = "N/A";

      try {
        const phoneRes = await fetch(
          `/api/customer/lookup?email=${encodeURIComponent(customerEmail)}`
        );

        if (phoneRes.ok) {
          const phoneData = await phoneRes.json();

          if (phoneData.phone) {
            customerPhone = phoneData.phone;
          }
        }
      } catch (err) {
        console.error("Phone lookup failed:", err);
      }

      /* -------------------------------------------
         Drop location
      ------------------------------------------- */
      const dropLocation = [
        address?.line1,
        address?.line2,
        address?.town,
        address?.postcode,
      ]
        .filter(Boolean)
        .join(", ");

      /* -------------------------------------------
         Delivery notes outside items
      ------------------------------------------- */
      const notes = [
        deliveryMethod === "leave_at_door"
          ? "Leave at the door"
          : deliveryMethod === "hand_to_me"
          ? "Hand it to me"
          : "I'll meet the driver outside",
        deliveryPlace === "home"
          ? "Home"
          : deliveryPlace === "office"
          ? "Office"
          : "Other",
      ].join(" · ");

      /* -------------------------------------------
         Items (NO notes inside)
      ------------------------------------------- */
      const orderItems = items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      /* -------------------------------------------
         Surcharge total
      ------------------------------------------- */
      const surchargeTotal =
        deliveryQuote?.surcharges?.reduce(
          (sum, s) => sum + (s.price ?? 0),
          0
        ) ?? 0;

      /* -------------------------------------------
         CREATE ORDER
      ------------------------------------------- */
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          restaurantName: "Delivery Star",
          instorePickup: false,
          pickupLocation: "Restaurant HQ",
          dropLocation,
          items: orderItems,
          notes,
          orderTotal: total,
          deliveryCharge: delivery,
          surcharge: surchargeTotal,
          tax,
          status: "pending",
          paymentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Order create failed:", data);
        throw new Error("Failed to place your order.");
      }

      // ✅ Clear in context
      clear();

      // ✅ Also clear in localStorage so it stays empty after reload
      try {
        localStorage.removeItem("cart");
      } catch (e) {
        console.error("Failed to clear cart from localStorage", e);
      }

      window.location.href = `/order-success?id=${data.id}`;
    },
    [
      address?.line1,
      address?.line2,
      address?.postcode,
      address?.town,
      clear,
      customerEmail,
      customerName,
      delivery,
      deliveryMethod,
      deliveryPlace,
      deliveryQuote?.surcharges,
      items,
      tax,
      total,
    ]
  );

  const completePaymentFlow = useCallback(
    async (
      tokenizeFn: () => Promise<PaymentTokenResult>,
      methodType: string
    ) => {
      setPaymentError(null);
      setPaymentSuccess(null);
      setCreatingOrder(true);

      try {
        const result = await tokenizeFn();

        if (result?.status !== "OK" || !result?.token) {
          throw new Error(
            result?.errors?.[0]?.message ||
              "Unable to tokenize this payment method."
          );
        }

        const payment = await processSquarePayment(result.token);
        setPaymentSuccess(
          `Payment authorized in Square sandbox via ${methodType}.`
        );

        await createOrderRecord(payment.id);
      } catch (err: unknown) {
        console.error("Payment flow error:", err);
        const message =
          err instanceof Error ? err.message : "Payment failed. Please try again.";
        setPaymentError(message);
        throw err;
      } finally {
        setCreatingOrder(false);
      }
    },
    [createOrderRecord, processSquarePayment]
  );

  const handleCheckout = async () => {
    if (addressIncomplete) {
      setPaymentError("Add a delivery address before paying.");
      return;
    }
    if (items.length === 0) return;
    const cardMethod = cardPaymentRef.current;
    if (!squareReady || !cardMethod) {
      setPaymentError("Payment methods are still loading. Please wait.");
      return;
    }

    try {
      await completePaymentFlow(() => cardMethod.tokenize(), "CARD");
    } catch {
      // handled in completePaymentFlow
    }
  };

  const handleApplePayClick = useCallback(
    async (event?: Event) => {
      event?.preventDefault();
      const method = applePayRef.current;
      if (!method || addressIncompleteRef.current || itemsLengthRef.current === 0)
        return;

      try {
        await completePaymentFlow(() => method.tokenize(), "APPLE_PAY");
      } catch {
        // handled in flow
      }
    },
    [completePaymentFlow]
  );

  const handleGooglePayClick = useCallback(
    async (event?: Event) => {
      event?.preventDefault();
      const method = googlePayRef.current;
      if (
        !method ||
        addressIncompleteRef.current ||
        itemsLengthRef.current === 0
      )
        return;

      try {
        await completePaymentFlow(() => method.tokenize(), "GOOGLE_PAY");
      } catch {
        // handled in flow
      }
    },
    [completePaymentFlow]
  );

  useEffect(() => {
    handleApplePayClickRef.current = handleApplePayClick;
  }, [handleApplePayClick]);

  useEffect(() => {
    handleGooglePayClickRef.current = handleGooglePayClick;
  }, [handleGooglePayClick]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!applicationId) {
      setPaymentError(
        "Square payments are not configured. Please set NEXT_PUBLIC_SQUARE_APP_ID."
      );
      return;
    }

    if (locationId) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchLocationId = async () => {
      try {
        setPaymentError(null);
        setPaymentsLoading(true);
        const res = await fetch("/api/square/location", {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok || !data?.locationId) {
          throw new Error(data?.error || "Unable to load Square location.");
        }

        if (!cancelled) setLocationId(data.locationId);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Square location fetch error:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Square location.";
        setPaymentError(message);
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    };

    fetchLocationId();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applicationId, locationId]);

  useEffect(() => {
    if (!applicationId || !locationId) return;

    if (typeof window === "undefined") return;

    if (squareInitializedRef.current) return;

    squareInitializedRef.current = true;

    let cancelled = false;
    let localCard: WebPaymentMethod | null = null;
    let localApple: WebPaymentMethod | null = null;
    let localGoogle: WebPaymentMethod | null = null;
    let appleListener: ((event: Event) => void) | null = null;
    let googleListener: ((event: Event) => void) | null = null;

    const initialize = async () => {
      try {
        setPaymentsLoading(true);
        await loadSquareScript();

        const square = window.Square;

        if (!square?.payments) {
          throw new Error("Square Web Payments SDK unavailable.");
        }

        const payments = await square.payments(applicationId, locationId);
        if (cancelled) return;
        const request = payments.paymentRequest({
          countryCode: "GB",
          currencyCode: "GBP",
          total: {
            amount: totalRef.current.toFixed(2),
            label: "Order total",
          },
          requestBillingContact: true,
        });

        setPaymentRequest(request);

        localCard = await payments.card();
        await localCard.attach("#card-container");

        if (cancelled) {
          localCard?.destroy?.();
          return;
        }

        setCardPayment(localCard);

        try {
          localApple = await payments.applePay(request);
          const appleAvailable =
            (await localApple?.canMakePayment?.()) ?? false;

          if (appleAvailable && localApple) {
            const appleButton = await localApple.attach("#apple-pay-button");
            applePayButtonRef.current = appleButton ?? null;
            appleListener = (event: Event) =>
              handleApplePayClickRef.current?.(event);
            appleButton?.addEventListener("click", appleListener);

            setApplePay(localApple);
            setApplePayReady(true);
          }
        } catch (err) {
          console.warn("Apple Pay unavailable:", err);
        }

        try {
          localGoogle = await payments.googlePay(request);
          const googleAvailable =
            (await localGoogle?.canMakePayment?.()) ?? false;

          if (googleAvailable && localGoogle) {
            const googleButton = await localGoogle.attach("#google-pay-button");
            googlePayButtonRef.current = googleButton ?? null;
            googleListener = (event: Event) =>
              handleGooglePayClickRef.current?.(event);
            googleButton?.addEventListener("click", googleListener);

            setGooglePay(localGoogle);
            setGooglePayReady(true);
          }
        } catch (err) {
          console.warn("Google Pay unavailable:", err);
        }

        setSquareReady(true);
        setPaymentError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Square init error:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Unable to initialise payment methods right now.";
        setPaymentError(message);
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      squareInitializedRef.current = false;
      if (appleListener) {
        applePayButtonRef.current?.removeEventListener("click", appleListener);
      }
      if (googleListener) {
        googlePayButtonRef.current?.removeEventListener("click", googleListener);
      }

      localCard?.destroy?.();
      localApple?.destroy?.();
      localGoogle?.destroy?.();
    };
  }, [applicationId, loadSquareScript, locationId]);

  useEffect(() => {
    if (!paymentRequest) return;

    try {
      paymentRequest.update({
        total: {
          amount: total.toFixed(2),
          label: "Order total",
        },
      });
    } catch (err) {
      console.error("Payment request update failed:", err);
    }
  }, [paymentRequest, total]);



  /* --------------------------------------------------------------------
     RENDER
  -------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-full space-y-10 p-6 lg:p-12 xl:p-16">
        <SectionTitle eyebrow="Your bag" title="Cart" />

        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add chef specials, drinks or essentials."
            ctaLabel="Browse products"
            ctaHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr] lg:items-start">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              {/* CART ITEMS */}
              <div className="space-y-6 rounded-3xl bg-white p-6 shadow-md">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    isAvailable={isItemAvailable(item.id)}
                    onIncrease={increase}
                    onDecrease={decrease}
                    onRemove={remove}
                  />
                ))}
              </div>

              {/* DELIVERY ADDRESS + OPTIONS */}
              <div className="rounded-3xl bg-white p-6 shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    Delivering to
                  </h3>

                  <button
                    type="button"
                    onClick={() => setFinderOpen(true)}
                    className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Use address finder / Change
                  </button>
                </div>

                {!address && (
                  <p className="mt-3 text-xs text-red-600">
                    No delivery address selected yet.
                  </p>
                )}

                {address && (
                  <>
                    <div className="mt-4 space-y-4">
                      <InputField
                        label="Address line 1 (required)"
                        value={address.line1}
                        onChange={(v) =>
                          setAddress({
                            ...address,
                            line1: v,
                          })
                        }
                        placeholder="Door number and street"
                      />

                      <InputField
                        label="Town / City (required)"
                        value={address.town}
                        onChange={(v) =>
                          setAddress({
                            ...address,
                            town: v,
                          })
                        }
                        placeholder="Luton"
                      />

                      <InputField
                        label="Postcode (required)"
                        value={address.postcode}
                        onChange={(v) =>
                          setAddress({
                            ...address,
                            postcode: v.toUpperCase(),
                          })
                        }
                        placeholder="LU1 2AB"
                      />

                      {addressIncomplete && (
                        <p className="text-xs mt-1 text-red-600">
                          Please complete your full address before checking out.
                        </p>
                      )}
                    </div>

                    {/* DELIVERY OPTIONS */}
                    <div className="mt-6 border-t border-gray-100 pt-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Delivery instructions
                        </p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <DeliveryOptionPill
                            label="Leave at the door"
                            active={deliveryMethod === "leave_at_door"}
                            onClick={() =>
                              setDeliveryMethod("leave_at_door")
                            }
                          />
                          <DeliveryOptionPill
                            label="Hand it to me"
                            active={deliveryMethod === "hand_to_me"}
                            onClick={() => setDeliveryMethod("hand_to_me")}
                          />
                          <DeliveryOptionPill
                            label="I'll meet the driver outside"
                            active={deliveryMethod === "meet_outside"}
                            onClick={() =>
                              setDeliveryMethod("meet_outside")
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Delivery location
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <DeliveryTag
                            label="Home"
                            active={deliveryPlace === "home"}
                            onClick={() => setDeliveryPlace("home")}
                          />
                          <DeliveryTag
                            label="Office"
                            active={deliveryPlace === "office"}
                            onClick={() => setDeliveryPlace("office")}
                          />
                          <DeliveryTag
                            label="Other"
                            active={deliveryPlace === "other"}
                            onClick={() => setDeliveryPlace("other")}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SIDE — SUMMARY */}
            <div className="sticky top-28 space-y-6 rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900">
                Order summary
              </h3>

              <div className="space-y-2 text-sm text-gray-600">
                <SummaryRow label="Subtotal" value={subtotal} />
                <SummaryRow label="Tax (8%)" value={tax} />

                <SummaryRow
                  label="Base delivery charge"
                  value={delivery}
                />

                {deliveryQuote?.surcharges?.map((s) => (
                  <SummaryRow
                    key={s.surchargeId ?? s.id}
                    label={`Surcharge: ${s.reason}`}
                    value={s.price}
                    red
                  />
                ))}

                <SummaryRow
                  label="Total delivery cost"
                  value={delivery}
                  bold
                />
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                {paymentsLoading && (
                  <p className="text-xs text-gray-500">
                    Preparing secure payment methods…
                  </p>
                )}

                {paymentError && (
                  <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
                    {paymentError}
                  </p>
                )}

                {paymentSuccess && (
                  <p className="rounded-2xl bg-green-50 px-3 py-2 text-xs text-green-700">
                    {paymentSuccess}
                  </p>
                )}

                {applePayReady && (
                  <div id="apple-pay-button" className="w-full" />
                )}

                {googlePayReady && (
                  <div id="google-pay-button" className="w-full" />
                )}

                <div
                  id="card-container"
                  className="rounded-2xl border border-gray-200 p-4"
                />
              </div>

              <button
                disabled={addressIncomplete || creatingOrder || paymentsLoading}
                onClick={handleCheckout}
                className={`w-full rounded-full px-6 py-4 text-lg font-semibold shadow-lg transition ${
                  addressIncomplete || creatingOrder || paymentsLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {addressIncomplete
                  ? "Complete address to continue"
                  : creatingOrder
                  ? "Placing your order…"
                  : "Proceed to checkout"}
              </button>

              <p className="text-xs text-gray-500">
                Payments are processed securely with Square sandbox.
              </p>

              <Link
                href="/"
                className="block text-center text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                Continue browsing
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ADDRESS FINDER BOTTOM SHEET (NO LOCATION SERVICES) */}
      {finderOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-white/70" />

          <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  Update delivery address
                </p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">
                  Use address finder or enter manually
                </h2>
              </div>

              <button
                onClick={() => setFinderOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            {/* Finder input */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Search by postcode or address
              </label>
              <div className="relative">
                <input
                  value={finderInput}
                  onChange={(e) => setFinderInput(e.target.value)}
                  placeholder="Start typing your postcode"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />

                {finderLoading && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    Searching…
                  </div>
                )}

                {finderSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
                    {finderSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => chooseSuggestion(s)}
                        className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manual fields */}
            <div className="mt-4 space-y-3">
              <InputField
                label="Address line 1 (door number & street) *"
                value={editLine1}
                onChange={setEditLine1}
                placeholder="e.g. 12 Greenways"
              />

              <InputField
                label="Address line 2 (optional)"
                value={editLine2}
                onChange={setEditLine2}
                placeholder="Flat, building, company…"
              />

              <div className="flex gap-3">
                <InputField
                  label="Town / City *"
                  value={editTown}
                  onChange={setEditTown}
                  placeholder="Luton"
                />

                <InputField
                  label="Postcode *"
                  value={editPostcode}
                  onChange={(v) => setEditPostcode(v.toUpperCase())}
                  placeholder="LU1 2AB"
                />
              </div>
            </div>

            <button
              onClick={saveFinderAddress}
              className="mt-4 w-full rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-700"
            >
              Save address
            </button>

            {finderError && (
              <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {finderError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* SUMMARY ROW COMPONENT */
function SummaryRow({
  label,
  value,
  bold,
  red,
}: {
  label: string;
  value: number;
  bold?: boolean;
  red?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={red ? "text-red-600" : ""}>{label}</span>
      <span
        className={`${bold ? "font-semibold" : ""} ${
          red ? "text-red-600" : ""
        }`}
      >
        £{value.toFixed(2)}
      </span>
    </div>
  );
}

/* GENERIC INPUT FIELD */
function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
      />
    </div>
  );
}

/* DELIVERY OPTIONS PILLS */

function DeliveryOptionPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-3 py-2 text-xs sm:text-sm text-left transition border ${
        active
          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function DeliveryTag({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs sm:text-sm font-medium border transition ${
        active
          ? "border-purple-600 bg-purple-50 text-purple-700"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
