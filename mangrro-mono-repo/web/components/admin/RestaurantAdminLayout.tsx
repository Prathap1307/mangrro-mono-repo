"use client";

import AdminTopbar from "./AdminTopbar";
import RestaurantAdminSidebar from "./RestaurantAdminSidebar";

interface RestaurantAdminLayoutProps {
  restaurantName: string;
  children: React.ReactNode;
}

export default function RestaurantAdminLayout({
  restaurantName,
  children,
}: RestaurantAdminLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="flex">
        <RestaurantAdminSidebar restaurantName={restaurantName} />
        <div className="flex min-h-screen flex-1 flex-col md:pl-0">
          <AdminTopbar onMenuClick={() => {}} />
          <main className="mx-auto flex w-full max-w-screen-2xl flex-1 px-4 pb-10 mt-10 pt-20 md:px-8 md:pt-14">
            <div className="w-full space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
