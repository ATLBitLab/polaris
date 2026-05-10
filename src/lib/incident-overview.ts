import "server-only";

import {
  getFakeIncidentReportsWithPeople,
  shouldShowFakeIncidentReports,
} from "./fake-incident-reports";
import {
  defaultOverviewFilters,
  type DangerBucket,
  type DatePreset,
  type OverviewFilters,
} from "./overview-filters";
import {
  isRegionKey,
  regionCentroids,
  type RegionKey,
} from "./region-centroids";
import { getSupabaseAdminClient } from "./supabase-server";

export type { DangerBucket } from "./overview-filters";

export type RegionAggregate = {
  readonly key: RegionKey;
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
  readonly count: number;
  readonly worstDanger: DangerBucket;
};

export type WeeklyCount = {
  readonly weekStart: string;
  readonly count: number;
};

export type OverviewData = {
  readonly totalReports: number;
  readonly totalUnfiltered: number;
  readonly totalLast30Days: number;
  readonly byDanger: Readonly<Record<DangerBucket, number>>;
  readonly physicalViolence: {
    readonly withViolence: number;
    readonly analyzed: number;
  };
  readonly evidence: {
    readonly withEvidence: number;
    readonly analyzed: number;
  };
  readonly topRegions: readonly RegionAggregate[];
  readonly allRegions: readonly RegionAggregate[];
  readonly recentByWeek: readonly WeeklyCount[];
  readonly demoDataIncluded: boolean;
  readonly demoCount: number;
};

type OverviewRow = {
  readonly created_at: string;
  readonly analysis_metadata: unknown;
};

const dangerRank: Record<DangerBucket, number> = {
  untriaged: 0,
  low: 1,
  mid: 2,
  high: 3,
};

const dayMs = 24 * 60 * 60 * 1000;

export async function loadOverviewData(
  filters: OverviewFilters = defaultOverviewFilters,
): Promise<OverviewData> {
  const realRows = await loadRealRows();
  const fakeRows = filters.includeDemo && shouldShowFakeIncidentReports()
    ? getFakeIncidentReportsWithPeople().map(({ report }) => ({
        created_at: report.created_at,
        analysis_metadata: report.analysis_metadata,
      }))
    : [];

  const unfilteredRows: readonly OverviewRow[] = [...realRows, ...fakeRows];
  const now = Date.now();
  const filteredRows = applyFilters(unfilteredRows, filters, now);

  return aggregate(filteredRows, {
    totalUnfiltered: unfilteredRows.length,
    demoCount: fakeRows.length,
    datePreset: filters.datePreset,
    nowMs: now,
  });
}

async function loadRealRows(): Promise<readonly OverviewRow[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("incident_reports")
    .select("created_at, analysis_metadata");

  if (error || !data) {
    if (error) {
      console.error("Unable to load incident reports for overview", error);
    }
    return [];
  }

  return data as OverviewRow[];
}

function applyFilters(
  rows: readonly OverviewRow[],
  filters: OverviewFilters,
  nowMs: number,
): readonly OverviewRow[] {
  const dateCutoff = computeDateCutoff(nowMs, filters.datePreset);
  const regionSet = filters.regions.length > 0 ? new Set(filters.regions) : null;
  const dangerSet = filters.danger.length > 0 ? new Set(filters.danger) : null;

  return rows.filter((row) => {
    if (dateCutoff !== null) {
      const created = Date.parse(row.created_at);
      if (!Number.isFinite(created) || created < dateCutoff) return false;
    }

    const meta = readMetadata(row.analysis_metadata);

    if (regionSet) {
      if (!isRegionKey(meta.region) || !regionSet.has(meta.region)) {
        return false;
      }
    }

    if (dangerSet) {
      const bucket = mapDanger(meta.dangerLevel);
      if (!dangerSet.has(bucket)) return false;
    }

    if (filters.violence !== "any") {
      if (meta.physicalViolence === null) return false;
      const isViolent = meta.physicalViolence === "physical_violence_used";
      if (filters.violence === "yes" && !isViolent) return false;
      if (filters.violence === "no" && isViolent) return false;
    }

    if (filters.evidence !== "any") {
      if (meta.evidenceCount === null) return false;
      const hasEvidence = meta.evidenceCount > 0;
      if (filters.evidence === "with" && !hasEvidence) return false;
      if (filters.evidence === "without" && hasEvidence) return false;
    }

    return true;
  });
}

function computeDateCutoff(nowMs: number, preset: DatePreset): number | null {
  switch (preset) {
    case "7d":
      return nowMs - 7 * dayMs;
    case "30d":
      return nowMs - 30 * dayMs;
    case "90d":
      return nowMs - 90 * dayMs;
    case "all":
      return null;
  }
}

type AggregateContext = {
  readonly totalUnfiltered: number;
  readonly demoCount: number;
  readonly datePreset: DatePreset;
  readonly nowMs: number;
};

