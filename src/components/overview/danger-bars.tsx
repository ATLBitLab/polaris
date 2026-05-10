import type { DangerBucket } from "@/lib/incident-overview";

type DangerBarsProps = {
  readonly counts: Readonly<Record<DangerBucket, number>>;
};

type Row = {
  readonly key: DangerBucket;
  readonly label: string;
  readonly fill: string;
  readonly track: string;
};

const rows: readonly Row[] = [
  {
    key: "high",
    label: "Immediate attention",
    fill: "var(--risk-high)",
    track: "var(--risk-high-soft)",
  },
  {
    key: "mid",
    label: "Danger within a week",
    fill: "var(--risk-mid)",
    track: "var(--risk-mid-soft)",
  },
  {
    key: "low",
    label: "Not immediate",
    fill: "var(--risk-low)",
    track: "var(--risk-low-soft)",
  },
  {
    key: "untriaged",
    label: "Untriaged",
    fill: "var(--risk-untriaged)",
    track: "var(--risk-untriaged-soft)",
  },
];

export function DangerBars({ counts }: DangerBarsProps) {
  const max = Math.max(...rows.map((row) => counts[row.key]), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const count = counts[row.key];
        const pct = max === 0 ? 0 : Math.round((count / max) * 100);
        return (
          <li key={row.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-[0.86rem]">
              <span className="text-[var(--ink-2)]">{row.label}</span>
              <span className="numeral text-[var(--ink)]">{count}</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: row.track }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: row.fill,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
