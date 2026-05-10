import "server-only";

import {
  getFakeIncidentReportsWithPeople,
  shouldShowFakeIncidentReports,
} from "./fake-incident-reports";
import {
  isRegionKey,
  regionCentroids,
  type RegionKey,
} from "./region-centroids";
import { getSupabaseAdminClient } from "./supabase-server";

export type DangerBucket = "high" | "mid" | "low" | "untriaged";

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

export async function loadOverviewData(): Promise<OverviewData> {
  const realRows = await loadRealRows();
  const fakeRows = shouldShowFakeIncidentReports()
    ? getFakeIncidentReportsWithPeople().map(({ report }) => ({
        created_at: report.created_at,
        analysis_metadata: report.analysis_metadata,
      }))
    : [];

  const allRows: readonly OverviewRow[] = [...realRows, ...fakeRows];
  return aggregate(allRows, fakeRows.length);
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

function aggregate(
  rows: readonly OverviewRow[],
  demoCount: number,
): OverviewData {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

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
  const recentByWeek = buildWeeklyCounts(rows, now);

  return {
    totalReports: rows.length,
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
    demoDataIncluded: demoCount > 0,
    demoCount,
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

function buildWeeklyCounts(
  rows: readonly OverviewRow[],
  nowMs: number,
): WeeklyCount[] {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeks = 8;
  const buckets: WeeklyCount[] = [];

  // Normalize "now" to start of UTC day so weeks align consistently.
  const today = new Date(nowMs);
  const startToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = startToday - i * weekMs;
    buckets.push({
      weekStart: new Date(start).toISOString(),
      count: 0,
    });
  }

  const earliest = startToday - (weeks - 1) * weekMs;
  for (const row of rows) {
    const created = Date.parse(row.created_at);
    if (!Number.isFinite(created) || created < earliest) continue;

    const offsetWeeks = Math.min(
      weeks - 1,
      Math.max(0, Math.floor((created - earliest) / weekMs)),
    );
    buckets[offsetWeeks] = {
      weekStart: buckets[offsetWeeks].weekStart,
      count: buckets[offsetWeeks].count + 1,
    };
  }

  return buckets;
}
