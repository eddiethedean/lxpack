import { courseActivityIri } from "./activity.js";
import {
  listManifestActivities,
  type ManifestWithActivities,
} from "./manifest-activities.js";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateTincanXml(
  manifest: ManifestWithActivities,
  courseIri: string,
  launchPath = "index.html",
): string {
  const activities = listManifestActivities(manifest);
  const courseName = manifest.tracking?.xapi?.displayName ?? manifest.title;

  const activityNodes = activities
    .map(
      (a) => `    <activity id="${escapeXml(courseActivityIri(courseIri, a.id))}" type="http://adlnet.gov/expapi/activities/${a.kind === "assessment" ? "assessment" : "module"}">
      <name lang="en-US">${escapeXml(a.title)}</name>
      <launch lang="en-US">${escapeXml(launchPath)}</launch>
    </activity>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<tincan xmlns="http://projecttincan.com/tincan.xsd">
  <activities>
    <activity id="${escapeXml(courseIri)}" type="http://adlnet.gov/expapi/activities/course">
      <name lang="en-US">${escapeXml(courseName)}</name>
      <description lang="en-US">${escapeXml(manifest.description ?? manifest.title)}</description>
      <launch lang="en-US">${escapeXml(launchPath)}</launch>
    </activity>
${activityNodes}
  </activities>
</tincan>`;
}
