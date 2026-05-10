import {
  answerKeys,
  answerScores,
  getQuestionKeysForRole,
  getQuestionsForRole,
  getThresholdsForRole,
  isQuizRole,
  questionKeys,
  quizConfig,
  riskBandRank,
  type AnswerKey,
  type GuidanceCategoryKey,
  type GuidanceItem,
  type GuidanceTrigger,
  type QuestionKey,
  type QuizQuestion,
  type QuizRole,
  type RiskBand,
} from "./quiz-config";

export type QuizAnswers = Partial<Record<QuestionKey, AnswerKey>>;

export type QuizInput = {
  readonly role: QuizRole;
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

  const candidate = value as { role?: unknown; answers?: unknown };

  if (typeof candidate.role !== "string" || !isQuizRole(candidate.role)) {
    return null;
  }

  if (
    !candidate.answers ||
    typeof candidate.answers !== "object" ||
    Array.isArray(candidate.answers)
  ) {
    return null;
  }

  const role = candidate.role;
  const expectedKeys = getQuestionKeysForRole(role);
  const expectedKeySet = new Set<QuestionKey>(expectedKeys);
  const rawAnswers = candidate.answers as Record<string, unknown>;
  const keys = Object.keys(rawAnswers);

  if (keys.length !== expectedKeys.length) {
    return null;
  }

  if (!keys.every((key) => isQuestionKey(key) && expectedKeySet.has(key))) {
    return null;
  }

  const answers: QuizAnswers = {};

  for (const questionKey of expectedKeys) {
    const answer = rawAnswers[questionKey];

    if (typeof answer !== "string" || !isAnswerKey(answer)) {
      return null;
    }

    const question = getQuestionsForRole(role).find(
      (item) => item.key === questionKey,
    );

    if (!question || !question.answers.some((option) => option.key === answer)) {
      return null;
    }

    answers[questionKey] = answer;
  }

  return { role, answers };
}

export function getRiskBandForScore(score: number, role: QuizRole): RiskBand {
  const thresholds = getThresholdsForRole(role);
  const threshold = thresholds.find((item) => {
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

  const riskBand = getRiskBandForScore(score, input.role);
  const riskConfig = getThresholdsForRole(input.role).find(
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
  return getQuestionsForRole(input.role).map((question) => {
    const answerKey = input.answers[question.key];

    if (!answerKey) {
      throw new Error("Invalid quiz input");
    }

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
        .filter((item) => item.applicableRoles.includes(input.role))
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
    const answer = input.answers[trigger.question];
    if (!answer) {
      return false;
    }
    return answerScores[answer] >= answerScores[trigger.minAnswer];
  });
}
