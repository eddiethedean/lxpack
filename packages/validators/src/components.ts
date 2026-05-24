/** Built-in component ids shipped in @lxpack/components */
export const BUILTIN_COMPONENT_IDS = [
  "callout",
  "image-card",
  "checklist",
] as const;

export type BuiltinComponentId = (typeof BUILTIN_COMPONENT_IDS)[number];

export function isBuiltinComponentId(id: string): id is BuiltinComponentId {
  return (BUILTIN_COMPONENT_IDS as readonly string[]).includes(id);
}
