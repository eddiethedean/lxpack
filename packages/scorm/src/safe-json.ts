/** JSON safe to embed in HTML script blocks (prevents `</script>` breakout). */
export function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
