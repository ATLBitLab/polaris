export type RiskBand = "lower" | "moderate" | "elevated";

export type AnswerKey = "A" | "B" | "C" | "D";

export type QuizRole = "participant" | "organizer";

export type QuestionKey =
  | "event_visibility"
  | "public_posting"
  | "venue_timing"
  | "response_plan"
  | "harassment_history"
  | "incident_documentation"
  | "legal_identity"
  | "family_work_exposure"
  | "account_payments"
  | "public_profile";

export type GuidanceCategoryKey = "event_safety" | "identity_protection";

export type AnswerOption = {
  readonly key: AnswerKey;
  readonly label: string;
  readonly description: string;
  readonly points: number;
  readonly rationale: string;
};

export type QuizQuestion = {
  readonly key: QuestionKey;
  readonly prompt: string;
  readonly helper: string;
  readonly answers: readonly AnswerOption[];
};

export type RiskBandConfig = {
  readonly band: RiskBand;
  readonly label: string;
  readonly minScore: number;
  readonly maxScore: number | null;
  readonly summary: string;
};

export type GuidanceTrigger = {
  readonly question: QuestionKey;
  readonly minAnswer: AnswerKey;
};

export type GuidanceItem = {
  readonly id: string;
  readonly category: GuidanceCategoryKey;
  readonly title: string;
  readonly body: string;
  readonly priority: number;
  readonly minBand: RiskBand;
  readonly applicableRoles: readonly QuizRole[];
  readonly triggers?: readonly GuidanceTrigger[];
};

export const answerScores: Record<AnswerKey, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

