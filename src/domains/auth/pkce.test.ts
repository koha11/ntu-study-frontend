import { describe, it, expect } from "vitest";
import { computeCodeChallenge } from "./pkce";

describe("pkce", () => {
  it("computeCodeChallenge is deterministic for a fixed verifier (S256 + base64url)", async () => {
    const verifier =
      "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    // SHA-256 over UTF-8 verifier, then base64url (matches `crypto.createHash('sha256')` in Node)
    const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    await expect(computeCodeChallenge(verifier)).resolves.toBe(expected);
  });
});
