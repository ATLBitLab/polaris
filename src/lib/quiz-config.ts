export type RiskBand = "lower" | "moderate" | "elevated";

export type RoleKey = "community_member" | "organizer";

export type EventTypeKey =
  | "low_key_social"
  | "picnic"
  | "protest"
  | "international_political_work";

type MetroLocationKey =
  | "metro_atlanta"
  | "dc_metro"
  | "new_york_metro"
  | "los_angeles_metro"
  | "sf_bay_area"
  | "chicago_metro";

type StateLocationKey =
  | "alabama"
  | "alaska"
  | "arizona"
  | "arkansas"
  | "california"
  | "colorado"
  | "connecticut"
  | "delaware"
  | "district_of_columbia"
  | "florida"
  | "georgia"
  | "hawaii"
  | "idaho"
  | "illinois"
  | "indiana"
  | "iowa"
  | "kansas"
  | "kentucky"
  | "louisiana"
  | "maine"
  | "maryland"
  | "massachusetts"
  | "michigan"
  | "minnesota"
  | "mississippi"
  | "missouri"
  | "montana"
  | "nebraska"
  | "nevada"
  | "new_hampshire"
  | "new_jersey"
  | "new_mexico"
  | "new_york"
  | "north_carolina"
  | "north_dakota"
  | "ohio"
  | "oklahoma"
  | "oregon"
  | "pennsylvania"
  | "rhode_island"
  | "south_carolina"
  | "south_dakota"
  | "tennessee"
  | "texas"
  | "utah"
  | "vermont"
  | "virginia"
  | "washington_state"
  | "west_virginia"
  | "wisconsin"
  | "wyoming";

export type LocationKey = MetroLocationKey | StateLocationKey | "other_us";

export type GuidanceCategoryKey = "event_safety" | "identity_protection";

export type LocationBucket = {
  readonly key: LocationKey;
  readonly label: string;
  readonly kind: "metro" | "state" | "fallback";
  readonly weight: number;
  readonly rationale: string;
};

export type RoleOption = {
  readonly key: RoleKey;
  readonly label: string;
  readonly shortLabel: string;
  readonly weight: number;
  readonly rationale: string;
};

export type EventTypeOption = {
  readonly key: EventTypeKey;
  readonly label: string;
  readonly description: string;
  readonly weight: number;
  readonly rationale: string;
};

export type RiskBandConfig = {
  readonly band: RiskBand;
  readonly label: string;
  readonly minScore: number;
  readonly maxScore: number | null;
  readonly summary: string;
};

export type GuidanceItem = {
  readonly id: string;
  readonly category: GuidanceCategoryKey;
  readonly title: string;
  readonly body: string;
  readonly priority: number;
  readonly minBand: RiskBand;
  readonly roles?: readonly RoleKey[];
  readonly eventTypes?: readonly EventTypeKey[];
};

const stateRationale =
  "State-level location keeps the assessment approximate.";

const metroLocationBuckets = [
  {
    key: "metro_atlanta",
    label: "Metro Atlanta",
    kind: "metro",
    weight: 1,
    rationale: "Metro-area planning benefits from a clear arrival and exit plan.",
  },
  {
    key: "dc_metro",
    label: "Washington, DC metro",
    kind: "metro",
    weight: 2,
    rationale: "This metro bucket can involve higher public visibility.",
  },
  {
    key: "new_york_metro",
    label: "New York City metro",
    kind: "metro",
    weight: 1,
    rationale: "Metro-area planning benefits from a clear arrival and exit plan.",
  },
  {
    key: "los_angeles_metro",
    label: "Los Angeles metro",
    kind: "metro",
    weight: 1,
    rationale: "Metro-area planning benefits from a clear arrival and exit plan.",
  },
  {
    key: "sf_bay_area",
    label: "San Francisco Bay Area",
    kind: "metro",
    weight: 1,
    rationale: "Metro-area planning benefits from a clear arrival and exit plan.",
  },
  {
    key: "chicago_metro",
    label: "Chicago metro",
    kind: "metro",
    weight: 1,
    rationale: "Metro-area planning benefits from a clear arrival and exit plan.",
  },
] as const satisfies readonly LocationBucket[];