const sharedAnswers = {
  event_visibility: [
    {
      key: "A",
      label: "Private or familiar",
      description: "A small gathering with expected participants.",
      points: 0,
      rationale: "The event itself appears limited to familiar participants.",
    },
    {
      key: "B",
      label: "Shared within a community",
      description: "Open to invited networks or a known community list.",
      points: 1,
      rationale: "The event has some community visibility.",
    },
    {
      key: "C",
      label: "Publicly promoted",
      description: "Public posts, flyers, or event pages invite a wider group.",
      points: 2,
      rationale:
        "Public promotion makes arrival, exit, and visibility planning more useful.",
    },
    {
      key: "D",
      label: "Likely to draw outside attention",
      description:
        "The event is public, high-profile, or likely to attract people outside the intended audience.",
      points: 3,
      rationale:
        "A high-publicity event calls for deliberate movement and communications planning.",
    },
  ],
  public_posting: [
    {
      key: "A",
      label: "No public details",
      description: "Details are shared privately with people who need them.",
      points: 0,
      rationale: "Event details are not broadly posted.",
    },
    {
      key: "B",
      label: "General public notice",
      description:
        "A broad description is public, but exact details stay in trusted channels.",
      points: 1,
      rationale: "Some event information is public.",
    },
    {
      key: "C",
      label: "Exact details are public",
      description: "Date, time, venue, or sign-up links are easy to find.",
      points: 2,
      rationale:
        "Public event details make it worth reviewing what information is exposed.",
    },
    {
      key: "D",
      label: "Widely reshared or personally identifying",
      description:
        "Posts include organizer contacts, participant details, or are being shared beyond the intended audience.",
      points: 3,
      rationale:
        "Widely shared event details can expose organizers or attendees beyond the event itself.",
    },
  ],
  venue_timing: [
    {
      key: "A",
      label: "Low-sensitivity setting",
      description: "The venue and date are ordinary for the group.",
      points: 0,
      rationale: "The venue and timing do not add much exposure.",
    },
    {
      key: "B",
      label: "Routine public setting",
      description: "The venue is public, but the date and setting are routine.",
      points: 1,
      rationale: "A public setting adds routine logistics considerations.",
    },
    {
      key: "C",
      label: "Symbolic or high-profile",
      description:
        "The venue or date has political, cultural, media, or community significance.",
      points: 2,
      rationale:
        "A meaningful venue or date can draw more attention than an ordinary gathering.",
    },
    {
      key: "D",
      label: "Predictable exposure",
      description:
        "The exact place and time could expose attendees, hosts, or speakers in a sensitive way.",
      points: 3,
      rationale:
        "Predictable venue and timing details raise the value of a careful arrival and departure plan.",
    },
  ],
  response_plan_organizer: [
    {
      key: "A",
      label: "Clear plan and owners",
      description:
        "Roles, check-ins, exits, and escalation contacts are already assigned.",
      points: 0,
      rationale: "The response plan already has clear owners.",
    },
    {
      key: "B",
      label: "Basic plan",
      description: "A meetup point and check-in plan exist.",
      points: 1,
      rationale: "The response plan has basic structure.",
    },
    {
      key: "C",
      label: "Informal coordination",
      description: "People have talked about it, but no one clearly owns it.",
      points: 2,
      rationale:
        "Informal coordination leaves room for confusion if conditions change.",
    },
    {
      key: "D",
      label: "No response plan",
      description:
        "There is no shared plan for check-ins, exits, accessibility needs, or escalation decisions.",
      points: 3,
      rationale:
        "A missing response plan is one of the strongest reasons to slow down and assign responsibilities.",
    },
  ],
  response_plan_participant: [
    {
      key: "A",
      label: "Formally aware",
      description:
        "Organizer has shared specific details of all response plan contacts including but not limited to emergency exits and escalation contacts.",
      points: 0,
      rationale: "The organizer has shared a clear response plan.",
    },
    {
      key: "B",
      label: "Informally aware",
      description: "People have talked about it but no one clearly owns it.",
      points: 2,
      rationale:
        "Informal coordination leaves room for confusion if conditions change.",
    },
    {
      key: "C",
      label: "Not aware of a response plan",
      description:
        "A response plan has not been shared by the organizer of this event.",
      points: 3,
      rationale:
        "A missing response plan is one of the strongest reasons to slow down before attending.",
    },
  ],
  harassment_history: [
    {
      key: "A",
      label: "No known unwanted attention",
      description: "There are no specific harassment or monitoring concerns.",
      points: 0,
      rationale: "There is no known pattern of unwanted attention.",
    },
    {
      key: "B",
      label: "Some concern",
      description: "There has been disagreement, rumor, or mild online attention.",
      points: 1,
      rationale: "Some unwanted attention is possible.",
    },
    {
      key: "C",
      label: "Prior harassment or monitoring",
      description:
        "There has been doxxing, counter-presence, targeted messages, or monitoring concern.",
      points: 2,
      rationale:
        "Prior harassment or monitoring makes buddy plans and information boundaries more important.",
    },
    {
      key: "D",
      label: "Active or expected hostile attention",
      description:
        "Threats, targeted posts, hostile presence, or organized monitoring are current concerns.",
      points: 3,
      rationale:
        "Active hostile attention calls for a more deliberate plan before sharing details or attending.",
    },
  ],
  incident_documentation: [
    {
      key: "A",
      label: "Little or no documentation",
      description: "No public photos, video, or incident notes are planned.",
      points: 0,
      rationale: "Documentation is unlikely to identify people.",
    },
    {
      key: "B",
      label: "Consent expectations are clear",
      description: "Photos or notes may happen, but consent norms are explicit.",
      points: 1,
      rationale: "Documentation is planned with some consent guardrails.",
    },
    {
      key: "C",
      label: "Public documentation may happen",
      description:
        "Photos, video, press, livestreams, or incident notes may be public.",
      points: 2,
      rationale:
        "Public documentation can expose people who expected lower visibility.",
    },
    {
      key: "D",
      label: "Identification is likely",
      description:
        "Live posting, press, or incident records may identify people before review.",
      points: 3,
      rationale:
        "Likely identification through documentation calls for clear consent and review expectations.",
    },
  ],
  legal_identity: [
    {
      key: "A",
      label: "No legal identity required",
      description: "No legal names or ID details are needed for participation.",
      points: 0,
      rationale: "Legal identity exposure appears minimal.",
    },
    {
      key: "B",
      label: "Limited private list",
      description: "Legal names may be held by one trusted person or system.",
      points: 1,
      rationale: "Legal identity may be present in a limited private context.",
    },
    {
      key: "C",
      label: "Registration or logistics require it",
      description:
        "Registration, travel, venue access, or reimbursement may collect legal names.",
      points: 2,
      rationale:
        "Legal names in logistics systems deserve a minimum-needed review.",
    },
    {
      key: "D",
      label: "Sensitive identity details may spread",
      description:
        "ID, immigration, employment, school, or other legal details may leave a trusted circle.",
      points: 3,
      rationale:
        "Sensitive legal identity details should be handled only by people and systems that need them.",
    },
  ],
  family_work_exposure: [
    {
      key: "A",
      label: "No meaningful connection",
      description: "Participation is unlikely to affect family, work, school, or housing.",
      points: 0,
      rationale: "Family, work, school, and housing exposure appears low.",
    },
    {
      key: "B",
      label: "Small chance of visibility",
      description: "Someone from those parts of life might notice participation.",
      points: 1,
      rationale: "There is a small chance participation becomes visible elsewhere.",
    },
    {
      key: "C",
      label: "Visibility could matter",
      description:
        "Family, workplace, school, landlord, clients, or colleagues could see participation.",
      points: 2,
      rationale:
        "Possible visibility to family, work, school, or housing contexts deserves advance thought.",
    },
    {
      key: "D",
      label: "Consequences could be serious",
      description:
        "Visibility could affect relatives, employment, enrollment, housing, immigration, or financial stability.",
      points: 3,
      rationale:
        "Serious downstream consequences make identity and public documentation boundaries especially important.",
    },
  ],
  account_payments: [
    {
      key: "A",
      label: "No extra accounts or payments",
      description: "No payment, donation, or platform sign-in is needed.",
      points: 0,
      rationale: "Accounts and payment trails do not add much exposure.",
    },
    {
      key: "B",
      label: "Optional low-detail form",
      description: "RSVPs or donations are optional and collect little information.",
      points: 1,
      rationale: "A small amount of account or payment data may exist.",
    },
    {
      key: "C",
      label: "Personal accounts connect to the event",
      description:
        "Payments, reimbursements, travel, or platform accounts link personal details to participation.",
      points: 2,
      rationale:
        "Personal account and payment trails can connect identity to event activity.",
    },
    {
      key: "D",
      label: "Sensitive accounts are involved",
      description:
        "Banking, workplace, school, government, or public social accounts are tied to event activity.",
      points: 3,
      rationale:
        "Sensitive account or payment links should be separated from public event activity where feasible.",
    },
  ],
  public_profile_participant: [
    {
      key: "A",
      label: "Low public profile",
      description: "The organizer is not publicly associated with the event.",
      points: 0,
      rationale: "Organizer public profile exposure appears low.",
    },
    {
      key: "B",
      label: "Known in the community",
      description: "The organizer has some community visibility.",
      points: 1,
      rationale: "Existing community visibility for the organizer adds some exposure.",
    },
    {
      key: "C",
      label: "Named public role",
      description:
        "The organizer is listed as a speaker, media contact, host, or public representative.",
      points: 2,
      rationale:
        "Named public roles for the organizer make personal account and contact boundaries more important.",
    },
    {
      key: "D",
      label: "Targeted public attention",
      description:
        "Media attention, hostile monitoring, or targeted public posts mention the organizer.",
      points: 3,
      rationale:
        "Targeted public attention on the organizer raises both event safety and identity protection needs.",
    },
  ],
  public_profile_organizer: [
    {
      key: "A",
      label: "Low public profile",
      description: "You are not publicly associated with the event.",
      points: 0,
      rationale: "Public profile exposure appears low.",
    },
    {
      key: "B",
      label: "Known in the community",
      description: "You have some community visibility.",
      points: 1,
      rationale: "Existing community visibility adds some exposure.",
    },
    {
      key: "C",
      label: "Named public role",
      description:
        "You are listed as a speaker, media contact, host, or public representative.",
      points: 2,
      rationale:
        "Named public roles make personal account and contact boundaries more important.",
    },
    {
      key: "D",
      label: "Targeted public attention",
      description:
        "Media attention, hostile monitoring, or targeted public posts mention you.",
      points: 3,
      rationale:
        "Targeted public attention raises both event safety and identity protection needs.",
    },
  ],
} as const satisfies Record<string, readonly AnswerOption[]>;

