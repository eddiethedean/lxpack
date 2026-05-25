/** Whether interaction suspend_data counts as done for flow and auto-complete. */
export function isInteractionComplete(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "object" && value !== null) {
    return (value as { complete?: boolean }).complete === true;
  }
  return false;
}
