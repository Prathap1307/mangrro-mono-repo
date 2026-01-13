'use client';

import { useState } from 'react';
import ProfileCard from '@/components/ProfileCard';
import SectionTitle from '@/components/SectionTitle';
import OrderStatusCard, { type OrderCard } from '@/components/OrderStatusCard';
import EmptyState from '@/components/EmptyState';

const orders: OrderCard[] = [
  { id: '7842', itemsCount: 4, total: 58, status: 'Order Preparing' },
  { id: '6520', itemsCount: 2, total: 27, status: 'Rider Arrived' },
  { id: '5981', itemsCount: 3, total: 42, status: 'On The Way' },
  { id: '4308', itemsCount: 1, total: 12, status: 'Delivered' },
];

export default function AccountPageClient() {
  const [selectedOrder, setSelectedOrder] = useState<OrderCard | null>(null);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Profile" title="Account" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
        <ProfileCard name="Jordan Rivers" email="jordan.rivers@example.com" phone="(555) 918-4400" />
        <div className="rounded-3xl bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-900">Membership</h3>
          <p className="mt-2 text-sm text-gray-600">
            Enjoy free deliveries over $25, priority rider dispatch, and VIP support on every order.
          </p>
          <button className="mt-4 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700">
            Upgrade to Platinum
          </button>
        </div>
      </div>

      <SectionTitle eyebrow="Orders" title="Status timeline" />
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Place your first order to track its journey from kitchen to doorstep."
          ctaLabel="Start ordering"
          ctaHref="/"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderStatusCard key={order.id} order={order} onView={setSelectedOrder} />
          ))}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">Help & Support</h3>
        <p className="mt-2 text-sm text-gray-600">
          Reach our support team 24/7 via chat or email for delivery issues, refunds, or special requests.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:border-purple-500 hover:text-purple-600">
            Chat with us
          </button>
          <button className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700">
            Email support
          </button>
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {selectedOrder.itemsCount} items · ${selectedOrder.total.toFixed(2)} · {selectedOrder.status}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              This is a placeholder modal. Integrate your order details or tracking steps here.
            </p>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
