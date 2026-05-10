export type NpoLoginState = {
  readonly status: "idle" | "sent" | "error";
  readonly message: string;
};

export const initialNpoLoginState: NpoLoginState = {
  status: "idle",
  message: "",
};
