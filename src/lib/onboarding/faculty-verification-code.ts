import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function facultyVerificationCodeMatches(
  submittedCode: string,
  expectedCode: string,
): boolean {
  const submittedDigest = digest(submittedCode.trim());
  const expectedDigest = digest(expectedCode.trim());

  return timingSafeEqual(submittedDigest, expectedDigest);
}
