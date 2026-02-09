import {
  Cadence,
  addCadence,
  advanceToFuture,
  isDueTodayOrPast,
  parseDateSafe,
} from "../recurring/recurring-utils";

describe("recurring-utils", () => {
  it("parses valid date-like values", () => {
    const d = parseDateSafe("2026-01-01T10:30:00.000Z");
    expect(d).toBeInstanceOf(Date);
  });

  it("returns null for invalid date values", () => {
    expect(parseDateSafe("bad-date")).toBeNull();
  });

  it("adds cadence correctly", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const next = addCadence(start, Cadence.WEEKLY);
    expect(next.getUTCDate()).toBe(8);
  });

  it("detects due item for today/past", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDueTodayOrPast(yesterday)).toBe(true);
  });

  it("advances due date into the future", () => {
    const now = new Date("2026-02-09T09:00:00.000Z");
    const next = advanceToFuture("2026-02-08T09:00:00.000Z", Cadence.DAILY, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });
});
