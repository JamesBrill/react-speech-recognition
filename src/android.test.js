// @vitest-environment jsdom
import { renderHook } from "@testing-library/react-hooks";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "../tests/vendor/corti.js";
import RecognitionManager from "./RecognitionManager.js";
import SpeechRecognition, {
  useSpeechRecognition,
} from "./SpeechRecognition.js";
import { browserSupportsPolyfills } from "./utils.js";

vi.mock("./isAndroid", () => ({
  default: () => true,
}));

vi.mock("./utils", async () => {
  return {
    ...(await vi.importActual("./utils")),
    browserSupportsPolyfills: vi.fn(),
  };
});

const mockRecognitionManager = () => {
  const recognitionManager = new RecognitionManager(window.SpeechRecognition);
  SpeechRecognition.getRecognitionManager = () => recognitionManager;
  return recognitionManager;
};

describe("SpeechRecognition (Android)", () => {
  beforeEach(() => {
    browserSupportsPolyfills.mockImplementation(() => true);
  });

  test("sets browserSupportsContinuousListening to false on Android", async () => {
    mockRecognitionManager();

    const { result } = renderHook(() => useSpeechRecognition());
    const { browserSupportsContinuousListening } = result.current;

    expect(browserSupportsContinuousListening).toEqual(false);
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(
      false,
    );
  });

  test("sets browserSupportsContinuousListening to true when using polyfill", () => {
    const MockSpeechRecognition = class {};
    SpeechRecognition.applyPolyfill(MockSpeechRecognition);

    const { result } = renderHook(() => useSpeechRecognition());
    const { browserSupportsContinuousListening } = result.current;

    expect(browserSupportsContinuousListening).toEqual(true);
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(
      true,
    );
  });

  test("sets browserSupportsContinuousListening to false when using polyfill on unsupported browser", () => {
    browserSupportsPolyfills.mockImplementation(() => false);
    const MockSpeechRecognition = class {};
    SpeechRecognition.applyPolyfill(MockSpeechRecognition);

    const { result } = renderHook(() => useSpeechRecognition());
    const { browserSupportsContinuousListening } = result.current;

    expect(browserSupportsContinuousListening).toEqual(false);
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(
      false,
    );
  });
});
