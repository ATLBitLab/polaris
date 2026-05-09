import {
  quizConfig,
  riskBandRank,
  type EventTypeKey,
  type GuidanceCategoryKey,
  type GuidanceItem,
  type LocationKey,
  type RiskBand,
  type RoleKey,
} from "./quiz-config";

export type QuizInput = {
  readonly location: LocationKey;
  readonly role: RoleKey;
  readonly eventTypes: readonly EventTypeKey[];
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

const locationKeys = new Set(quizConfig.locationBuckets.map((item) => item.key));
const roleKeys = new Set(quizConfig.roleOptions.map((item) => item.key));
const eventTypeKeys = new Set(quizConfig.eventTypes.map((item) => item.key));
const guidanceItems: readonly GuidanceItem[] = quizConfig.guidanceItems;

export function isLocationKey(value: string): value is LocationKey {
  return locationKeys.has(value as LocationKey);
}

export function isRoleKey(value: string): value is RoleKey {
  return roleKeys.has(value as RoleKey);
}

export function isEventTypeKey(value: string): value is EventTypeKey {
  return eventTypeKeys.has(value as EventTypeKey);
}

export function parseQuizInput(value: unknown): QuizInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    location?: unknown;
    role?: unknown;
    eventTypes?: unknown;
  };

  if (
    typeof candidate.location !== "string" ||
    typeof candidate.role !== "string" ||
    !Array.isArray(candidate.eventTypes)
  ) {
    return null;
  }

  if (!isLocationKey(candidate.location) || !isRoleKey(candidate.role)) {
    return null;
  }

  const eventTypes = Array.from(new Set(candidate.eventTypes));

  if (
    eventTypes.length === 0 ||
    !eventTypes.every((eventType): eventType is EventTypeKey => {
      return typeof eventType === "string" && isEventTypeKey(eventType);
    })
  ) {
    return null;
  }

  return {
    location: candidate.location,
    role: candidate.role,
    eventTypes,
  };
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
  const location = quizConfig.locationBuckets.find(
    (item) => item.key === input.location,
  );
  const role = quizConfig.roleOptions.find((item) => item.key === input.role);
  const selectedEvents = quizConfig.eventTypes.filter((item) =>
    input.eventTypes.includes(item.key),
  );

  if (!location || !role || selectedEvents.length !== input.eventTypes.length) {
    throw new Error("Invalid quiz input");
  }

  const score =
    location.weight +
    role.weight +
    selectedEvents.reduce((total, eventType) => total + eventType.weight, 0);

  const riskBand = getRiskBandForScore(score);
  const riskConfig = quizConfig.thresholds.find(
    (threshold) => threshold.band === riskBand,
  );

  if (!riskConfig) {
    throw new Error("Missing risk band configuration");
  }

  const highestWeightedEvent = [...selectedEvents].sort(
    (left, right) => right.weight - left.weight,
  )[0];

  return {
    riskBand,
    riskLabel: riskConfig.label,
    score,
    summary: riskConfig.summary,
    rationale: [
      riskConfig.summary,
      location.rationale,
      role.rationale,
      highestWeightedEvent?.rationale,
    ]
      .filter(Boolean)
      .join(" "),
    guidanceGroups: getGuidanceGroups(input, riskBand),
  };
}

function getGuidanceGroups(input: QuizInput, riskBand: RiskBand): GuidanceGroup[] {
  return quizConfig.guidanceCategories
    .map((category) => {
      const items = guidanceItems
        .filter((item) => item.category === category.key)
        .filter((item) => riskBandRank[riskBand] >= riskBandRank[item.minBand])
        .filter((item) => !item.roles || item.roles.includes(input.role))
        .filter(
          (item) =>
            !item.eventTypes ||
            item.eventTypes.some((eventType) =>
              input.eventTypes.includes(eventType),
            ),
        )
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
