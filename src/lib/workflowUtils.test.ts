import { describe, expect, it } from "vitest";

import {
  getNextStage,
  getPreviousStage,
  getStageOrder,
  getStageLabel,
  isNextActionOverdue,
  isStageBefore,
  isStageReached,
  isStandardStage,
} from "@/lib/workflowUtils";

describe("workflowUtils", () => {
  it("getStageOrder returns index for standard stages", () => {
    expect(getStageOrder("intake")).toBe(0);
    expect(getStageOrder("evaluation")).toBe(5);
    expect(getStageOrder("unknown_stage")).toBe(-1);
  });

  it("getNextStage and getPreviousStage walk the standard list", () => {
    expect(getNextStage("intake")).toBe("assessment");
    expect(getPreviousStage("assessment")).toBe("intake");
    expect(getNextStage("evaluation")).toBeNull();
    expect(getPreviousStage("intake")).toBeNull();
  });

  it("isStageBefore and isStageReached compare order", () => {
    expect(isStageBefore("intake", "planning")).toBe(true);
    expect(isStageBefore("planning", "intake")).toBe(false);
    expect(isStageReached("planning", "intake")).toBe(false);
    expect(isStageReached("intake", "planning")).toBe(true);
    expect(isStageBefore("bad", "intake")).toBe(false);
  });

  it("getStageLabel falls back to title case", () => {
    expect(getStageLabel("intake")).toBe("Intake");
    expect(getStageLabel("custom_thing")).toContain("Custom");
  });

  it("isStandardStage", () => {
    expect(isStandardStage("follow_up")).toBe(true);
    expect(isStandardStage("nope")).toBe(false);
  });

  it("isNextActionOverdue", () => {
    expect(isNextActionOverdue(null)).toBe(false);
    expect(isNextActionOverdue("2000-01-01")).toBe(true);
    expect(isNextActionOverdue("2099-12-31")).toBe(false);
  });
});
