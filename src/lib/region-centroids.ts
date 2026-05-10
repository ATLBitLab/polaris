/**
 * Centroids for the 14 regions used in fake incident report data.
 *
 * Lat/lon are approximate centroids of the dominant city or metro area
 * referenced by the records assigned to that region. The dashboard map
 * clusters all incidents in a region at this single point — exact
 * locations are intentionally not exposed.
 */

export type RegionKey =
  | "chicago_metro"
  | "michigan"
  | "nyc_metro"
  | "connecticut"
  | "san_francisco_bay_area"
  | "los_angeles_metro"
  | "washington_dc_metro"
  | "florida"
  | "massachusetts"
  | "pennsylvania"
  | "minnesota"
  | "washington"
  | "oregon"
  | "ohio";

export type RegionCentroid = {
  readonly key: RegionKey;
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
};

export const regionCentroids: Readonly<Record<RegionKey, RegionCentroid>> = {
  chicago_metro: {
    key: "chicago_metro",
    label: "Chicago metro",
    lat: 41.85,
    lon: -87.65,
  },
  michigan: {
    key: "michigan",
    label: "Detroit metro",
    lat: 42.33,
    lon: -83.05,
  },
  nyc_metro: {
    key: "nyc_metro",
    label: "New York metro",
    lat: 40.75,
    lon: -73.98,
  },
  connecticut: {
    key: "connecticut",
    label: "Hartford, CT",
    lat: 41.77,
    lon: -72.67,
  },
  san_francisco_bay_area: {
    key: "san_francisco_bay_area",
    label: "SF Bay Area",
    lat: 37.78,
    lon: -122.42,
  },
  los_angeles_metro: {
    key: "los_angeles_metro",
    label: "Los Angeles metro",
    lat: 34.05,
    lon: -118.25,
  },
  washington_dc_metro: {
    key: "washington_dc_metro",
    label: "Washington, D.C. metro",
    lat: 38.91,
    lon: -77.04,
  },
  florida: {
    key: "florida",
    label: "Miami, FL",
    lat: 25.77,
    lon: -80.19,
  },
  massachusetts: {
    key: "massachusetts",
    label: "Boston, MA",
    lat: 42.36,
    lon: -71.06,
  },
  pennsylvania: {
    key: "pennsylvania",
    label: "Philadelphia, PA",
    lat: 39.95,
    lon: -75.16,
  },
  minnesota: {
    key: "minnesota",
    label: "Minneapolis, MN",
    lat: 44.98,
    lon: -93.27,
  },
  washington: {
    key: "washington",
    label: "Seattle, WA",
    lat: 47.61,
    lon: -122.33,
  },
  oregon: {
    key: "oregon",
    label: "Portland, OR",
    lat: 45.52,
    lon: -122.68,
  },
  ohio: {
    key: "ohio",
    label: "Columbus, OH",
    lat: 39.96,
    lon: -82.99,
  },
};

export const regionKeys = Object.keys(regionCentroids) as readonly RegionKey[];

export function isRegionKey(value: unknown): value is RegionKey {
  return typeof value === "string" && value in regionCentroids;
}
