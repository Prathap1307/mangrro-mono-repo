"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SectionTitle from "@/components/SectionTitle";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { useSafeUser } from "@/lib/auth/useSafeUser";

export default function AccountPage() {
  const { user } = useSafeUser();

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);

      // Fetch customer
      const customerRes = await fetch("/api/customer/me");
      const customerData = customerRes.ok ? await customerRes.json() : null;

      // Fetch orders
      const orderRes = await fetch("/api/customer/orders");
      const orderData = orderRes.ok ? await orderRes.json() : null;

      setCustomer(customerData);

      // Support both backend formats
      const list =
        orderData?.pastOrders ??
        orderData?.orders ??
        [];

      setOrders(list);
      setLoading(false);
    })();
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading account…
      </div>
    );

  if (!customer)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Failed to load account.
      </div>
    );

  const primaryAddress =
    customer.addresses?.find((a: any) => a.primary) ??
    customer.addresses?.[0] ??
    null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl p-6 lg:p-12 space-y-8">
        <SectionTitle eyebrow="Profile" title="Account" />

        <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
          <ProfileCard
            name={customer.name}
            email={customer.email}
            phone={customer.phone}
            address={primaryAddress}
          />

          {/* ORDER HISTORY */}
          <div className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Order History</h3>

            {orders.length === 0 ? (
              <p className="text-sm text-gray-600 mt-2">
                No past orders found.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {orders.map((o: any) => {
                  const isOpen = openOrder === o.id;
                  return (
                    <div
                      key={o.id}
                      className="border rounded-xl bg-gray-50 shadow-sm p-4"
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Order {o.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {o.customerEmail}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            Status: {o.status}
                          </p>
                        </div>

                        {/* Right side: Price + WhatsApp */}
                        <div className="flex items-center gap-4">
                          <p className="font-semibold text-sm">
                            £{o.orderTotal.toFixed(2)}
                          </p>

                          <a
                            href={`https://wa.me/447123456789?text=Hi, I need help with order ${o.id}`}
                            target="_blank"
                            className="text-green-600 text-2xl"
                          >
                            <FaWhatsapp />
                          </a>

                          <button
                            onClick={() =>
                              setOpenOrder(isOpen ? null : o.id)
                            }
                          >
                            {isOpen ? (
                              <IoChevronUp size={22} className="text-gray-600" />
                            ) : (
                              <IoChevronDown size={22} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-4"
                          >
                            {/* Order Items */}
                            <div className="space-y-2">
                              <p className="font-semibold text-gray-800">
                                Items:
                              </p>
                              {o.items.map((i: any, idx: number) => (
                                <p
                                  key={idx}
                                  className="text-sm text-gray-700"
                                >
                                  {i.name} × {i.quantity}
                                </p>
                              ))}
                            </div>

                            {/* Status Timeline */}
                            <div className="mt-4">
                              <p className="font-semibold text-gray-800 mb-1">
                                Status Timeline:
                              </p>

                              {[
                                "pending",
                                "accepted",
                                "preparing",
                                "completed",
                                "delivered",
                              ].map((step) => (
                                <p
                                  key={step}
                                  className={`text-sm capitalize ${
                                    step === o.status
                                      ? "text-indigo-600 font-semibold"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {step}
                                </p>
                              ))}
                            </div>

                            <Link
                              href={`/track?id=${o.id}`}
                              className="mt-4 inline-block text-sm text-indigo-600 underline"
                            >
                              Track Order →
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
