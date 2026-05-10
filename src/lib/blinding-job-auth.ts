import { timingSafeEqual } from "node:crypto";

export function isAuthorizedBlindingJobRequest(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const candidate = authorizationHeader.slice("Bearer ".length);
  const secretBytes = Buffer.from(secret);
  const candidateBytes = Buffer.from(candidate);

  return (
    secretBytes.length === candidateBytes.length &&
    timingSafeEqual(secretBytes, candidateBytes)
  );
}
