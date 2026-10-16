"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { navGroups, navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[4.5rem]" : "w-[16rem]",
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <BrandMark collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "hidden",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !collapsed && "hidden",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group} className="mb-5">
            {!collapsed && (
              <p className="label-caps mb-2 px-2 text-sidebar-foreground/50">{group}</p>
            )}
            <ul className="space-y-0.5">
              {navItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname === item.to;
                  return (
                    <li key={item.to}>
                      <Link
                        href={item.to}
                        title={item.title}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          collapsed && "justify-center",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <p className="label-caps">Versão</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Base v0.1 — estrutura visual inicial
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
