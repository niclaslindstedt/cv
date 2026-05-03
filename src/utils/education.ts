import type {
  Education,
  EducationSegment,
  LocalizedString,
  ProgramCourse,
} from "../data/cv.types";

export function educationInstitutions(item: Education): LocalizedString[] {
  if (item.segments && item.segments.length > 0) {
    return item.segments.map((s) => s.institution);
  }
  return item.institution ? [item.institution] : [];
}

export function educationCourseCount(item: Education): number {
  if (item.segments && item.segments.length > 0) {
    return item.segments.reduce((sum, s) => sum + (s.courses?.length ?? 0), 0);
  }
  return item.courses?.length ?? 0;
}

export type ProgramCourseGroup = {
  segment: EducationSegment | null;
  courses: ProgramCourse[];
};

export function educationCourseGroups(item: Education): ProgramCourseGroup[] {
  if (item.segments && item.segments.length > 0) {
    return item.segments
      .filter((s) => (s.courses ?? []).length > 0)
      .map((s) => ({ segment: s, courses: s.courses ?? [] }));
  }
  if (item.courses && item.courses.length > 0) {
    return [{ segment: null, courses: item.courses }];
  }
  return [];
}