const stateLocationBuckets = (
  [
    ["alabama", "Alabama", 0],
    ["alaska", "Alaska", 0],
    ["arizona", "Arizona", 0],
    ["arkansas", "Arkansas", 0],
    ["california", "California", 0],
    ["colorado", "Colorado", 0],
    ["connecticut", "Connecticut", 0],
    ["delaware", "Delaware", 0],
    ["district_of_columbia", "District of Columbia", 1],
    ["florida", "Florida", 0],
    ["georgia", "Georgia", 0],
    ["hawaii", "Hawaii", 0],
    ["idaho", "Idaho", 0],
    ["illinois", "Illinois", 0],
    ["indiana", "Indiana", 0],
    ["iowa", "Iowa", 0],
    ["kansas", "Kansas", 0],
    ["kentucky", "Kentucky", 0],
    ["louisiana", "Louisiana", 0],
    ["maine", "Maine", 0],
    ["maryland", "Maryland", 0],
    ["massachusetts", "Massachusetts", 0],
    ["michigan", "Michigan", 0],
    ["minnesota", "Minnesota", 0],
    ["mississippi", "Mississippi", 0],
    ["missouri", "Missouri", 0],
    ["montana", "Montana", 0],
    ["nebraska", "Nebraska", 0],
    ["nevada", "Nevada", 0],
    ["new_hampshire", "New Hampshire", 0],
    ["new_jersey", "New Jersey", 0],
    ["new_mexico", "New Mexico", 0],
    ["new_york", "New York", 0],
    ["north_carolina", "North Carolina", 0],
    ["north_dakota", "North Dakota", 0],
    ["ohio", "Ohio", 0],
    ["oklahoma", "Oklahoma", 0],
    ["oregon", "Oregon", 0],
    ["pennsylvania", "Pennsylvania", 0],
    ["rhode_island", "Rhode Island", 0],
    ["south_carolina", "South Carolina", 0],
    ["south_dakota", "South Dakota", 0],
    ["tennessee", "Tennessee", 0],
    ["texas", "Texas", 0],
    ["utah", "Utah", 0],
    ["vermont", "Vermont", 0],
    ["virginia", "Virginia", 0],
    ["washington_state", "Washington", 0],
    ["west_virginia", "West Virginia", 0],
    ["wisconsin", "Wisconsin", 0],
    ["wyoming", "Wyoming", 0],
  ] as const
).map(([key, label, weight]) => ({
  key,
  label,
  kind: "state" as const,
  weight,
  rationale:
    key === "district_of_columbia"
      ? "This state-level bucket can involve higher public visibility."
      : stateRationale,
})) satisfies readonly LocationBucket[];

const fallbackLocationBucket = {
  key: "other_us",
  label: "Other U.S. state or metro",
  kind: "fallback",
  weight: 0,
  rationale: "The fallback bucket keeps the assessment broad.",
} as const satisfies LocationBucket;

