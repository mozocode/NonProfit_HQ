import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/auth/loginSchema";
import { intakeDemographicsSchema, intakeSchema } from "@/features/intake/schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "12345678" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = loginSchema.safeParse({ email: "bad", password: "12345678" });
    expect(r.success).toBe(false);
  });

  it("rejects short password", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "short" });
    expect(r.success).toBe(false);
  });
});

describe("intakeSchema", () => {
  it("requires core narrative fields", () => {
    const r = intakeSchema.safeParse({
      reasonForInitialCall: "",
      whatTheyHaveTried: "x",
      presentingChallenges: "y",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid payload", () => {
    const r = intakeSchema.safeParse({
      reasonForInitialCall: "Help",
      whatTheyHaveTried: "Tried X",
      presentingChallenges: "Housing",
      demographics: {},
    });
    expect(r.success).toBe(true);
  });
});

describe("intakeDemographicsSchema", () => {
  it("rejects unknown keys in strict mode", () => {
    const r = intakeDemographicsSchema.safeParse({ extraField: "nope" });
    expect(r.success).toBe(false);
  });
});
