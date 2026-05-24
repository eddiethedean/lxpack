import type { CourseManifest } from "@lxpack/validators";
import { listCourseActivities } from "./activities.js";
import { manifestIdentifier } from "./manifest.js";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function scoLaunchPath(activityId: string): string {
  return `sco/${activityId}/index.html`;
}

export function buildScorm2004ManifestFiles(
  manifest: CourseManifest,
  courseFiles: string[],
  hasComponentsBundle = false,
): string[] {
  const activities = listCourseActivities(manifest);
  const scoFiles = activities.map((a) => scoLaunchPath(a.id));
  return [
    "lxpack-runtime.js",
    ...(hasComponentsBundle ? ["lxpack-components.js"] : []),
    ...scoFiles,
    ...courseFiles,
  ];
}

export function generateScorm2004Manifest(
  manifest: CourseManifest,
  courseFiles: string[],
  options?: { hasComponentsBundle?: boolean },
): string {
  const hasComponentsBundle = options?.hasComponentsBundle ?? false;
  const identifier = manifestIdentifier(manifest);
  const orgId = `${identifier}-org`;
  const activities = listCourseActivities(manifest);

  const itemEntries = activities
    .map((activity) => {
      const itemId = `item_${activity.id}`;
      const resourceId = `res_${activity.id}`;
      const sequencing =
        activity.kind === "assessment"
          ? `
        <imsss:sequencing>
          <imsss:deliveryControls tracked="true" completionSetByContent="true" objectiveSetByContent="true"/>
        </imsss:sequencing>`
          : `
        <imsss:sequencing>
          <imsss:deliveryControls tracked="true" completionSetByContent="true"/>
        </imsss:sequencing>`;

      return `      <item identifier="${escapeXml(itemId)}" identifierref="${escapeXml(resourceId)}">
        <title>${escapeXml(activity.title)}</title>${sequencing}
      </item>`;
    })
    .join("\n");

  const resources = activities
    .map((activity) => {
      const resourceId = `res_${activity.id}`;
      const href = scoLaunchPath(activity.id);
      const componentFile = hasComponentsBundle
        ? `\n      <file href="lxpack-components.js"/>`
        : "";
      return `    <resource identifier="${escapeXml(resourceId)}" type="webcontent" adlcp:scormType="sco" href="${escapeXml(href)}">
      <file href="${escapeXml(href)}"/>
      <file href="lxpack-runtime.js"/>${componentFile}
    </resource>`;
    })
    .join("\n");

  const orgSequencing = `
    <imsss:sequencing>
      <imsss:controlMode choice="true" flow="true"/>
    </imsss:sequencing>`;

  const uniqueCourseFiles = [...new Set(courseFiles)]
    .filter((f) => !f.startsWith("sco/"))
    .map(
      (href) => `      <file href="${escapeXml(href)}"/>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}" version="${escapeXml(manifest.version)}"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="${escapeXml(orgId)}">
    <organization identifier="${escapeXml(orgId)}">
      <title>${escapeXml(manifest.title)}</title>${orgSequencing}
${itemEntries}
    </organization>
  </organizations>
  <resources>
${resources}
    <resource identifier="shared_assets" type="webcontent" adlcp:scormType="asset">
${uniqueCourseFiles}
      <file href="lxpack-runtime.js"/>${hasComponentsBundle ? '\n      <file href="lxpack-components.js"/>' : ""}
    </resource>
  </resources>
</manifest>`;
}