const eventVisibilityQuestion: QuizQuestion = {
  key: "event_visibility",
  prompt: "How public is the event itself?",
  helper: "Choose the option closest to the audience and likely attention.",
  answers: sharedAnswers.event_visibility,
};

const publicPostingQuestion: QuizQuestion = {
  key: "public_posting",
  prompt: "How much event information is posted publicly?",
  helper: "Consider flyers, event pages, social posts, and reshared details.",
  answers: sharedAnswers.public_posting,
};

const venueTimingQuestion: QuizQuestion = {
  key: "venue_timing",
  prompt: "How sensitive are the venue and timing details?",
  helper: "A date or place can change the exposure even when the event is small.",
  answers: sharedAnswers.venue_timing,
};

const responsePlanOrganizerQuestion: QuizQuestion = {
  key: "response_plan",
  prompt: "How prepared is the response plan?",
  helper: "Think about check-ins, exit points, accessibility needs, and escalation.",
  answers: sharedAnswers.response_plan_organizer,
};

const responsePlanParticipantQuestion: QuizQuestion = {
  key: "response_plan",
  prompt: "Are you aware of a response plan?",
  helper:
    "Think about whether the organizer has shared check-ins, exits, and escalation contacts.",
  answers: sharedAnswers.response_plan_participant,
};

