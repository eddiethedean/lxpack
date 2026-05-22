import type { CourseManifest } from "@lxpack/validators";

export function generateImsManifest(
  manifest: CourseManifest,
  launchUrl = "index.html",
): string {
  const identifier = manifest.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="${manifest.version}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${identifier}-org">
    <organization identifier="${identifier}-org">
      <title>${escapeXml(manifest.title)}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${escapeXml(manifest.title)}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="${launchUrl}">
      <file href="${launchUrl}"/>
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
