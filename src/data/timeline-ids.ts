import cv from "./cv";
import type {
  Assignment,
  Course,
  Education,
  Experience,
  Project,
} from "./cv.types";
import timelineData from "./timeline.json";
import type { TimelineData } from "./timeline.types";

const layout = timelineData as TimelineData;

const knownIds: Set<string> = (() => {
  const ids = new Set<string>();
  for (const track of layout.tracks) {
    for (const bar of track.bars) ids.add(bar.id);
  }
  return ids;
})();

function ifKnown(id: string): string | null {
  return knownIds.has(id) ? id : null;
}

export function experienceTimelineId(item: Experience): string | null {
  const i = cv.experience.indexOf(item);
  if (i < 0) return null;
  return ifKnown(`exp-${i}`);
}

export function assignmentTimelineId(item: Assignment): string | null {
  for (let i = 0; i < cv.experience.length; i++) {
    const exp = cv.experience[i];
    const assignments = exp.assignments ?? [];
    const j = assignments.indexOf(item);
    if (j >= 0) return ifKnown(`exp-${i}-asg-${j}`);
  }
  return null;
}

export function educationTimelineId(item: Education): string | null {
  const i = cv.education.indexOf(item);
  if (i < 0) return null;
  return ifKnown(`edu-${i}`);
}

export function courseTimelineId(item: Course): string | null {
  const i = cv.courses.indexOf(item);
  if (i < 0) return null;
  return ifKnown(`course-${i}`);
}

export function projectTimelineId(item: Project): string | null {
  const primary = item.github?.[0];
  if (!primary) return null;
  return ifKnown(`proj-${primary.owner}-${primary.repo}`);
}
