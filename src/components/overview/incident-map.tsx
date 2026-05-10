import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type {
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";

import topology from "@/lib/us-states-10m.json";
import type { RegionAggregate } from "@/lib/incident-overview";

type IncidentMapProps = {
  readonly regions: readonly RegionAggregate[];
};

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 600;

const dangerStroke: Record<RegionAggregate["worstDanger"], string> = {
  high: "var(--risk-high)",
  mid: "var(--risk-mid)",
  low: "var(--risk-low)",
  untriaged: "var(--risk-untriaged)",
};

const dangerFill: Record<RegionAggregate["worstDanger"], string> = {
  high: "var(--risk-high-soft)",
  mid: "var(--risk-mid-soft)",
  low: "var(--risk-low-soft)",
  untriaged: "var(--risk-untriaged-soft)",
};

export function IncidentMap({ regions }: IncidentMapProps) {
  const states = feature(
    topology as unknown as Topology,
    (topology as unknown as Topology).objects.states as GeometryCollection,
  ) as FeatureCollection<Geometry, GeoJsonProperties>;

  const projection = geoAlbersUsa().fitSize(
    [VIEW_WIDTH, VIEW_HEIGHT],
    states,
  );
  const path = geoPath(projection);

  const statePaths = states.features
    .map((f) => path(f))
    .filter((d): d is string => Boolean(d));

  const maxCount = Math.max(...regions.map((r) => r.count), 1);

  const markers = regions
    .map((region) => {
      const projected = projection([region.lon, region.lat]);
      if (!projected) return null;
      const radius = scaleRadius(region.count, maxCount);
      return {
        region,
        x: projected[0],
        y: projected[1],
        radius,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="United States map showing reported incident clusters by region"
      className="block h-auto w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g aria-hidden="true">
        {statePaths.map((d, index) => (
          <path
            key={index}
            d={d}
            fill="var(--paper-deep)"
            stroke="var(--rule-strong)"
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
        ))}
      </g>

      <g>
        {markers.map(({ region, x, y, radius }) => (
          <g
            key={region.key}
            className="region-marker"
            tabIndex={0}
            role="img"
            aria-label={`${region.label}: ${region.count} report${region.count === 1 ? "" : "s"}`}
            transform={`translate(${x}, ${y})`}
          >
            <title>{`${region.label} — ${region.count} report${region.count === 1 ? "" : "s"}`}</title>
            <circle
              r={radius}
              fill={dangerFill[region.worstDanger]}
              stroke={dangerStroke[region.worstDanger]}
              strokeWidth={1.5}
              fillOpacity={0.85}
            />
            <text
              className="region-label"
              y={-radius - 8}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={13}
              fontWeight={500}
              fill="var(--ink)"
              pointerEvents="none"
            >
              {region.label}
              <tspan
                x="0"
                dy="1.25em"
                fontSize={11}
                fill="var(--ink-3)"
                fontWeight={400}
              >
                {`${region.count} report${region.count === 1 ? "" : "s"}`}
              </tspan>
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function scaleRadius(count: number, max: number): number {
  const minR = 6;
  const maxR = 22;
  if (max <= 0) return minR;
  // Square-root scale so visual area is roughly proportional to count.
  const scale = Math.sqrt(count / max);
  return minR + (maxR - minR) * scale;
}
