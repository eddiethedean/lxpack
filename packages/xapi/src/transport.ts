import type { XapiStatement } from "./statement.js";

export interface LrsCredentials {
  endpoint: string;
  auth?: string;
}

export interface StatementTransportOptions {
  credentials?: LrsCredentials;
  mock?: boolean;
  onStatement?: (statement: XapiStatement) => void;
  onError?: (err: unknown, statement: XapiStatement) => void;
}

export class StatementQueue {
  private queue: XapiStatement[] = [];
  private flushing = false;
  private terminalFlushPending = false;

  constructor(private readonly options: StatementTransportOptions) {}

  enqueue(statement: XapiStatement): void {
    this.options.onStatement?.(statement);
    if (this.options.mock || !this.options.credentials?.endpoint) {
      return;
    }
    this.queue.push(statement);
    void this.flush();
  }

  async flush(options?: { keepalive?: boolean }): Promise<void> {
    if (!this.options.credentials?.endpoint) return;
    if (this.flushing) {
      if (options?.keepalive) {
        this.terminalFlushPending = true;
      }
      return;
    }
    this.flushing = true;
    const endpoint = normalizeEndpoint(this.options.credentials.endpoint);
    try {
      while (this.queue.length > 0) {
        const statement = this.queue.shift()!;
        try {
          await sendStatement(
            endpoint,
            this.options.credentials.auth,
            statement,
            { keepalive: options?.keepalive },
          );
        } catch (err) {
          this.queue.unshift(statement);
          this.options.onError?.(err, statement);
          break;
        }
      }
    } finally {
      this.flushing = false;
      if (this.terminalFlushPending) {
        this.terminalFlushPending = false;
        await this.flush({ keepalive: true });
      }
    }
  }

  /** Best-effort flush for page unload (uses fetch keepalive when available). */
  flushTerminal(): void {
    void this.flush({ keepalive: true });
  }
}

function formatAuthorizationHeader(auth: string): string {
  const trimmed = auth.trim();
  if (/^(Basic|Bearer)\s+/i.test(trimmed)) {
    return trimmed;
  }
  return `Basic ${trimmed}`;
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.replace(/\/$/, "");
  return trimmed.endsWith("/statements") ? trimmed : `${trimmed}/statements`;
}

export async function sendStatement(
  endpoint: string,
  auth: string | undefined,
  statement: XapiStatement,
  options?: { keepalive?: boolean },
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Experience-API-Version": "1.0.3",
  };
  if (auth) {
    headers.Authorization = formatAuthorizationHeader(auth);
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(statement),
    keepalive: options?.keepalive,
  });

  if (!res.ok) {
    throw new Error(`LRS returned ${res.status}: ${await res.text()}`);
  }
}
