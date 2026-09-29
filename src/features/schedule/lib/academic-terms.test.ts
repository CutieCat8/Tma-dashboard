import { describe, expect, it } from "vitest";
import {
  ACADEMIC_TERMS,
  assignCourseToTerm,
  findTermForDate,
  getDefaultTermId,
  getTermState,
  groupCoursesByTerm,
} from "./academic-terms";

const term = (id: string) => ACADEMIC_TERMS.find((t) => t.id === id)!;

describe("academic terms", () => {
  it("has no gaps or overlaps between consecutive terms", () => {
    for (let i = 1; i < ACADEMIC_TERMS.length; i += 1) {
      const prevEnd = new Date(`${ACADEMIC_TERMS[i - 1].end}T00:00:00`);
      prevEnd.setDate(prevEnd.getDate() + 1);
      const expectedStart = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, "0")}-${String(prevEnd.getDate()).padStart(2, "0")}`;
      expect(ACADEMIC_TERMS[i].start).toBe(expectedStart);
    }
  });

  it("finds the term for a date", () => {
    expect(findTermForDate("2025-04-15")?.id).toBe("preschool");
    expect(findTermForDate("2026-09-30")?.id).toBe("y2s1");
    expect(findTermForDate("2026-10-01")?.id).toBe("y2s2");
    expect(findTermForDate("2027-06-01")?.id).toBe("internship");
    expect(findTermForDate("2024-01-01")).toBeNull();
  });

  it("reports past, current and upcoming states", () => {
    expect(getTermState(term("y1s1"), "2026-09-30")).toBe("past");
    expect(getTermState(term("y2s1"), "2026-09-30")).toBe("current");
    expect(getTermState(term("y2s2"), "2026-09-30")).toBe("upcoming");
  });

  it("opens the running term, else the next one, else the last", () => {
    expect(getDefaultTermId("2026-07-01")).toBe("y2s1");
    expect(getDefaultTermId("2025-01-01")).toBe("preschool");
    expect(getDefaultTermId("2030-01-01")).toBe("internship");
  });

  it("assigns a course to the term it overlaps most", () => {
    expect(assignCourseToTerm({ termStart: "2025-06-23", termEnd: "2025-10-17" })?.id).toBe("y1s1");
    expect(assignCourseToTerm({ termStart: "2026-04-02", termEnd: "2026-05-29" })?.id).toBe("summer1");
    // Spills a little into the next term but mostly Y2 Sem 1.
    expect(assignCourseToTerm({ termStart: "2026-06-22", termEnd: "2026-10-05" })?.id).toBe("y2s1");
    expect(assignCourseToTerm({ termStart: "2019-01-01", termEnd: "2019-02-01" })).toBeNull();
  });

  it("groups courses by term and keeps the leftovers", () => {
    const a = { termStart: "2025-06-23", termEnd: "2025-10-17" };
    const b = { termStart: "2026-10-05", termEnd: "2026-11-20" };
    const c = { termStart: "2019-01-01", termEnd: "2019-02-01" };
    const { byTerm, unassigned } = groupCoursesByTerm([a, b, c]);
    expect(byTerm.get("y1s1")).toEqual([a]);
    expect(byTerm.get("y2s2")).toEqual([b]);
    expect(byTerm.get("summer1")).toEqual([]);
    expect(unassigned).toEqual([c]);
  });
});
