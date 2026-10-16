import { cn } from "@/lib/utils";

export function BrandMark({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground">
        A
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-bold tracking-tight">ATLAS STORE</p>
          <p className="label-caps truncate">Import &amp; Profit</p>
        </div>
      )}
    </div>
  );
}
