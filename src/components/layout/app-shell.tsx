"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { BrandMark } from "@/components/layout/brand-mark";
import { navItems } from "@/components/layout/nav-items";
import { ToastProvider } from "@/components/ui/toast";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = navItems.find((item) => item.to === pathname);

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur md:px-6">
            <div className="min-w-0 flex-1 md:hidden">
              <BrandMark />
            </div>
            <p className="hidden min-w-0 truncate font-display text-sm font-semibold md:block">
              {current?.title ?? "Atlas Store"}
            </p>
          </header>

          <main className="flex-1 px-4 pt-5 pb-24 md:px-6 md:py-8 md:pb-10">{children}</main>
        </div>

        <BottomNav />
      </div>
    </ToastProvider>
  );
}
