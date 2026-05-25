import type { CourseActivity } from "./manifest-activities.js";
import type { XapiObject } from "./statement.js";

export function courseActivityIri(courseIri: string, activityId: string): string {
  const base = courseIri.replace(/\/$/, "");
  return `${base}/activities/${activityId}`;
}

export function buildCourseActivityObject(
  courseIri: string,
  courseTitle: string,
): XapiObject {
  return {
    objectType: "Activity",
    id: courseIri,
    definition: {
      name: { "en-US": courseTitle },
      type: "http://adlnet.gov/expapi/activities/course",
    },
  };
}

export function buildActivityObject(
  courseIri: string,
  activity: CourseActivity,
): XapiObject {
  const type =
    activity.kind === "assessment"
      ? "http://adlnet.gov/expapi/activities/assessment"
      : "http://adlnet.gov/expapi/activities/module";
  return {
    objectType: "Activity",
    id: courseActivityIri(courseIri, activity.id),
    definition: {
      name: { "en-US": activity.title },
      type,
    },
  };
}