function aggregate(
  rows: readonly OverviewRow[],
  ctx: AggregateContext,
): OverviewData {
  const thirtyDaysAgo = ctx.nowMs - 30 * dayMs;

  const byDanger: Record<DangerBucket, number> = {
    high: 0,
    mid: 0,
    low: 0,
    untriaged: 0,
  };

  let withViolence = 0;
  let violenceAnalyzed = 0;
  let withEvidence = 0;
  let evidenceAnalyzed = 0;
  let totalLast30Days = 0;

  type RegionAccumulator = {
    count: number;
    worstRank: number;
  };
  const regionTotals: Partial<Record<RegionKey, RegionAccumulator>> = {};

  for (const row of rows) {
    const meta = readMetadata(row.analysis_metadata);
    const bucket = mapDanger(meta.dangerLevel);
    byDanger[bucket] += 1;

    if (meta.physicalViolence !== null) {
      violenceAnalyzed += 1;
      if (meta.physicalViolence === "physical_violence_used") {
        withViolence += 1;
      }
    }

    if (meta.evidenceCount !== null) {
      evidenceAnalyzed += 1;
      if (meta.evidenceCount > 0) {
        withEvidence += 1;
      }
    }

    if (isRegionKey(meta.region)) {
      const existing = regionTotals[meta.region] ?? { count: 0, worstRank: 0 };
      const rank = dangerRank[bucket];
      regionTotals[meta.region] = {
        count: existing.count + 1,
        worstRank: rank > existing.worstRank ? rank : existing.worstRank,
      };
    }

    const created = Date.parse(row.created_at);
    if (Number.isFinite(created) && created >= thirtyDaysAgo) {
      totalLast30Days += 1;
    }
  }

  const allRegions: RegionAggregate[] = Object.entries(regionTotals)
    .map(([key, value]) => {
      const regionKey = key as RegionKey;
      const centroid = regionCentroids[regionKey];
      return {
        key: regionKey,
        label: centroid.label,
        lat: centroid.lat,
        lon: centroid.lon,
        count: value!.count,
        worstDanger: rankToBucket(value!.worstRank),
      };
    })
    .sort((a, b) => b.count - a.count);

  const topRegions = allRegions.slice(0, 5);
  const recentByWeek = buildPeriodCounts(rows, ctx.nowMs, ctx.datePreset);

  return {
    totalReports: rows.length,
    totalUnfiltered: ctx.totalUnfiltered,
    totalLast30Days,
    byDanger,
    physicalViolence: {
      withViolence,
      analyzed: violenceAnalyzed,
    },
    evidence: {
      withEvidence,
      analyzed: evidenceAnalyzed,
    },
    topRegions,
    allRegions,
    recentByWeek,
    demoDataIncluded: ctx.demoCount > 0,
    demoCount: ctx.demoCount,
  };
}

type ParsedMetadata = {
  readonly dangerLevel: string | null;
  readonly physicalViolence: string | null;
  readonly region: string | null;
  readonly evidenceCount: number | null;
};

function readMetadata(value: unknown): ParsedMetadata {
  if (!value || typeof value !== "object") {
    return {
      dangerLevel: null,
      physicalViolence: null,
      region: null,
      evidenceCount: null,
    };
  }

  const meta = value as Record<string, unknown>;
  const evidenceFiles = Array.isArray(meta.evidence_files)
    ? meta.evidence_files
    : null;

  return {
    dangerLevel: typeof meta.danger_level === "string" ? meta.danger_level : null,
    physicalViolence:
      typeof meta.physical_violence === "string" ? meta.physical_violence : null,
    region: typeof meta.region === "string" ? meta.region : null,
    evidenceCount: evidenceFiles ? evidenceFiles.length : null,
  };
}

function mapDanger(value: string | null): DangerBucket {
  if (value === "immediate_attention_needed") return "high";
  if (value === "danger_expected_within_a_week") return "mid";
  if (value === "not_immediate_danger") return "low";
  return "untriaged";
}

function rankToBucket(rank: number): DangerBucket {
  if (rank >= 3) return "high";
  if (rank === 2) return "mid";
  if (rank === 1) return "low";
  return "untriaged";
}

function buildPeriodCounts(
  rows: readonly OverviewRow[],
  nowMs: number,
  preset: DatePreset,
): WeeklyCount[] {
  const { bucketCount, daysPerBucket } = periodShape(preset);
  const bucketMs = daysPerBucket * dayMs;

  const today = new Date(nowMs);
  const startToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  const buckets: WeeklyCount[] = [];
  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    const start = startToday - i * bucketMs;
    buckets.push({
      weekStart: new Date(start).toISOString(),
      count: 0,
    });
  }

  const earliest = startToday - (bucketCount - 1) * bucketMs;
  for (const row of rows) {
    const created = Date.parse(row.created_at);
    if (!Number.isFinite(created) || created < earliest) continue;

    const offset = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((created - earliest) / bucketMs)),
    );
    buckets[offset] = {
      weekStart: buckets[offset].weekStart,
      count: buckets[offset].count + 1,
    };
  }

  return buckets;
}

function periodShape(preset: DatePreset): {
  readonly bucketCount: number;
  readonly daysPerBucket: number;
} {
  switch (preset) {
    case "7d":
      return { bucketCount: 7, daysPerBucket: 1 };
    case "30d":
      return { bucketCount: 4, daysPerBucket: 7 };
    case "90d":
      return { bucketCount: 13, daysPerBucket: 7 };
    case "all":
      return { bucketCount: 8, daysPerBucket: 7 };
  }
}
