export function newStatementId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `urn:uuid:${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
