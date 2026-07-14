import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { request, safeStorage } from "./api";

describe("safeStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for missing or invalid stored values", () => {
    window.localStorage.setItem("bad", "{not-json");
    expect(safeStorage.getJson("bad")).toBeNull();
    expect(safeStorage.getItem("missing")).toBeNull();
  });
});

describe("request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches auth headers and parses JSON responses", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });

    const result = await request("/auth/me", {
      authToken: "abc123",
      method: "GET",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ ok: true });
  });

  it("returns a friendly error when the request times out", async () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 20),
        ),
    );

    const result = await request("/auth/me", { timeout: 5 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("timed out");
  });
});
