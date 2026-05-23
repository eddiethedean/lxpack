import { describe, expect, it, vi } from "vitest";

vi.mock("yaml", () => ({
  stringify: vi.fn(() => "version: 1.0.0\n"),
}));

const { formatCourseTitleForYaml } = await import("./utils.js");

describe("formatCourseTitleForYaml (mocked yaml)", () => {
  it("falls back to JSON encoding when YAML omits a title line", () => {
    expect(formatCourseTitleForYaml("Plain")).toBe(JSON.stringify("Plain"));
  });
});
