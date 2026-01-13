"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiAlertTriangle,
  FiBox,
  FiClock,
  FiDollarSign,
  FiGrid,
  FiList,
  FiLogOut,
  FiMapPin,
  FiSettings,
  FiTag,
  FiX,
} from "react-icons/fi";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/admin/orders", label: "All Orders", icon: FiList },
  { href: "/admin/main-categories", label: "Main Categories", icon: FiTag },
  { href: "/admin/main-category-scheduler", label: "Main Category Scheduler", icon: FiClock },
  { href: "/admin/categories", label: "Categories", icon: FiTag },
  { href: "/admin/category-scheduler", label: "Category Scheduler", icon: FiClock },
  { href: "/admin/subcategories", label: "Sub Categories", icon: FiTag },
  { href: "/admin/subcategory-scheduler", label: "Sub Category Scheduler", icon: FiClock },
  { href: "/admin/items", label: "Items", icon: FiBox },
  { href: "/admin/item-scheduler", label: "Item Scheduler", icon: FiSettings },
  { href: "/admin/radius", label: "Radius", icon: FiMapPin },
  { href: "/admin/delivery-charges", label: "Delivery Charge", icon: FiDollarSign },
  { href: "/admin/surcharge", label: "Surchargee", icon: FiAlertTriangle },
  { href: "/admin/logout", label: "Logout", icon: FiLogOut },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white/95 px-4 py-6 shadow-2xl transition duration-300 md:static md:block md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      <div className="flex items-center justify-between px-2">
        <div className="text-lg font-bold text-slate-900">Delivery Star Admin</div>
        <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 md:hidden" aria-label="Close menu">
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
      </nav>
    </aside>
  );
}

export default AdminSidebar;
