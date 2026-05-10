export type ResearchLoginState = {
  readonly status: "idle" | "sent" | "error";
  readonly message: string;
};

export const initialResearchLoginState: ResearchLoginState = {
  status: "idle",
  message: "",
};
