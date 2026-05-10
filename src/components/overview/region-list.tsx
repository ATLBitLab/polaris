import type { RegionAggregate } from "@/lib/incident-overview";

type RegionListProps = {
  readonly regions: readonly RegionAggregate[];
};

const dangerLabel: Record<RegionAggregate["worstDanger"], string> = {
  high: "Immediate attention",
  mid: "Danger within a week",
  low: "Not immediate",
  untriaged: "Untriaged",
};

const dangerFill: Record<RegionAggregate["worstDanger"], string> = {
  high: "var(--risk-high)",
  mid: "var(--risk-mid)",
  low: "var(--risk-low)",
  untriaged: "var(--risk-untriaged)",
};

export function RegionList({ regions }: RegionListProps) {
  if (regions.length === 0) {
    return (
      <p className="text-[0.95rem] leading-relaxed text-[var(--ink-3)]">
        No regional data yet.
      </p>
    );
  }

  const max = Math.max(...regions.map((region) => region.count), 1);

  return (
    <ol className="border-t border-[var(--rule)]">
      {regions.map((region, index) => {
        const pct = Math.round((region.count / max) * 100);
        return (
          <li
            key={region.key}
            className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 border-b border-[var(--rule)] py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,18rem)_auto]"
          >
            <span className="numeral text-[1.05rem] text-[var(--clay-deep)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-[1rem] text-[var(--ink)]">{region.label}</p>
              <p className="text-[0.78rem] leading-[1.5] text-[var(--ink-3)]">
                {dangerLabel[region.worstDanger]}
              </p>
            </div>
            <div className="hidden h-1.5 overflow-hidden rounded-full bg-[var(--paper-deep)] sm:block">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: dangerFill[region.worstDanger],
                }}
              />
            </div>
            <span className="numeral text-right text-[1.05rem] text-[var(--ink)]">
              {region.count}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
