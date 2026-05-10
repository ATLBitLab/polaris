export function buildNpoOtpRequest(email: string, emailRedirectTo: string) {
  return {
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  } as const;
}
