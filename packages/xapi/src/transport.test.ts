import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { XapiStatement } from "./statement.js";
import { sendStatement, StatementQueue } from "./transport.js";

const sampleStatement = {
  id: "stmt-1",
  actor: { objectType: "Agent" as const, name: "Test" },
  verb: { id: "http://adlnet.gov/expapi/verbs/experienced" },
  object: { id: "https://example.test/activity/1" },
};

describe("sendStatement", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves Bearer authorization headers", async () => {
    await sendStatement(
      "https://lrs.example/xapi/statements",
      "Bearer eyJ.test",
      sampleStatement as XapiStatement,
    );
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer eyJ.test",
    });
  });

  it("prefixes raw credentials with Basic", async () => {
    await sendStatement(
      "https://lrs.example/xapi/statements",
      "dXNlcjpwYXNz",
      sampleStatement as XapiStatement,
    );
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.headers).toMatchObject({
      Authorization: "Basic dXNlcjpwYXNz",
    });
  });
});

describe("StatementQueue", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("re-queues statement on LRS failure", async () => {
    const onError = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "error",
    } as Response);

    const queue = new StatementQueue({
      credentials: { endpoint: "https://lrs.example/xapi/" },
      onError,
    });
    queue.enqueue(sampleStatement as XapiStatement);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledOnce();

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    await queue.flush();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("sendStatement passes keepalive to fetch", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await sendStatement(
      "https://lrs.example/xapi/statements",
      undefined,
      sampleStatement as XapiStatement,
      { keepalive: true },
    );
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.keepalive).toBe(true);
  });

  it("flushTerminal drains queue after an in-flight flush completes", async () => {
    let resolveFirst!: () => void;
    const firstDone = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          void firstDone.then(() => resolve({ ok: true } as Response));
        }),
    );
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const queue = new StatementQueue({
      credentials: { endpoint: "https://lrs.example/xapi/" },
    });
    queue.enqueue(sampleStatement as XapiStatement);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    queue.enqueue({
      ...sampleStatement,
      id: "stmt-2",
    } as XapiStatement);
    queue.flushTerminal();
    resolveFirst();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("invokes onStatement once per enqueue in mock mode", () => {
    const onStatement = vi.fn();
    const queue = new StatementQueue({ mock: true, onStatement });
    queue.enqueue(sampleStatement as XapiStatement);
    queue.enqueue(sampleStatement as XapiStatement);
    expect(onStatement).toHaveBeenCalledTimes(2);
  });
});
