import { describe, expect, it } from "vitest";

import { isDueDateInWeek, isOpenGoalTaskStatus } from "@/lib/goalTaskUtils";

describe("goalTaskUtils", () => {
  it("isOpenGoalTaskStatus", () => {
    expect(isOpenGoalTaskStatus("todo")).toBe(true);
    expect(isOpenGoalTaskStatus("in_progress")).toBe(true);
    expect(isOpenGoalTaskStatus("blocked")).toBe(true);
    expect(isOpenGoalTaskStatus("done")).toBe(false);
  });

  it("isDueDateInWeek inclusive", () => {
    expect(isDueDateInWeek("2025-03-05", "2025-03-02", "2025-03-08")).toBe(true);
    expect(isDueDateInWeek("2025-03-01", "2025-03-02", "2025-03-08")).toBe(false);
    expect(isDueDateInWeek(null, "2025-03-02", "2025-03-08")).toBe(false);
  });
});
