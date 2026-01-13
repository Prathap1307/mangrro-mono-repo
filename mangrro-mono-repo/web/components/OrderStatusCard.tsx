import { FiChevronRight } from 'react-icons/fi';

type OrderStatus =
  | 'Order Preparing'
  | 'Order Prepared'
  | 'Rider Arrived'
  | 'Rider Picked Order'
  | 'On The Way'
  | 'Delivered';

export interface OrderCard {
  id: string;
  itemsCount: number;
  total: number;
  status: OrderStatus;
}

const statusColor: Record<OrderStatus, string> = {
  'Order Preparing': 'bg-amber-100 text-amber-700',
  'Order Prepared': 'bg-emerald-100 text-emerald-700',
  'Rider Arrived': 'bg-sky-100 text-sky-700',
  'Rider Picked Order': 'bg-blue-100 text-blue-700',
  'On The Way': 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-purple-100 text-purple-700',
};

interface Props {
  order: OrderCard;
  onView: (order: OrderCard) => void;
}

export default function OrderStatusCard({ order, onView }: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Order #{order.id}</p>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[order.status]}`}>
            {order.status}
          </span>
          <p className="text-sm text-gray-500">{order.itemsCount} items</p>
        </div>
        <p className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p>
      </div>
      <button
        onClick={() => onView(order)}
        className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-purple-500 hover:text-purple-600"
      >
        View <FiChevronRight />
      </button>
    </div>
  );
}
