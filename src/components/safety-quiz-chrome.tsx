"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function QuizMasthead() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-sm transition-opacity duration-150 ease-out hover:opacity-80"
      >
        <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
        <span className="wordmark text-[0.78rem] text-[var(--ink)]">
          Polaris
        </span>
      </Link>
      <Link href="/" className="button button-link">
        <span className="button-icon" aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
        </span>
        <span>Home</span>
      </Link>
    </header>
  );
}

export function QuizColophon() {
  return (
    <footer className="mt-24 border-t border-[var(--rule)] pt-10">
      <div className="flex items-center gap-3">
        <StarMark className="h-3 w-3 text-[var(--clay)]" />
        <span className="wordmark text-[0.7rem] text-[var(--ink-2)]">
          Polaris
        </span>
      </div>
      <p className="mt-4 max-w-[58ch] text-[0.875rem] leading-[1.7] text-[var(--ink-3)]">
        A planning tool, not a verdict. Polaris offers structure for thinking
        through ordinary preparations. Your circumstances will always have
        details this tool cannot see.
      </p>
      <p className="mt-3 max-w-[58ch] text-[0.8rem] leading-[1.7] text-[var(--ink-3)]">
        What may leave: anonymous answer letters, score, and planning band.
        What does not: names, accounts, addresses, coordinates, or written
        details about you.
      </p>
    </footer>
  );
}

export function StarMark({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.6 L13.05 10.95 L22.4 12 L13.05 13.05 L12 22.4 L10.95 13.05 L1.6 12 L10.95 10.95 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function toRomanNumeral(value: number): string {
  const numerals = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ] as const;

  let remaining = value;
  let output = "";

  for (const [numeral, amount] of numerals) {
    while (remaining >= amount) {
      output += numeral;
      remaining -= amount;
    }
  }

  return output || String(value);
}
