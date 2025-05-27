// @vitest-environment jsdom
import { renderHook } from "@testing-library/react-hooks";
import { SpeechRecognition as CortiSpeechRecognition } from "corti";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import SpeechRecognition, {
  useSpeechRecognition,
} from "./SpeechRecognition.js";

const browserSupportsPolyfillsMock = vi.hoisted(() => vi.fn());

vi.mock(import("./isAndroid.js"), () => {
  return {
    default: vi.fn(() => true),
  };
});

vi.mock(import("./utils.js"), async (importOriginal) => {
  const module = await importOriginal();
  return {
    ...module,
    browserSupportsPolyfills: browserSupportsPolyfillsMock,
  };
});

beforeAll(() => {
  vi.stubGlobal("SpeechRecognition", CortiSpeechRecognition);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

test("sets browserSupportsContinuousListening to false on Android", async () => {
  browserSupportsPolyfillsMock.mockReturnValue(false);
  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsContinuousListening } = result.current;
  expect(browserSupportsContinuousListening).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);
});

test("sets browserSupportsContinuousListening to true when using polyfill", () => {
  browserSupportsPolyfillsMock.mockReturnValue(true);
  SpeechRecognition.applyPolyfill(CortiSpeechRecognition);
  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsContinuousListening } = result.current;
  expect(browserSupportsContinuousListening).toBe(true);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(true);
});

test("sets browserSupportsContinuousListening to false when using polyfill on unsupported browser", () => {
  browserSupportsPolyfillsMock.mockReturnValue(false);
  SpeechRecognition.applyPolyfill(CortiSpeechRecognition);
  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsContinuousListening } = result.current;
  expect(browserSupportsContinuousListening).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);
});
