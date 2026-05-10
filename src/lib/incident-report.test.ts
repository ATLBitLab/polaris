import { describe, expect, it } from "vitest";
import {
  applyIncidentPatch,
  calculateIncidentQuality,
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

  it("parses partner-sharing consent separately from contact consent", () => {
    const patch = parseIncidentPatch({
      contact: { consent: false, methods: [] },
      partnerSharing: { consent: true },
    });

    expect(patch).toEqual({
      contact: { consent: false, methods: [] },
      partnerSharing: { consent: true },
    });

    const draft = applyIncidentPatch(emptyIncidentDraft(), patch!);
    expect(draft.contactConsent).toBe(false);
    expect(draft.partnerSharingConsent).toBe(true);
  });

  it("defaults new drafts to no partner-sharing decision", () => {
    expect(emptyIncidentDraft().partnerSharingConsent).toBeNull();
  });
});

describe("calculateIncidentQuality", () => {
  it("rewards concrete documentation without requiring every field", () => {
    const draft = applyIncidentPatch(emptyIncidentDraft(), {
      incidentTime: {
        kind: "yesterday",
        occurredAt: "2026-05-09T14:00:00.000Z",
        note: "",
      },
      location: {
        source: "manual",
        label: "Outside the venue",
        latitude: null,
        longitude: null,
        accuracyMeters: null,
      },
      narrativeText:
        "Two people followed me after the event. A witness took a photo and I saved text messages about the incident.",
      people: [
        {
          displayName: "Unknown person",
          role: "subject",
          description: "Followed me from the venue.",
          source: "user",
        },
      ],
      contact: { consent: false, methods: [] },
    });

    const quality = calculateIncidentQuality(draft);

    expect(quality.score).toBeGreaterThanOrEqual(70);
    expect(quality.feedback).not.toContain(
      "Choose whether follow-up contact is allowed.",
    );
  });
});

describe("checklist tailoring", () => {
  it("adds evidence guidance for digital records", () => {
    const draft = applyIncidentPatch(emptyIncidentDraft(), {
      narrativeText:
        "The person sent several Signal messages and called twice after the event.",
    });

    expect(draft.checklist.map((item) => item.id)).toContain("digital-records");
  });

  it("preserves AI-tailored checklist items when contact consent changes", () => {
    const draft = {
      ...emptyIncidentDraft(),
      checklist: [
        {
          id: "ai-witness-detail",
          label: "Add the witness description from the voice note.",
          rationale: "The AI suggested this from the report narrative.",
          completed: false,
        },
      ],
    };

    const next = applyIncidentPatch(draft, {
      contact: { consent: false, methods: [] },
    });

    expect(next.checklist).toEqual(draft.checklist);
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
  it("parses structured JSON from the model", () => {
    const draft = emptyIncidentDraft();
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
          {
            id: "chronology",
            label: "Put events in order.",
            rationale: "A timeline helps.",
            completed: false,
          },
        ],
        quality: {
          score: 62,
          feedback: ["Add location details."],
        },
      }),
      draft,
    );

    expect(parsed?.people[0]?.displayName).toBe("Witness");
    expect(parsed?.quality.score).toBe(62);
  });

  it("returns null for non-json model output", () => {
    expect(parseIncidentAnalysisResponse("I cannot parse this.", emptyIncidentDraft())).toBeNull();
  });
});
