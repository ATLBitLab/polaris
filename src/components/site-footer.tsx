import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--rule)] pt-10">
      <div className="flex items-center gap-3">
        <StarMark className="h-3 w-3 text-[var(--clay)]" />
        <span className="wordmark text-[0.7rem] text-[var(--ink-2)]">
          Polaris
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[0.78rem] text-[var(--ink-3)]">
        <p>
          Built during the{" "}
          <a
            href="https://hrf.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--rule-strong)] underline-offset-[4px] hover:text-[var(--ink-2)]"
          >
            Human Rights Foundation
          </a>
          &rsquo;s Hack for Freedom Event.
        </p>
        <Link
          href="/research"
          className="underline decoration-[var(--rule-strong)] underline-offset-[4px] hover:text-[var(--ink-2)]"
        >
          Researcher access
        </Link>
      </div>
    </footer>
  );
}

function StarMark({ className = "" }: { readonly className?: string }) {
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
