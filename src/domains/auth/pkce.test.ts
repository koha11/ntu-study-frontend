import { describe, it, expect } from "vitest";
import { computeCodeChallenge, generateCodeVerifier, generateOAuthState } from "./pkce";

describe("pkce", () => {
  it("computeCodeChallenge is deterministic for a fixed verifier (S256 + base64url)", async () => {
    const verifier =
      "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    // SHA-256 over UTF-8 verifier, then base64url (matches `crypto.createHash('sha256')` in Node)
    const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    await expect(computeCodeChallenge(verifier)).resolves.toBe(expected);
  });

  describe("generateCodeVerifier", () => {
    it("returns a base64url string of at least 43 characters", () => {
      const verifier = generateCodeVerifier();
      expect(typeof verifier).toBe("string");
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it("produces a different value on each call", () => {
      expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
    });
  });

  describe("generateOAuthState", () => {
    it("returns a non-empty base64url string", () => {
      const state = generateOAuthState();
      expect(typeof state).toBe("string");
      expect(state.length).toBeGreaterThan(0);
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it("produces a different value on each call", () => {
      expect(generateOAuthState()).not.toBe(generateOAuthState());
    });
  });
});