const harassmentHistoryQuestion: QuizQuestion = {
  key: "harassment_history",
  prompt: "How likely is unwanted attention or harassment?",
  helper: "Use what you know now, not worst-case speculation.",
  answers: sharedAnswers.harassment_history,
};

const incidentDocumentationQuestion: QuizQuestion = {
  key: "incident_documentation",
  prompt: "How will photos, video, or incident notes be handled?",
  helper: "Include press, livestreams, social posts, and shared folders.",
  answers: sharedAnswers.incident_documentation,
};

const legalIdentityQuestion: QuizQuestion = {
  key: "legal_identity",
  prompt: "How much legal identity information is required?",
  helper: "Registration, travel, venue access, and reimbursements all count.",
  answers: sharedAnswers.legal_identity,
};

const familyWorkExposureQuestion: QuizQuestion = {
  key: "family_work_exposure",
  prompt: "Could participation affect family, work, school, or housing?",
  helper: "Consider where participation might become visible beyond the event.",
  answers: sharedAnswers.family_work_exposure,
};

const accountPaymentsQuestion: QuizQuestion = {
  key: "account_payments",
  prompt: "What accounts or payment tools are involved?",
  helper: "Look for account sign-ins, donations, reimbursements, and travel systems.",
  answers: sharedAnswers.account_payments,
};

const publicProfileParticipantQuestion: QuizQuestion = {
  key: "public_profile",
  prompt: "From your perspective, how visible is the organizer of this event?",
  helper:
    "Perspective based on public roles, media contact, and targeted online attention.",
  answers: sharedAnswers.public_profile_participant,
};

const publicProfileOrganizerQuestion: QuizQuestion = {
  key: "public_profile",
  prompt:
    "From your perspective as an organizer, how visible is your profile?",
  helper:
    "Perspective based on public roles, media contact, and targeted online attention.",
  answers: sharedAnswers.public_profile_organizer,
};

const participantQuestions: readonly QuizQuestion[] = [
  eventVisibilityQuestion,
  publicPostingQuestion,
  venueTimingQuestion,
  responsePlanParticipantQuestion,
  harassmentHistoryQuestion,
  familyWorkExposureQuestion,
  publicProfileParticipantQuestion,
];

const organizerQuestions: readonly QuizQuestion[] = [
  eventVisibilityQuestion,
  publicPostingQuestion,
  venueTimingQuestion,
  responsePlanOrganizerQuestion,
  harassmentHistoryQuestion,
  incidentDocumentationQuestion,
  legalIdentityQuestion,
  familyWorkExposureQuestion,
  accountPaymentsQuestion,
  publicProfileOrganizerQuestion,
];

