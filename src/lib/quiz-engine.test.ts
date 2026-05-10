import { describe, expect, it } from "vitest";
import { questionKeys, type AnswerKey, type QuestionKey } from "./quiz-config";
import {
  getRiskBandForScore,
  parseQuizInput,
  scoreQuiz,
  type QuizAnswers,
} from "./quiz-engine";

describe("scoreQuiz", () => {
  it("scores all A answers as lower", () => {
    const result = scoreQuiz({ answers: allAnswers("A") });

    expect(result.score).toBe(0);
    expect(result.riskBand).toBe("lower");
    expect(result.guidanceGroups.length).toBeGreaterThan(0);
  });

  it("scores all D answers as elevated", () => {
    const result = scoreQuiz({ answers: allAnswers("D") });

    expect(result.score).toBe(30);
    expect(result.riskBand).toBe("elevated");
  });

  it("handles threshold boundaries", () => {
    expect(getRiskBandForScore(7)).toBe("lower");
    expect(getRiskBandForScore(8)).toBe("moderate");
    expect(getRiskBandForScore(15)).toBe("moderate");
    expect(getRiskBandForScore(16)).toBe("elevated");
  });

  it("scores threshold boundary answer sets", () => {
    expect(scoreQuiz({ answers: answersForScore(7) }).riskBand).toBe("lower");
    expect(scoreQuiz({ answers: answersForScore(8) }).riskBand).toBe("moderate");
    expect(scoreQuiz({ answers: answersForScore(15) }).riskBand).toBe(
      "moderate",
    );
    expect(scoreQuiz({ answers: answersForScore(16) }).riskBand).toBe(
      "elevated",
    );
  });

  it("returns guidance groups for each band", () => {
    const lower = scoreQuiz({ answers: allAnswers("A") });
    const moderate = scoreQuiz({ answers: answersForScore(8) });
    const elevated = scoreQuiz({ answers: allAnswers("D") });

    for (const result of [lower, moderate, elevated]) {
      expect(result.guidanceGroups.map((group) => group.key)).toEqual([
        "event_safety",
        "identity_protection",
      ]);
      expect(result.guidanceGroups.every((group) => group.items.length > 0)).toBe(
        true,
      );
    }
  });
});

describe("parseQuizInput", () => {
  it("accepts one A-D answer per question", () => {
    expect(parseQuizInput({ answers: allAnswers("A") })).toEqual({
      answers: allAnswers("A"),
    });
  });

  it("rejects multiple answers for one question", () => {
    expect(
      parseQuizInput({
        answers: {
          ...allAnswers("A"),
          event_visibility: ["A", "B"],
        },
      }),
    ).toBeNull();
  });

  it("rejects missing answers", () => {
    const answers = allAnswers("A") as Record<string, AnswerKey>;
    delete answers.public_profile;

    expect(parseQuizInput({ answers })).toBeNull();
  });

  it("rejects unknown question keys", () => {
    expect(
      parseQuizInput({
        answers: {
          ...withoutAnswer("public_profile"),
          unknown_question: "A",
        },
      }),
    ).toBeNull();
  });

  it("rejects unknown answer keys", () => {
    expect(
      parseQuizInput({
        answers: {
          ...allAnswers("A"),
          public_profile: "Z",
        },
      }),
    ).toBeNull();
  });
});

function allAnswers(answer: AnswerKey): QuizAnswers {
  return Object.fromEntries(
    questionKeys.map((questionKey) => [questionKey, answer]),
  ) as QuizAnswers;
}

function withAnswers(answers: Partial<Record<QuestionKey, AnswerKey>>): QuizAnswers {
  return {
    ...allAnswers("A"),
    ...answers,
  };
}

function withoutAnswer(questionKey: QuestionKey): Record<string, AnswerKey> {
  const answers = allAnswers("A") as Record<string, AnswerKey>;
  delete answers[questionKey];
  return answers;
}

function answersForScore(score: 7 | 8 | 15 | 16): QuizAnswers {
  switch (score) {
    case 7:
      return withAnswers({
        event_visibility: "D",
        public_posting: "D",
        venue_timing: "B",
      });
    case 8:
      return withAnswers({
        event_visibility: "D",
        public_posting: "D",
        venue_timing: "C",
      });
    case 15:
      return withAnswers({
        event_visibility: "D",
        public_posting: "D",
        venue_timing: "D",
        harassment_history: "D",
        public_profile: "D",
      });
    case 16:
      return withAnswers({
        event_visibility: "D",
        public_posting: "D",
        venue_timing: "D",
        harassment_history: "D",
        public_profile: "D",
        response_plan: "B",
      });
  }
}
