import type { WeeklyCount } from "@/lib/incident-overview";

type RecentBarsProps = {
  readonly weeks: readonly WeeklyCount[];
};

export function RecentBars({ weeks }: RecentBarsProps) {
  if (weeks.length === 0) {
    return null;
  }

  const max = Math.max(...weeks.map((week) => week.count), 1);
  const total = weeks.reduce((sum, week) => sum + week.count, 0);

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2" aria-hidden="true">
        {weeks.map((week) => {
          const heightPct = (week.count / max) * 100;
          return (
            <div
              key={week.weekStart}
              className="flex-1"
              style={{ height: "3.5rem" }}
            >
              <div className="flex h-full flex-col justify-end">
                <div
                  className="rounded-sm"
                  style={{
                    height: `${Math.max(heightPct, week.count > 0 ? 4 : 1)}%`,
                    background:
                      week.count > 0
                        ? "var(--clay)"
                        : "var(--paper-deep)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.78rem] leading-[1.5] text-[var(--ink-3)]">
        {total} report{total === 1 ? "" : "s"} across the last 8 weeks.
      </p>
    </div>
  );
}
