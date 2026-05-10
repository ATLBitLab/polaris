import { describe, expect, it } from "vitest";
import {
  getQuestionKeysForRole,
  type AnswerKey,
  type QuizRole,
} from "./quiz-config";
import {
  getRiskBandForScore,
  parseQuizInput,
  scoreQuiz,
  type QuizAnswers,
} from "./quiz-engine";

describe("scoreQuiz - organizer path", () => {
  it("scores all A answers as lower", () => {
    const result = scoreQuiz({
      role: "organizer",
      answers: allAnswers("organizer", "A"),
    });

    expect(result.score).toBe(0);
    expect(result.riskBand).toBe("lower");
    expect(result.guidanceGroups.length).toBeGreaterThan(0);
  });

  it("scores all D answers as elevated", () => {
    const result = scoreQuiz({
      role: "organizer",
      answers: allAnswers("organizer", "D"),
    });

    expect(result.score).toBe(30);
    expect(result.riskBand).toBe("elevated");
  });

  it("handles threshold boundaries", () => {
    expect(getRiskBandForScore(7, "organizer")).toBe("lower");
    expect(getRiskBandForScore(8, "organizer")).toBe("moderate");
    expect(getRiskBandForScore(15, "organizer")).toBe("moderate");
    expect(getRiskBandForScore(16, "organizer")).toBe("elevated");
  });

  it("returns both guidance groups", () => {
    const result = scoreQuiz({
      role: "organizer",
      answers: allAnswers("organizer", "D"),
    });

    expect(result.guidanceGroups.map((group) => group.key)).toEqual([
      "event_safety",
      "identity_protection",
    ]);
  });
});

describe("scoreQuiz - participant path", () => {
  it("scores all A answers as lower", () => {
    const result = scoreQuiz({
      role: "participant",
      answers: allAnswers("participant", "A"),
    });

    expect(result.score).toBe(0);
    expect(result.riskBand).toBe("lower");
  });

  it("scores all worst-case answers as elevated", () => {
    const result = scoreQuiz({
      role: "participant",
      answers: worstParticipantAnswers(),
    });

    expect(result.score).toBe(21);
    expect(result.riskBand).toBe("elevated");
  });

  it("handles threshold boundaries", () => {
    expect(getRiskBandForScore(5, "participant")).toBe("lower");
    expect(getRiskBandForScore(6, "participant")).toBe("moderate");
    expect(getRiskBandForScore(10, "participant")).toBe("moderate");
    expect(getRiskBandForScore(11, "participant")).toBe("elevated");
  });

  it("returns only the event_safety guidance group", () => {
    const result = scoreQuiz({
      role: "participant",
      answers: worstParticipantAnswers(),
    });

    expect(result.guidanceGroups.map((group) => group.key)).toEqual([
      "event_safety",
    ]);
  });

  it("limits participant guidance to the four allowed event_safety items", () => {
    const result = scoreQuiz({
      role: "participant",
      answers: worstParticipantAnswers(),
    });

    const ids = result.guidanceGroups.flatMap((group) =>
      group.items.map((item) => item.id),
    );

    expect(new Set(ids)).toEqual(
      new Set([
        "trusted-contact",
        "arrival-exit",
        "public-buddy-plan",
        "limited-event-details",
      ]),
    );
  });

  it("scores Q4 (response_plan) on a 0/2/3 scale", () => {
    const a = scoreQuiz({
      role: "participant",
      answers: { ...allAnswers("participant", "A"), response_plan: "A" },
    }).score;
    const b = scoreQuiz({
      role: "participant",
      answers: { ...allAnswers("participant", "A"), response_plan: "B" },
    }).score;
    const c = scoreQuiz({
      role: "participant",
      answers: { ...allAnswers("participant", "A"), response_plan: "C" },
    }).score;

    expect(a).toBe(0);
    expect(b).toBe(2);
    expect(c).toBe(3);
  });
});

describe("parseQuizInput", () => {
  it("accepts an organizer answer set", () => {
    const answers = allAnswers("organizer", "A");
    expect(parseQuizInput({ role: "organizer", answers })).toEqual({
      role: "organizer",
      answers,
    });
  });

  it("accepts a participant answer set", () => {
    const answers = allAnswers("participant", "A");
    expect(parseQuizInput({ role: "participant", answers })).toEqual({
      role: "participant",
      answers,
    });
  });

  it("rejects missing role", () => {
    expect(
      parseQuizInput({ answers: allAnswers("organizer", "A") }),
    ).toBeNull();
  });

  it("rejects unknown role", () => {
    expect(
      parseQuizInput({
        role: "spectator",
        answers: allAnswers("organizer", "A"),
      }),
    ).toBeNull();
  });

  it("rejects organizer-only keys when role is participant", () => {
    expect(
      parseQuizInput({
        role: "participant",
        answers: allAnswers("organizer", "A"),
      }),
    ).toBeNull();
  });

  it("rejects multiple answers for one question", () => {
    expect(
      parseQuizInput({
        role: "organizer",
        answers: {
          ...allAnswers("organizer", "A"),
          event_visibility: ["A", "B"],
        },
      }),
    ).toBeNull();
  });

  it("rejects missing answers", () => {
    const answers = allAnswers("organizer", "A") as Record<string, AnswerKey>;
    delete answers.public_profile;

    expect(parseQuizInput({ role: "organizer", answers })).toBeNull();
  });

  it("rejects unknown answer keys", () => {
    expect(
      parseQuizInput({
        role: "organizer",
        answers: {
          ...allAnswers("organizer", "A"),
          public_profile: "Z",
        },
      }),
    ).toBeNull();
  });

  it("rejects D as response_plan answer for participant (only A/B/C exist)", () => {
    expect(
      parseQuizInput({
        role: "participant",
        answers: {
          ...allAnswers("participant", "A"),
          response_plan: "D",
        },
      }),
    ).toBeNull();
  });
});

function allAnswers(role: QuizRole, answer: AnswerKey): QuizAnswers {
  return Object.fromEntries(
    getQuestionKeysForRole(role).map((questionKey) => [questionKey, answer]),
  ) as QuizAnswers;
}

function worstParticipantAnswers(): QuizAnswers {
  return {
    ...allAnswers("participant", "D"),
    response_plan: "C",
  } as QuizAnswers;
}
