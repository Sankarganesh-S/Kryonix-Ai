import { describe, expect, it } from "vitest";
import reducer, { setModel, setTheme } from "./uiSlice";

describe("ui preferences", () => {
  it("accepts supported theme and model changes", () => {
    let state = reducer(undefined, { type: "init" });
    state = reducer(state, setTheme("light"));
    state = reducer(state, setModel("qwen2.5:1.5b"));
    expect(state.theme).toBe("light");
    expect(state.model).toBe("qwen2.5:1.5b");
  });

  it("normalizes unsupported theme values", () => {
    const state = reducer(undefined, setTheme("neon"));
    expect(state.theme).toBe("dark");
  });
});
