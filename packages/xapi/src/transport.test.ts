import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { XapiStatement } from "./statement.js";
import { StatementQueue } from "./transport.js";

const sampleStatement = {
  id: "stmt-1",
  actor: { objectType: "Agent" as const, name: "Test" },
  verb: { id: "http://adlnet.gov/expapi/verbs/experienced" },
  object: { id: "https://example.test/activity/1" },
};

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

  it("invokes onStatement once per enqueue in mock mode", () => {
    const onStatement = vi.fn();
    const queue = new StatementQueue({ mock: true, onStatement });
    queue.enqueue(sampleStatement as XapiStatement);
    queue.enqueue(sampleStatement as XapiStatement);
    expect(onStatement).toHaveBeenCalledTimes(2);
  });
});
