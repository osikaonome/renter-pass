import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/**
 * Primary actions for a flow. On phones it pins above the tab bar so the main
 * action is always under the thumb; from `lg` up it sits inline after the form.
 */
export function ActionBar({ children, className, aside }: { children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <div
      className={cn(
        "sticky z-20 -mx-4 mt-6 border-t border-hairline bg-surface/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6",
        "bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:mt-8 lg:rounded-lg lg:border lg:bg-surface lg:px-5 lg:shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {aside && <div className="hidden min-w-0 flex-1 text-sm text-muted sm:block">{aside}</div>}
        <div className={cn("flex flex-1 gap-2", aside ? "sm:flex-none" : "justify-end")}>{children}</div>
      </div>
    </div>
  );
}
