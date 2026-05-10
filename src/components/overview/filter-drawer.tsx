"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type FilterDrawerProps = {
  readonly children: ReactNode;
  readonly activeCount: number;
};

export function FilterDrawer({ children, activeCount }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOpen(false);
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const triggerLabel =
    activeCount > 0 ? `Filters (${activeCount})` : "Filters";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="button button-secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="button-icon" aria-hidden="true">
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span>{triggerLabel}</span>
      </button>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          aria-label="Close filters"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="absolute inset-0 cursor-default bg-[oklch(22%_0.024_250_/_0.32)]"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard filters"
          className={`absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-[var(--paper)] shadow-[-12px_0_32px_oklch(22%_0.024_250_/_0.18)] transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-4 sm:px-6">
            <h2 className="wordmark text-[0.78rem] text-[var(--ink-2)]">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="-mr-1 rounded-sm p-1 text-[var(--ink-3)] transition-colors duration-150 ease-out hover:bg-[var(--paper-deep)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </header>
          {children}
        </aside>
      </div>
    </>
  );
}