const participantThresholds: readonly RiskBandConfig[] = [
  {
    band: "lower",
    label: "Lower",
    minScore: 0,
    maxScore: 5,
    summary: "Routine planning should cover the main needs for this event.",
  },
  {
    band: "moderate",
    label: "Moderate",
    minScore: 6,
    maxScore: 10,
    summary: "Add a few more coordination steps before the event.",
  },
  {
    band: "elevated",
    label: "Elevated",
    minScore: 11,
    maxScore: 21,
    summary:
      "Use a more deliberate plan for arrival, communications, and check-ins.",
  },
];

const organizerThresholds: readonly RiskBandConfig[] = [
  {
    band: "lower",
    label: "Lower",
    minScore: 0,
    maxScore: 7,
    summary: "Routine planning should cover the main needs for this event.",
  },
  {
    band: "moderate",
    label: "Moderate",
    minScore: 8,
    maxScore: 15,
    summary: "Add a few more coordination steps before the event.",
  },
  {
    band: "elevated",
    label: "Elevated",
    minScore: 16,
    maxScore: 30,
    summary:
      "Use a more deliberate plan for identity, travel, and communications.",
  },
];

export const quizConfig = {
  questions: {
    participant: participantQuestions,
    organizer: organizerQuestions,
  },
  thresholds: {
    participant: participantThresholds,
    organizer: organizerThresholds,
  },
  guidanceCategories: [
    {
      key: "event_safety",
      title: "Personal safety at events",
      description:
        "Practical steps for getting there, staying oriented, and leaving with a plan.",
    },
    {
      key: "identity_protection",
      title: "Identity protection",
      description:
        "Ways to limit unnecessary exposure of personal and organizer information.",
    },
  ],
  guidanceItems: [
    {
      id: "trusted-contact",
      category: "event_safety",
      title: "Share a simple attendance plan",
      body: "Tell one trusted person where you will be, when you expect to leave, and how you will check in.",
      priority: 10,
      minBand: "lower",
      applicableRoles: ["participant", "organizer"],
    },
    {
      id: "arrival-exit",
      category: "event_safety",
      title: "Pick arrival and exit points",
      body: "Choose a meetup point, a backup place nearby, and a transit or ride plan before you go.",
      priority: 20,
      minBand: "lower",
      applicableRoles: ["participant", "organizer"],
    },
    {
      id: "coordination-roles",
      category: "event_safety",
      title: "Name coordination roles",
      body: "Assign point people for check-ins, accessibility needs, and escalation decisions so one person is not carrying everything.",
      priority: 30,
      minBand: "moderate",
      applicableRoles: ["organizer"],
    },
    {
      id: "public-buddy-plan",
      category: "event_safety",
      title: "Move with a buddy",
      body: "For higher-visibility events, pair up and agree on when to step away if conditions change.",
      priority: 40,
      minBand: "moderate",
      applicableRoles: ["participant", "organizer"],
      triggers: [
        { question: "event_visibility", minAnswer: "C" },
        { question: "harassment_history", minAnswer: "C" },
        { question: "public_profile", minAnswer: "C" },
      ],
    },
    {
      id: "limited-event-details",
      category: "event_safety",
      title: "Keep exact details limited",
      body: "Share exact arrival, departure, venue, and timing details only with people who need them for coordination.",
      priority: 50,
      minBand: "moderate",
      applicableRoles: ["participant", "organizer"],
      triggers: [
        { question: "public_posting", minAnswer: "C" },
        { question: "venue_timing", minAnswer: "C" },
      ],
    },
    {
      id: "documentation-handoff",
      category: "event_safety",
      title: "Decide what gets documented",
      body: "Agree who can record, where incident notes go, and what should be reviewed before anything becomes public.",
      priority: 60,
      minBand: "elevated",
      applicableRoles: ["organizer"],
      triggers: [
        { question: "incident_documentation", minAnswer: "C" },
        { question: "harassment_history", minAnswer: "C" },
        { question: "response_plan", minAnswer: "C" },
      ],
    },
    {
      id: "minimal-registration",
      category: "identity_protection",
      title: "Collect the minimum needed",
      body: "Avoid asking for legal names, home addresses, extra contact fields, or account links unless there is a clear need.",
      priority: 70,
      minBand: "lower",
      applicableRoles: ["organizer"],
    },
    {
      id: "photo-consent",
      category: "identity_protection",
      title: "Set photo expectations",
      body: "Before posting photos, check consent and avoid tagging people who did not ask to be identified.",
      priority: 80,
      minBand: "lower",
      applicableRoles: ["organizer"],
      triggers: [
        { question: "incident_documentation", minAnswer: "B" },
        { question: "public_posting", minAnswer: "C" },
        { question: "public_profile", minAnswer: "C" },
      ],
    },
    {
      id: "public-pages",
      category: "identity_protection",
      title: "Review public event pages",
      body: "Check that flyers, posts, and sign-up pages do not expose private contact details, participant lists, or volunteer information.",
      priority: 90,
      minBand: "moderate",
      applicableRoles: ["organizer"],
      triggers: [
        { question: "public_posting", minAnswer: "C" },
        { question: "legal_identity", minAnswer: "C" },
        { question: "account_payments", minAnswer: "C" },
        { question: "public_profile", minAnswer: "C" },
      ],
    },
    {
      id: "separate-channel",
      category: "identity_protection",
      title: "Use a dedicated contact channel",
      body: "Consider a dedicated email or messaging channel for event logistics instead of personal accounts.",
      priority: 100,
      minBand: "moderate",
      applicableRoles: ["organizer"],
    },
    {
      id: "account-boundaries",
      category: "identity_protection",
      title: "Separate personal and public activity",
      body: "Keep personal accounts, payment trails, and public organizing channels separate when feasible.",
      priority: 110,
      minBand: "elevated",
      applicableRoles: ["organizer"],
      triggers: [
        { question: "legal_identity", minAnswer: "C" },
        { question: "family_work_exposure", minAnswer: "C" },
        { question: "account_payments", minAnswer: "C" },
        { question: "public_profile", minAnswer: "C" },
      ],
    },
    {
      id: "family-work-boundaries",
      category: "identity_protection",
      title: "Plan for family and work visibility",
      body: "Decide in advance what you want visible to relatives, employers, schools, landlords, or clients, and adjust registration and posting choices around that.",
      priority: 120,
      minBand: "elevated",
      applicableRoles: ["organizer"],
      triggers: [
        { question: "family_work_exposure", minAnswer: "C" },
        { question: "public_profile", minAnswer: "D" },
      ],
    },
  ],
} as const satisfies {
  readonly questions: Record<QuizRole, readonly QuizQuestion[]>;
  readonly thresholds: Record<QuizRole, readonly RiskBandConfig[]>;
  readonly guidanceCategories: readonly {
    readonly key: GuidanceCategoryKey;
    readonly title: string;
    readonly description: string;
  }[];
  readonly guidanceItems: readonly GuidanceItem[];
};

export const quizRoles = ["participant", "organizer"] as const satisfies readonly QuizRole[];

export const answerKeys = ["A", "B", "C", "D"] as const satisfies readonly AnswerKey[];

export const riskBandRank: Record<RiskBand, number> = {
  lower: 0,
  moderate: 1,
  elevated: 2,
};

const allQuestionKeys: readonly QuestionKey[] = [
  "event_visibility",
  "public_posting",
  "venue_timing",
  "response_plan",
  "harassment_history",
  "incident_documentation",
  "legal_identity",
  "family_work_exposure",
  "account_payments",
  "public_profile",
];

export const questionKeys = allQuestionKeys;

export function getQuestionsForRole(role: QuizRole): readonly QuizQuestion[] {
  return quizConfig.questions[role];
}

export function getQuestionKeysForRole(role: QuizRole): readonly QuestionKey[] {
  return quizConfig.questions[role].map((question) => question.key);
}

export function getThresholdsForRole(role: QuizRole): readonly RiskBandConfig[] {
  return quizConfig.thresholds[role];
}

export function isQuizRole(value: string): value is QuizRole {
  return value === "participant" || value === "organizer";
}
