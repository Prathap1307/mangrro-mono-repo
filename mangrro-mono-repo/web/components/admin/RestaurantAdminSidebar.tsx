"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiArrowLeft,
  FiBarChart2,
  FiClock,
  FiCoffee,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiLayers,
  FiList,
  FiPackage,
  FiPercent,
  FiTag,
  FiTruck,
  FiZap,
} from "react-icons/fi";

const navItems = [
  { href: "overview", label: "Info", icon: FiGrid },
  { href: "orders-report", label: "Orders report", icon: FiBarChart2 },
  { href: "todays-orders", label: "Todays orders", icon: FiClock },
  { href: "categories", label: "Categories", icon: FiTag },
  { href: "categories-schedule", label: "Categories schedule", icon: FiList },
  { href: "items", label: "Items", icon: FiPackage },
  { href: "addons-category", label: "Addons category", icon: FiLayers },
  { href: "addons-category-schedule", label: "Addons category schedule", icon: FiList },
  { href: "addons", label: "Addons", icon: FiLayers },
  { href: "surcharge", label: "Surcharge", icon: FiZap },
  { href: "delivery-charge", label: "Delivery charge", icon: FiTruck },
  { href: "offers", label: "Offers", icon: FiPercent },
  { href: "tax", label: "Tax", icon: FiFileText },
];

type Props = {
  restaurantName: string;
};

export default function RestaurantAdminSidebar({ restaurantName }: Props) {
  const pathname = usePathname();
  const baseHref = `/admin/${encodeURIComponent(restaurantName)}`;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 px-4 py-6 shadow-2xl md:static md:block">
      <div className="flex items-center gap-2 px-2 text-lg font-bold text-slate-900">
        <FiCoffee className="h-5 w-5 text-blue-600" />
        <span className="truncate">{restaurantName}</span>
      </div>
      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const href = `${baseHref}/${item.href}`;
          const active = pathname === href || pathname === baseHref && item.href === "overview";
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/admin/order-food"
          className="mt-6 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
        >
          <FiArrowLeft className="h-5 w-5" />
          Go back to admin
        </Link>
      </nav>
    </aside>
  );
}
