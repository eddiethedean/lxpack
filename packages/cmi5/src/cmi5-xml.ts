import type { CourseManifest } from "@lxpack/validators";
import { listManifestActivities } from "@lxpack/xapi";
import { buildBlocks } from "./blocks.js";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateCmi5Xml(
  manifest: CourseManifest,
  courseIri: string,
  launchUrl = "index.html",
): string {
  const activities = listManifestActivities(manifest);
  const blocks = buildBlocks(activities, courseIri);
  const auId = `${courseIri.replace(/\/$/, "")}/au`;
  const title = manifest.tracking?.xapi?.displayName ?? manifest.title;

  const blockXml = blocks
    .map(
      (b) => `      <block id="${escapeXml(b.id)}">
        <title><langstring lang="en-US">${escapeXml(b.title)}</langstring></title>
        <objectives>
          <objective id="${escapeXml(b.activityId)}"/>
        </objectives>
        <moveOn>${escapeXml(b.moveOn)}</moveOn>
      </block>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<courseStructure xmlns="https://w3id.org/xapi/profiles/cmi5/v1/CourseStructure.xsd">
  <course id="${escapeXml(courseIri)}">
    <title><langstring lang="en-US">${escapeXml(title)}</langstring></title>
    <description><langstring lang="en-US">${escapeXml(manifest.description ?? manifest.title)}</langstring></description>
  </course>
  <au id="${escapeXml(auId)}">
    <title><langstring lang="en-US">${escapeXml(title)}</langstring></title>
    <description><langstring lang="en-US">${escapeXml(manifest.description ?? "")}</langstring></description>
    <url>${escapeXml(launchUrl)}</url>
    <launchMethod>AnyWindow</launchMethod>
    <moveOn>Completed</moveOn>
    <blocks>
${blockXml}
    </blocks>
  </au>
</courseStructure>`;
}
