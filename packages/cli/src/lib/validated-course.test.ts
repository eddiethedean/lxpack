import { describe, expect, it, vi } from "vitest";
import { printValidationIssues } from "./validated-course.js";

describe("printValidationIssues", () => {
  it("prints warnings and errors with distinct labels", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    printValidationIssues({
      valid: false,
      issues: [
        {
          path: "flow",
          message: "cycle detected",
          severity: "error",
        },
        {
          path: "interactions/lab",
          message: "use window.parent.lxpack",
          severity: "warning",
        },
      ],
    });

    expect(error.mock.calls.some((c) => String(c[0]).includes("[error]"))).toBe(
      true,
    );
    expect(warn.mock.calls.some((c) => String(c[0]).includes("[warning]"))).toBe(
      true,
    );
  });
});
