"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "@/components/icons";
import { IconButton, cn } from "@/components/ui";

/**
 * Bottom sheet on phones, centred dialog on larger screens. Built on <dialog>
 * so focus trapping, Escape and the backdrop come from the platform.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "m-0 mt-auto w-full max-w-none rounded-t-xl border border-hairline-strong bg-surface p-0 text-ink shadow-overlay backdrop:bg-scrim backdrop:backdrop-blur-sm",
        "sm:m-auto sm:max-w-md sm:rounded-xl",
        "open:animate-[sheet-in_180ms_ease-out]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-hairline py-1 pl-5 pr-2">
        <h2 className="text-subtitle font-semibold">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <XIcon />
        </IconButton>
      </div>
      <div className="max-h-[75dvh] overflow-y-auto safe-bottom">{children}</div>
    </dialog>
  );
}
