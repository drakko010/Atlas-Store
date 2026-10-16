"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { navGroups, navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 flex w-[18rem] max-w-[85vw] flex-col bg-sidebar">
        <div className="flex items-center justify-between px-4 py-4">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2">
          {navGroups.map((group) => (
            <div key={group} className="mb-5">
              <p className="label-caps mb-2 px-2 text-sidebar-foreground/50">{group}</p>
              <ul className="space-y-0.5">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          href={item.to}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-sidebar-accent text-sidebar-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <p className="label-caps">Versão</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Base v0.1 — estrutura visual inicial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
