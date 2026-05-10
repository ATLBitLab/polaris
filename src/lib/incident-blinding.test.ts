import { describe, expect, it } from "vitest";
import {
  buildIncidentBlindingSourceFingerprint,
  parseIncidentBlindingResponse,
  type IncidentBlindingSource,
} from "./incident-blinding";
import { normalizePrivateResearchIncidentRows } from "./research-dashboard";

const baseSource: IncidentBlindingSource = {
  reportId: "11111111-1111-4111-8111-111111111111",
  updatedAt: "2026-05-10T04:00:00.000Z",
  incidentTimeKind: "manual",
  incidentOccurredAt: "2026-05-10T03:00:00.000Z",
  incidentTimeNote: "",
  locationSource: "manual",
  locationLabel: "123 Main Street, Atlanta",
  latitude: 33.749,
  longitude: -84.388,
  narrativeText: "A named person blocked the doorway.",
  transcriptText: "",
  people: [
    {
      displayName: "Jane Doe",
      role: "witness",
      description: "Saw the interaction.",
      source: "user",
    },
  ],
  analysisMetadata: { danger_level: "not_immediate_danger" },
};

describe("parseIncidentBlindingResponse", () => {
  it("accepts valid structured blinded JSON", () => {
    const parsed = parseIncidentBlindingResponse({
      blindedNarrative:
        "An unidentified person blocked the doorway at a public event.",
      blindedTranscript: "",
      blindedPeople: [
        {
          label: "Witness 1",
          role: "witness",
          description: "Observed the interaction.",
        },
      ],
      blindedLocationLabel: "Public venue in Atlanta area",
      coarseRegion: "Atlanta area",
      dangerLevel: "not_immediate_danger",
      evidencePresent: true,
      physicalConfrontation: false,
    });

    expect(parsed?.blindedPeople[0]?.label).toBe("Witness 1");
    expect(parsed?.coarseRegion).toBe("Atlanta area");
  });

  it("rejects malformed model output", () => {
    expect(
      parseIncidentBlindingResponse({
        blindedNarrative: "Missing required fields.",
      }),
    ).toBeNull();
    expect(parseIncidentBlindingResponse("not json")).toBeNull();
  });
});

describe("buildIncidentBlindingSourceFingerprint", () => {
  it("changes when raw shareable fields change", () => {
    const first = buildIncidentBlindingSourceFingerprint(baseSource);
    const second = buildIncidentBlindingSourceFingerprint({
      ...baseSource,
      narrativeText: `${baseSource.narrativeText} A photo exists.`,
    });

    expect(second).not.toBe(first);
  });

  it("does not depend on source update timestamps", () => {
    expect(
      buildIncidentBlindingSourceFingerprint({
        ...baseSource,
        updatedAt: "2026-05-10T05:00:00.000Z",
      }),
    ).toBe(buildIncidentBlindingSourceFingerprint(baseSource));
  });
});

describe("normalizePrivateResearchIncidentRows", () => {
  it("excludes unshared reports and incomplete blindings", () => {
    const rows = normalizePrivateResearchIncidentRows([
      {
        report_id: "shared-complete",
        status: "completed",
        completed_at: "2026-05-10T04:00:00.000Z",
        updated_at: "2026-05-10T04:00:00.000Z",
        incident_occurred_at: null,
        incident_time_kind: "unknown",
        blinded_narrative: "Blinded narrative.",
        blinded_transcript: "",
        blinded_people: [],
        blinded_location_label: "Atlanta area",
        coarse_region: "Atlanta area",
        danger_level: "unknown",
        evidence_present: null,
        physical_confrontation: null,
        model: "model",
        incident_reports: { partner_sharing_consent: true },
      },
      {
        report_id: "unshared-complete",
        status: "completed",
        completed_at: null,
        updated_at: "2026-05-10T04:00:00.000Z",
        incident_occurred_at: null,
        incident_time_kind: "unknown",
        blinded_narrative: "Should not appear.",
        blinded_transcript: "",
        blinded_people: [],
        blinded_location_label: "",
        coarse_region: "",
        danger_level: "unknown",
        evidence_present: null,
        physical_confrontation: null,
        model: "",
        incident_reports: { partner_sharing_consent: false },
      },
      {
        report_id: "shared-processing",
        status: "processing",
        completed_at: null,
        updated_at: "2026-05-10T04:00:00.000Z",
        incident_occurred_at: null,
        incident_time_kind: "unknown",
        blinded_narrative: "Should not appear.",
        blinded_transcript: "",
        blinded_people: [],
        blinded_location_label: "",
        coarse_region: "",
        danger_level: "unknown",
        evidence_present: null,
        physical_confrontation: null,
        model: "",
        incident_reports: { partner_sharing_consent: true },
      },
    ]);

    expect(rows.map((row) => row.reportId)).toEqual(["shared-complete"]);
  });
});
