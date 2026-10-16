"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems.filter((item) => item.primary);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
