import type { ReactNode } from "react";

type StatCardProps = {
  readonly eyebrow: string;
  readonly children: ReactNode;
  readonly footnote?: ReactNode;
};

export function StatCard({ eyebrow, children, footnote }: StatCardProps) {
  return (
    <div className="card flex h-full flex-col">
      <p className="wordmark text-[0.7rem] text-[var(--ink-3)]">{eyebrow}</p>
      <div className="mt-4 flex-1">{children}</div>
      {footnote ? (
        <p className="mt-5 border-t border-[var(--rule)] pt-3 text-[0.78rem] leading-[1.6] text-[var(--ink-3)]">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
