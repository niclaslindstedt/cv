import { describe, expect, it } from "vitest";

import { formatFullDate, formatMonth, formatRange } from "../../src/utils/date";

describe("formatMonth", () => {
  it("renders English short month names", () => {
    expect(formatMonth("2024-01", "en")).toBe("Jan 2024");
    expect(formatMonth("2024-12", "en")).toBe("Dec 2024");
  });

  it("renders Swedish short month names (Maj, Okt)", () => {
    expect(formatMonth("2024-05", "sv")).toBe("Maj 2024");
    expect(formatMonth("2024-10", "sv")).toBe("Okt 2024");
  });

  it("returns just the year when the month index is out of range", () => {
    expect(formatMonth("2024-13", "en")).toBe("2024");
  });
});

describe("formatRange", () => {
  it("uses the localized Present label when end is null", () => {
    expect(formatRange("2024-01", null, "en")).toBe("Jan 2024 – Present");
    expect(formatRange("2024-01", null, "sv")).toBe("Jan 2024 – Pågående");
  });

  it("renders both endpoints when end is set", () => {
    expect(formatRange("2024-01", "2024-12", "en")).toBe("Jan 2024 – Dec 2024");
  });
});

describe("formatFullDate", () => {
  it("renders English long-form date for valid ISO input", () => {
    expect(formatFullDate("2024-01-15", "en")).toBe("January 15, 2024");
  });

  it("renders Swedish long-form date for valid ISO input", () => {
    // sv-SE locale renders "15 januari 2024".
    const result = formatFullDate("2024-01-15", "sv");
    expect(result.toLowerCase()).toContain("januari");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("returns the raw input when it is not a parseable ISO date", () => {
    expect(formatFullDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("accepts ISO datetimes (slices to the date portion)", () => {
    expect(formatFullDate("2024-06-30T12:34:56Z", "en")).toBe("June 30, 2024");
  });
});
