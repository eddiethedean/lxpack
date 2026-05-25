import type { CourseActivity } from "@lxpack/xapi";
import { courseActivityIri } from "@lxpack/xapi";

export interface Cmi5Block {
  id: string;
  title: string;
  moveOn: string;
  activityId: string;
}

export function buildBlocks(
  activities: CourseActivity[],
  courseIri: string,
): Cmi5Block[] {
  return activities.map((activity) => ({
    id: `block_${activity.id}`,
    title: activity.title,
    moveOn: activity.kind === "assessment" ? "Passed" : "Completed",
    activityId: courseActivityIri(courseIri, activity.id),
  }));
}
