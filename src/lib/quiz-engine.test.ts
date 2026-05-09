import { describe, expect, it } from "vitest";
import { getRiskBandForScore, parseQuizInput, scoreQuiz } from "./quiz-engine";

describe("scoreQuiz", () => {
  it("keeps a community social path in the lower band", () => {
    const result = scoreQuiz({
      location: "georgia",
      role: "community_member",
      eventTypes: ["low_key_social"],
    });

    expect(result.score).toBe(0);
    expect(result.riskBand).toBe("lower");
    expect(result.guidanceGroups.length).toBeGreaterThan(0);
  });

  it("scores an organizer protest path as moderate outside higher-visibility metros", () => {
    const result = scoreQuiz({
      location: "georgia",
      role: "organizer",
      eventTypes: ["protest"],
    });

    expect(result.score).toBe(4);
    expect(result.riskBand).toBe("moderate");
  });

  it("scores international political work as elevated", () => {
    const result = scoreQuiz({
      location: "other_us",
      role: "community_member",
      eventTypes: ["international_political_work"],
    });

    expect(result.score).toBe(6);
    expect(result.riskBand).toBe("elevated");
  });

  it("increases score when multiple event types apply", () => {
    const protestOnly = scoreQuiz({
      location: "other_us",
      role: "community_member",
      eventTypes: ["protest"],
    });

    const combined = scoreQuiz({
      location: "other_us",
      role: "community_member",
      eventTypes: ["low_key_social", "picnic", "protest"],
    });

    expect(combined.score).toBeGreaterThan(protestOnly.score);
    expect(combined.riskBand).toBe("moderate");
  });

  it("handles threshold boundaries", () => {
    expect(getRiskBandForScore(2)).toBe("lower");
    expect(getRiskBandForScore(3)).toBe("moderate");
    expect(getRiskBandForScore(5)).toBe("moderate");
    expect(getRiskBandForScore(6)).toBe("elevated");
  });
});

describe("parseQuizInput", () => {
  it("normalizes duplicate event types", () => {
    expect(
      parseQuizInput({
        location: "metro_atlanta",
        role: "organizer",
        eventTypes: ["protest", "protest"],
      }),
    ).toEqual({
      location: "metro_atlanta",
      role: "organizer",
      eventTypes: ["protest"],
    });
  });

  it("rejects unknown dimensions", () => {
    expect(
      parseQuizInput({
        location: "exact_address",
        role: "organizer",
        eventTypes: ["protest"],
      }),
    ).toBeNull();
  });
});
