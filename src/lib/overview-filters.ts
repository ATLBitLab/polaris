import { isRegionKey, type RegionKey } from "./region-centroids";

export type DangerBucket = "high" | "mid" | "low" | "untriaged";
export type DatePreset = "7d" | "30d" | "90d" | "all";
export type ViolenceFilter = "any" | "yes" | "no";
export type EvidenceFilter = "any" | "with" | "without";

export type OverviewFilters = {
  readonly regions: readonly RegionKey[];
  readonly danger: readonly DangerBucket[];
  readonly datePreset: DatePreset;
  readonly violence: ViolenceFilter;
  readonly evidence: EvidenceFilter;
  readonly includeDemo: boolean;
};

export const defaultOverviewFilters: OverviewFilters = {
  regions: [],
  danger: [],
  datePreset: "all",
  violence: "any",
  evidence: "any",
  includeDemo: true,
};

export const dangerBuckets: readonly DangerBucket[] = [
  "high",
  "mid",
  "low",
  "untriaged",
];

export const datePresets: readonly DatePreset[] = ["7d", "30d", "90d", "all"];

export const violenceOptions: readonly ViolenceFilter[] = ["any", "yes", "no"];

export const evidenceOptions: readonly EvidenceFilter[] = [
  "any",
  "with",
  "without",
];

type SearchParamsLike = Readonly<
  Record<string, string | string[] | undefined>
>;

export function parseOverviewFilters(
  raw: SearchParamsLike,
  options: { readonly demoEnvEnabled: boolean } = { demoEnvEnabled: false },
): OverviewFilters {
  const regions = uniq(toArray(raw.regions).filter(isRegionKey));

  const danger = uniq(
    toArray(raw.danger).filter(
      (value): value is DangerBucket =>
        (dangerBuckets as readonly string[]).includes(value),
    ),
  );

  const dateRaw = toScalar(raw.date);
  const datePreset: DatePreset =
    dateRaw && (datePresets as readonly string[]).includes(dateRaw)
      ? (dateRaw as DatePreset)
      : "all";

  const violenceRaw = toScalar(raw.violence);
  const violence: ViolenceFilter =
    violenceRaw && (violenceOptions as readonly string[]).includes(violenceRaw)
      ? (violenceRaw as ViolenceFilter)
      : "any";

  const evidenceRaw = toScalar(raw.evidence);
  const evidence: EvidenceFilter =
    evidenceRaw && (evidenceOptions as readonly string[]).includes(evidenceRaw)
      ? (evidenceRaw as EvidenceFilter)
      : "any";

  const includeDemo = options.demoEnvEnabled
    ? toScalar(raw.demo) !== "hide"
    : false;

  return {
    regions,
    danger,
    datePreset,
    violence,
    evidence,
    includeDemo,
  };
}

export function serializeOverviewFilters(
  filters: OverviewFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const region of filters.regions) {
    params.append("regions", region);
  }
  for (const bucket of filters.danger) {
    params.append("danger", bucket);
  }
  if (filters.datePreset !== "all") {
    params.set("date", filters.datePreset);
  }
  if (filters.violence !== "any") {
    params.set("violence", filters.violence);
  }
  if (filters.evidence !== "any") {
    params.set("evidence", filters.evidence);
  }
  if (!filters.includeDemo) {
    params.set("demo", "hide");
  }
  return params;
}

export function hasActiveFilters(
  filters: OverviewFilters,
  options: { readonly demoEnvEnabled: boolean },
): boolean {
  if (filters.regions.length > 0) return true;
  if (filters.danger.length > 0) return true;
  if (filters.datePreset !== "all") return true;
  if (filters.violence !== "any") return true;
  if (filters.evidence !== "any") return true;
  if (options.demoEnvEnabled && !filters.includeDemo) return true;
  return false;
}

export function filterHref(
  base: OverviewFilters,
  override: Partial<OverviewFilters>,
): string {
  const next: OverviewFilters = { ...base, ...override };
  const qs = serializeOverviewFilters(next).toString();
  return qs ? `/overview?${qs}` : "/overview";
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function toScalar(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function uniq<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

