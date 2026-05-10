import { describe, expect, it } from "vitest";
import {
  applyIncidentPatch,
  emptyIncidentDraft,
  normalizeContactMethods,
  parseIncidentAnalysisResponse,
  parseIncidentPatch,
} from "./incident-report";

describe("parseIncidentPatch", () => {
  it("accepts partial incident updates", () => {
    expect(
      parseIncidentPatch({
        incidentTime: {
          kind: "manual",
          occurredAt: "2026-05-10T03:00:00.000Z",
          note: "after closing",
        },
        location: {
          source: "manual",
          label: "Main entrance",
          latitude: 33.749,
          longitude: -84.388,
          accuracyMeters: null,
        },
        narrativeText: "A person blocked the doorway and shouted at attendees.",
      }),
    ).toMatchObject({
      incidentTime: { kind: "manual" },
      location: { source: "manual", latitude: 33.749 },
      narrativeText: "A person blocked the doorway and shouted at attendees.",
    });
  });

  it("rejects invalid coordinates and unknown fields", () => {
    expect(
      parseIncidentPatch({
        location: {
          source: "manual",
          label: "Somewhere",
          latitude: 120,
          longitude: -84,
          accuracyMeters: null,
        },
      }),
    ).toBeNull();
  });

  it("ignores legacy partner-sharing or checklist fields without crashing", () => {
    const patch = parseIncidentPatch({
      contact: { consent: false, methods: [] },
      partnerSharing: { consent: true },
      checklist: [
        {
          id: "chronology",
          label: "Put it in order.",
          rationale: "",
          completed: false,
        },
      ],
    });

    expect(patch).toEqual({
      contact: { consent: false, methods: [] },
    });

    const draft = applyIncidentPatch(emptyIncidentDraft(), patch!);
    expect(draft.contactConsent).toBe(false);
    expect("partnerSharingConsent" in draft).toBe(false);
    expect("checklist" in draft).toBe(false);
  });

  it("defaults new drafts to no contact decision", () => {
    expect(emptyIncidentDraft().contactConsent).toBeNull();
  });
});

describe("normalizeContactMethods", () => {
  it("supports initial and future contact method shapes", () => {
    expect(
      normalizeContactMethods([
        { type: "email", value: "person@example.org" },
        { type: "phone", value: "+1 404 555 0100" },
        { type: "signal", value: "@quiet.01" },
      ]),
    ).toEqual([
      { type: "email", value: "person@example.org" },
      { type: "phone", value: "+1 404 555 0100" },
      { type: "signal", value: "@quiet.01" },
    ]);
  });

  it("rejects malformed email and phone methods", () => {
    expect(
      normalizeContactMethods([{ type: "email", value: "not-an-email" }]),
    ).toBeNull();
    expect(normalizeContactMethods([{ type: "phone", value: "12" }])).toBeNull();
  });
});

describe("parseIncidentAnalysisResponse", () => {
  it("parses people from the model output and ignores extra fields", () => {
    const parsed = parseIncidentAnalysisResponse(
      JSON.stringify({
        people: [
          {
            displayName: "Witness",
            role: "witness",
            description: "Saw the interaction.",
            source: "ai",
            confidence: 0.8,
          },
        ],
        checklist: [
          { id: "chronology", label: "old", rationale: "", completed: false },
        ],
      }),
    );

    expect(parsed?.people[0]?.displayName).toBe("Witness");
    expect(parsed?.people[0]?.confidence).toBeCloseTo(0.8);
  });

  it("returns null for non-json model output", () => {
    expect(parseIncidentAnalysisResponse("I cannot parse this.")).toBeNull();
  });
});
