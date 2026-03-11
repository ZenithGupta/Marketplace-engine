"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VendorRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { LayoutDashboard, Store, Package, ShoppingCart } from "lucide-react";
import { marketplaceConfig } from "@/config/marketplace.config";

export default function VendorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/vendor", icon: LayoutDashboard },
    { name: "My Products", href: "/vendor/products", icon: Package },
    { name: "Orders", href: "/vendor/orders", icon: ShoppingCart },
  ];

  return (
    <VendorRoute>
      <MainLayout>
        <div className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 px-2 py-4 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">Vendor Portal</h2>
                    <p className="text-xs text-muted-foreground">{marketplaceConfig.APP_NAME}</p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </MainLayout>
    </VendorRoute>
  );
}