export const quizConfig = {
  locationBuckets: [
    ...metroLocationBuckets,
    ...stateLocationBuckets,
    fallbackLocationBucket,
  ],
  roleOptions: [
    {
      key: "community_member",
      label: "Community member",
      shortLabel: "Attending",
      weight: 0,
      rationale:
        "Attending usually needs a personal plan more than a coordination plan.",
    },
    {
      key: "organizer",
      label: "Organizer",
      shortLabel: "Organizing",
      weight: 1,
      rationale:
        "Organizing adds coordination and information stewardship responsibilities.",
    },
  ],
  eventTypes: [
    {
      key: "low_key_social",
      label: "Low-key social gathering",
      description: "Meetups, trainings, or small group time in familiar spaces.",
      weight: 0,
      rationale: "Low-key gatherings usually need routine preparation.",
    },
    {
      key: "picnic",
      label: "Picnic or outdoor community event",
      description:
        "Casual outdoor events where weather, transit, and meetup points matter.",
      weight: 1,
      rationale: "Outdoor events benefit from a little more logistics planning.",
    },
    {
      key: "protest",
      label: "Protest or public demonstration",
      description:
        "Public events where movement, visibility, and crowd conditions can change.",
      weight: 3,
      rationale: "Public demonstrations call for a stronger event plan.",
    },
    {
      key: "international_political_work",
      label: "International political work",
      description:
        "Work connected to international advocacy, diaspora communities, or cross-border issues.",
      weight: 6,
      rationale:
        "International political work can raise identity and communications considerations.",
    },
  ],
  thresholds: [
    {
      band: "lower",
      label: "Lower",
      minScore: 0,
      maxScore: 2,
      summary: "Routine planning should cover the main needs for this event.",
    },
    {
      band: "moderate",
      label: "Moderate",
      minScore: 3,
      maxScore: 5,
      summary: "Add a few more coordination steps before the event.",
    },
    {
      band: "elevated",
      label: "Elevated",
      minScore: 6,
      maxScore: null,
      summary:
        "Use a more deliberate plan for identity, travel, and communications.",
    },
  ],
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
    },
    {
      id: "arrival-exit",
      category: "event_safety",
      title: "Pick arrival and exit points",
      body: "Choose a meetup point, a backup place nearby, and a transit or ride plan before you go.",
      priority: 20,
      minBand: "lower",
    },
    {
      id: "organizer-roles",
      category: "event_safety",
      title: "Name coordination roles",
      body: "Assign point people for check-ins, accessibility needs, and escalation decisions so one person is not carrying everything.",
      priority: 30,
      minBand: "moderate",
      roles: ["organizer"],
    },
    {
      id: "protest-buddy",
      category: "event_safety",
      title: "Move with a buddy",
      body: "For public demonstrations, pair up and agree on when to step away if conditions change.",
      priority: 40,
      minBand: "moderate",
      eventTypes: ["protest"],
    },
    {
      id: "international-travel-window",
      category: "event_safety",
      title: "Keep travel details limited",
      body: "Share exact arrival and departure details only with people who need them for coordination.",
      priority: 50,
      minBand: "elevated",
      eventTypes: ["international_political_work"],
    },
    {
      id: "minimal-registration",
      category: "identity_protection",
      title: "Collect the minimum needed",
      body: "If you are organizing, avoid asking for legal names, home addresses, or extra contact fields unless there is a clear need.",
      priority: 60,
      minBand: "lower",
      roles: ["organizer"],
    },
    {
      id: "public-pages",
      category: "identity_protection",
      title: "Review public event pages",
      body: "Check that flyers, posts, and sign-up pages do not expose private contact details or volunteer lists.",
      priority: 70,
      minBand: "moderate",
      roles: ["organizer"],
    },
    {
      id: "separate-channel",
      category: "identity_protection",
      title: "Use a dedicated contact channel",
      body: "Consider a dedicated email or messaging channel for event logistics instead of personal accounts.",
      priority: 80,
      minBand: "moderate",
    },
    {
      id: "photo-consent",
      category: "identity_protection",
      title: "Set photo expectations",
      body: "Before posting photos, check consent and avoid tagging people who did not ask to be identified.",
      priority: 90,
      minBand: "lower",
    },
    {
      id: "account-boundaries",
      category: "identity_protection",
      title: "Separate personal and public activity",
      body: "For international political work, keep personal accounts separate from public organizing channels when feasible.",
      priority: 100,
      minBand: "elevated",
      eventTypes: ["international_political_work"],
    },
  ],
} as const satisfies {
  readonly locationBuckets: readonly LocationBucket[];
  readonly roleOptions: readonly RoleOption[];
  readonly eventTypes: readonly EventTypeOption[];
  readonly thresholds: readonly RiskBandConfig[];
  readonly guidanceCategories: readonly {
    readonly key: GuidanceCategoryKey;
    readonly title: string;
    readonly description: string;
  }[];
  readonly guidanceItems: readonly GuidanceItem[];
};

export const riskBandRank: Record<RiskBand, number> = {
  lower: 0,
  moderate: 1,
  elevated: 2,
};
