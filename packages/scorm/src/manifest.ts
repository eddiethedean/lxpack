import type { CourseManifest } from "@lxpack/validators";

export function manifestIdentifier(manifest: CourseManifest): string {
  const slug = manifest.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug) return slug;

  let hash = 0;
  for (let i = 0; i < manifest.title.length; i++) {
    hash = (hash << 5) - hash + manifest.title.charCodeAt(i);
    hash |= 0;
  }
  return `course-${Math.abs(hash)}`;
}

export function generateImsManifest(
  manifest: CourseManifest,
  files: string[],
  launchUrl = "index.html",
): string {
  const identifier = manifestIdentifier(manifest);
  const masteryScore = Math.round(
    (manifest.tracking?.completion?.threshold ?? 0.9) * 100,
  );

  const fileEntries = [...new Set(files)]
    .map((href) => `      <file href="${escapeXml(href)}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}" version="${escapeXml(manifest.version)}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${escapeXml(identifier)}-org">
    <organization identifier="${escapeXml(identifier)}-org">
      <title>${escapeXml(manifest.title)}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${escapeXml(manifest.title)}</title>
        <adlcp:masteryscore>${masteryScore}</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="${escapeXml(launchUrl)}">
${fileEntries}
    </resource>
  </resources>
</manifest>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
