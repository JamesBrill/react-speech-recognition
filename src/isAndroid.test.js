import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import isAndroid from "./isAndroid.js";

describe("isAndroid", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { userAgent: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns false when navigator.userAgent does not contain android string", () => {
    vi.stubGlobal("navigator", { userAgent: "safari browser" });
    const result = isAndroid();

    expect(result).toBe(false);
  });

  test("returns true when navigator.userAgent contains android string", () => {
    vi.stubGlobal("navigator", { userAgent: "android browser" });
    const result = isAndroid();

    expect(result).toBe(true);
  });

  test("returns false when navigator is undefined", () => {
    // navigatorをundefinedにモック
    vi.stubGlobal("navigator", undefined);
    const result = isAndroid();

    expect(result).toBe(false);
  });
});
