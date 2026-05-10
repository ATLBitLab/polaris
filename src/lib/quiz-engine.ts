import {
  answerKeys,
  answerScores,
  questionKeys,
  quizConfig,
  riskBandRank,
  type AnswerKey,
  type GuidanceCategoryKey,
  type GuidanceItem,
  type GuidanceTrigger,
  type QuestionKey,
  type QuizQuestion,
  type RiskBand,
} from "./quiz-config";

export type QuizAnswers = {
  readonly [key in QuestionKey]: AnswerKey;
};

export type QuizInput = {
  readonly answers: QuizAnswers;
};

export type GuidanceGroup = {
  readonly key: GuidanceCategoryKey;
  readonly title: string;
  readonly description: string;
  readonly items: readonly {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly priority: number;
  }[];
};

export type QuizResult = {
  readonly riskBand: RiskBand;
  readonly riskLabel: string;
  readonly score: number;
  readonly summary: string;
  readonly rationale: string;
  readonly guidanceGroups: readonly GuidanceGroup[];
};

const questionKeySet = new Set<QuestionKey>(questionKeys);
const answerKeySet = new Set<AnswerKey>(answerKeys);
const guidanceItems: readonly GuidanceItem[] = quizConfig.guidanceItems;

type ScoredAnswer = {
  readonly question: QuizQuestion;
  readonly answerKey: AnswerKey;
  readonly points: number;
  readonly rationale: string;
};

export function isQuestionKey(value: string): value is QuestionKey {
  return questionKeySet.has(value as QuestionKey);
}

export function isAnswerKey(value: string): value is AnswerKey {
  return answerKeySet.has(value as AnswerKey);
}

export function parseQuizInput(value: unknown): QuizInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { answers?: unknown };

  if (
    !candidate.answers ||
    typeof candidate.answers !== "object" ||
    Array.isArray(candidate.answers)
  ) {
    return null;
  }

  const rawAnswers = candidate.answers as Record<string, unknown>;
  const keys = Object.keys(rawAnswers);

  if (keys.length !== questionKeys.length) {
    return null;
  }

  if (!keys.every(isQuestionKey)) {
    return null;
  }

  const answers = {} as Record<QuestionKey, AnswerKey>;

  for (const questionKey of questionKeys) {
    const answer = rawAnswers[questionKey];

    if (typeof answer !== "string" || !isAnswerKey(answer)) {
      return null;
    }

    answers[questionKey] = answer;
  }

  return { answers };
}

export function getRiskBandForScore(score: number): RiskBand {
  const threshold = quizConfig.thresholds.find((item) => {
    return (
      score >= item.minScore &&
      (item.maxScore === null || score <= item.maxScore)
    );
  });

  if (!threshold) {
    return "elevated";
  }

  return threshold.band;
}

export function scoreQuiz(input: QuizInput): QuizResult {
  const scoredAnswers = getScoredAnswers(input);
  const score = scoredAnswers.reduce((total, answer) => {
    return total + answer.points;
  }, 0);

  const riskBand = getRiskBandForScore(score);
  const riskConfig = quizConfig.thresholds.find(
    (threshold) => threshold.band === riskBand,
  );

  if (!riskConfig) {
    throw new Error("Missing risk band configuration");
  }

  const highestFactors = [...scoredAnswers]
    .filter((answer) => answer.points > 0)
    .sort((left, right) => right.points - left.points)
    .slice(0, 3);

  return {
    riskBand,
    riskLabel: riskConfig.label,
    score,
    summary: riskConfig.summary,
    rationale: [riskConfig.summary, ...highestFactors.map((item) => item.rationale)]
      .filter(Boolean)
      .join(" "),
    guidanceGroups: getGuidanceGroups(input, riskBand),
  };
}

function getScoredAnswers(input: QuizInput): ScoredAnswer[] {
  return quizConfig.questions.map((question) => {
    const answerKey = input.answers[question.key];
    const answer = question.answers.find((item) => item.key === answerKey);

    if (!answer) {
      throw new Error("Invalid quiz input");
    }

    return {
      question,
      answerKey,
      points: answer.points,
      rationale: answer.rationale,
    };
  });
}

function getGuidanceGroups(input: QuizInput, riskBand: RiskBand): GuidanceGroup[] {
  return quizConfig.guidanceCategories
    .map((category) => {
      const items = guidanceItems
        .filter((item) => item.category === category.key)
        .filter((item) => riskBandRank[riskBand] >= riskBandRank[item.minBand])
        .filter((item) => !item.triggers || matchesAnyTrigger(input, item.triggers))
        .sort((left, right) => left.priority - right.priority)
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          priority: item.priority,
        }));

      return {
        key: category.key,
        title: category.title,
        description: category.description,
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}

function matchesAnyTrigger(
  input: QuizInput,
  triggers: readonly GuidanceTrigger[],
): boolean {
  return triggers.some((trigger) => {
    return answerScores[input.answers[trigger.question]] >= answerScores[trigger.minAnswer];
  });
}
