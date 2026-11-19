import { describe, it, expect } from "vitest";
import { cn, formatDate, formatScore, getAttendanceStatusBadge } from "./utils";

describe("lib/utils", () => {
  describe("cn (tailwind merge)", () => {
    it("merges standard class names correctly", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("resolves conflicting tailwind classes prioritizing the latest class", () => {
      expect(cn("px-4", "px-2")).toBe("px-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles conditional class values and falsy expressions", () => {
      const isHidden = false;
      const isVisible = true;
      expect(cn("base-class", isHidden && "hidden", isVisible && "visible")).toBe(
        "base-class visible"
      );
    });
  });

  describe("formatDate", () => {
    it("returns dash for null or undefined", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("formats ISO date string into readable month, day, year", () => {
      const formatted = formatDate("2026-05-15");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("May");
      expect(formatted).toContain("15");
    });

    it("returns original string for unparseable input", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });
  });

  describe("formatScore", () => {
    it("returns dash for empty values", () => {
      expect(formatScore(null)).toBe("—");
      expect(formatScore(undefined)).toBe("—");
      expect(formatScore("invalid")).toBe("—");
    });

    it("formats integer numbers without decimal fraction", () => {
      expect(formatScore(95)).toBe("95");
      expect(formatScore("100")).toBe("100");
    });

    it("formats floating point numbers to 1 decimal place", () => {
      expect(formatScore(88.45)).toBe("88.5");
      expect(formatScore("73.23")).toBe("73.2");
    });
  });

  describe("getAttendanceStatusBadge", () => {
    it("returns correct styling badge for PRESENT", () => {
      const badge = getAttendanceStatusBadge("PRESENT");
      expect(badge.label).toBe("Present");
      expect(badge.bg).toContain("emerald");
      expect(badge.dot).toBe("bg-emerald-500");
    });

    it("returns correct styling badge for ABSENT", () => {
      const badge = getAttendanceStatusBadge("ABSENT");
      expect(badge.label).toBe("Absent");
      expect(badge.bg).toContain("rose");
      expect(badge.dot).toBe("bg-rose-500");
    });

    it("returns correct styling badge for LATE", () => {
      const badge = getAttendanceStatusBadge("LATE");
      expect(badge.label).toBe("Late");
      expect(badge.bg).toContain("amber");
    });

    it("returns correct styling badge for EXCUSED", () => {
      const badge = getAttendanceStatusBadge("EXCUSED");
      expect(badge.label).toBe("Excused");
      expect(badge.bg).toContain("sky");
    });

    it("returns fallback badge for unknown status", () => {
      const badge = getAttendanceStatusBadge("UNKNOWN_STATUS");
      expect(badge.label).toBe("UNKNOWN_STATUS");
      expect(badge.bg).toContain("gray");
    });
  });
});
