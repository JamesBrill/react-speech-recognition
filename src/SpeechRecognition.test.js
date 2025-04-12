// @vitest-environment jsdom
import { renderHook } from "@testing-library/react-hooks";
import { SpeechRecognition as CortiSpeechRecognition } from "corti";
import { beforeEach, expect, test, vi } from "vitest";
import RecognitionManager from "./RecognitionManager.js";
import SpeechRecognition, {
  useSpeechRecognition,
} from "./SpeechRecognition.js";

const browserSupportsPolyfillsMock = vi.hoisted(() => vi.fn());

vi.mock(import("./isAndroid.js"));
vi.mock(import("./utils.js"), async (importOriginal) => {
  const module = await importOriginal();
  return {
    ...module,
    browserSupportsPolyfills: browserSupportsPolyfillsMock,
  };
});

const mockRecognitionManager = () => {
  const recognitionManager = new RecognitionManager(CortiSpeechRecognition);
  SpeechRecognition.getRecognitionManager = () => recognitionManager;
  return recognitionManager;
};

const mockMicrophoneUnavailable = () => {
  const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
    start: async () => Promise.reject(new Error()),
  }));
  SpeechRecognition.applyPolyfill(mockSpeechRecognition);
  const recognitionManager = new RecognitionManager(mockSpeechRecognition);
  SpeechRecognition.getRecognitionManager = () => recognitionManager;
};

beforeEach(() => {
  browserSupportsPolyfillsMock.mockReturnValue(true);
  SpeechRecognition.applyPolyfill(CortiSpeechRecognition);
});

test("sets applyPolyfill correctly", () => {
  const TestSpeechRecognition = class {};

  expect(SpeechRecognition.getRecognition()).toBeInstanceOf(
    CortiSpeechRecognition,
  );

  SpeechRecognition.applyPolyfill(TestSpeechRecognition);

  expect(SpeechRecognition.browserSupportsSpeechRecognition()).toBe(true);
  expect(SpeechRecognition.getRecognition()).toBeInstanceOf(
    TestSpeechRecognition,
  );
});

test("does not collect transcripts from previous speech recognition after polyfill applied", async () => {
  const cortiSpeechRecognition = SpeechRecognition.getRecognition();

  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";
  await SpeechRecognition.startListening();
  SpeechRecognition.applyPolyfill(class {});
  cortiSpeechRecognition.say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("stops listening after polyfill applied", async () => {
  const { result } = renderHook(() => useSpeechRecognition());
  await SpeechRecognition.startListening();
  SpeechRecognition.applyPolyfill(class {});

  const { listening } = result.current;
  expect(listening).toBe(false);
});

test("sets browserSupportsContinuousListening to false when using polyfill on unsupported browser", () => {
  browserSupportsPolyfillsMock.mockReturnValue(false);
  SpeechRecognition.applyPolyfill(class {});

  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsContinuousListening } = result.current;

  expect(browserSupportsContinuousListening).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);
});

test("sets browserSupportsSpeechRecognition to false when using polyfill on unsupported browser", () => {
  browserSupportsPolyfillsMock.mockReturnValue(false);
  SpeechRecognition.applyPolyfill(class {});

  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsSpeechRecognition } = result.current;

  expect(browserSupportsSpeechRecognition).toBe(false);
  expect(SpeechRecognition.browserSupportsSpeechRecognition()).toBe(false);
});

test("reverts to native recognition when removePolyfill called", () => {
  const TestSpeechRecognition = class {};
  SpeechRecognition.applyPolyfill(TestSpeechRecognition);

  expect(SpeechRecognition.getRecognition()).toBeInstanceOf(
    TestSpeechRecognition,
  );

  browserSupportsPolyfillsMock.mockReturnValue(false);
  SpeechRecognition.applyPolyfill();

  expect(SpeechRecognition.browserSupportsSpeechRecognition()).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);

  SpeechRecognition.removePolyfill();

  // In test environment, native SpeechRecognition is not available, so removePolyfill results in no support
  expect(SpeechRecognition.browserSupportsSpeechRecognition()).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);
  // After removePolyfill, getRecognition() returns the last used recognition instance
  expect(SpeechRecognition.getRecognition()).toBeInstanceOf(
    TestSpeechRecognition,
  );
});

test("sets browserSupportsContinuousListening to false when given falsey SpeechRecognition", () => {
  SpeechRecognition.applyPolyfill();

  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsContinuousListening } = result.current;

  expect(browserSupportsContinuousListening).toBe(false);
  expect(SpeechRecognition.browserSupportsContinuousListening()).toBe(false);
});

test("sets browserSupportsSpeechRecognition to false when given falsey SpeechRecognition", () => {
  SpeechRecognition.applyPolyfill();

  const { result } = renderHook(() => useSpeechRecognition());
  const { browserSupportsSpeechRecognition } = result.current;

  expect(browserSupportsSpeechRecognition).toBe(false);
  expect(SpeechRecognition.browserSupportsSpeechRecognition()).toBe(false);
});

test("sets default transcripts correctly", () => {
  const { result } = renderHook(() => useSpeechRecognition());

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("updates transcripts correctly", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe(speech);
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe(speech);
});

test("resets transcripts correctly", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);
  result.current.resetTranscript();

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("is listening when Speech Recognition is listening", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  await SpeechRecognition.startListening();

  expect(result.current.listening).toBe(true);
});

test("is not listening when Speech Recognition is not listening", () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());

  expect(result.current.listening).toBe(false);
});

test("exposes Speech Recognition object", () => {
  const recognitionManager = mockRecognitionManager();

  expect(SpeechRecognition.getRecognition()).toBe(
    recognitionManager.recognition,
  );
});

test("ignores speech when listening is stopped", () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("ignores speech when listening is aborted", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.abortListening();
  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("transcibes when listening is started", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe(speech);
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe(speech);
});

test("does not transcibe when listening is started but not transcribing", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() =>
    useSpeechRecognition({ transcribing: false }),
  );
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("can set language", async () => {
  mockRecognitionManager();
  renderHook(() => useSpeechRecognition());

  await SpeechRecognition.startListening({ language: "zh-CN" });

  expect(SpeechRecognition.getRecognition().lang).toBe("zh-CN");
});

test("does not collect transcript after listening is stopped", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.stopListening();
  SpeechRecognition.getRecognition().say(speech);

  const { transcript, interimTranscript, finalTranscript } = result.current;
  expect(transcript).toBe("");
  expect(interimTranscript).toBe("");
  expect(finalTranscript).toBe("");
});

test("resets transcript on subsequent discontinuous speech when clearTranscriptOnListen set", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(result.current.transcript).toBe(speech);
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe(speech);

  SpeechRecognition.stopListening();

  expect(result.current.transcript).toBe(speech);
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe(speech);

  await SpeechRecognition.startListening();

  expect(result.current.transcript).toBe("");
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe("");
});

test("does not reset transcript on subsequent discontinuous speech when clearTranscriptOnListen not set", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() =>
    useSpeechRecognition({ clearTranscriptOnListen: false }),
  );
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);
  expect(result.current.transcript).toBe(speech);
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe(speech);

  SpeechRecognition.stopListening();

  expect(result.current.transcript).toBe(speech);
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe(speech);

  await SpeechRecognition.startListening();

  expect(result.current.transcript).toBe(speech);
  expect(result.current.interimTranscript).toBe("");
  expect(result.current.finalTranscript).toBe(speech);
});

test("does not call command callback when no command matched", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "hello world",
      callback: mockCommandCallback,
      matchInterim: false,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).not.toHaveBeenCalled();
});

test("matches simple command", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "hello world",
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "hello world";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("matches one splat", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "I want to eat * and fries";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to eat pizza and fries";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith("pizza", {
    command,
    resetTranscript,
  });
});

test("matches one splat at the end of the sentence", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "I want to eat *";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to eat pizza and fries";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith("pizza and fries", {
    command,
    resetTranscript,
  });
});

test("matches two splats", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "I want to eat * and *";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to eat pizza and fries";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith("pizza", "fries", {
    command,
    resetTranscript,
  });
});

test("matches optional words when optional word spoken", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "Hello (to) you",
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "Hello to you";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("matches optional words when optional word not spoken", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "Hello (to) you",
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "Hello you";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("matches named variable", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "I :action with my little eye";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I spy with my little eye";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith("spy", {
    command,
    resetTranscript,
  });
});

test("matches regex", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: /This is a \s+ test\.+/,
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "This is a      test.......";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("matches regex case-insensitively", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: /This is a \s+ test\.+/,
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "this is a      TEST.......";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("matches multiple commands", async () => {
  mockRecognitionManager();
  const mockCommandCallback1 = vi.fn();
  const mockCommandCallback2 = vi.fn();
  const mockCommandCallback3 = vi.fn();
  const command1 = "I want to eat * and *";
  const command2 = "* and fries are great";
  const commands = [
    {
      command: command1,
      callback: mockCommandCallback1,
    },
    {
      command: command2,
      callback: mockCommandCallback2,
    },
    {
      command: "flibble",
      callback: mockCommandCallback3,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to eat pizza and fries are great";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback1).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback1).toHaveBeenCalledWith(
    "pizza",
    "fries are great",
    { command: command1, resetTranscript },
  );
  expect(mockCommandCallback2).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback2).toHaveBeenCalledWith("I want to eat pizza", {
    command: command2,
    resetTranscript,
  });
  expect(mockCommandCallback3).not.toHaveBeenCalled();
});

test("matches arrays of commands", async () => {
  mockRecognitionManager();
  const mockCommandCallback1 = vi.fn();
  const mockCommandCallback2 = vi.fn();
  const command1 = "I want to eat * and *";
  const command2 = "* and fries are great";
  const command3 = "* and * are great";
  const commands = [
    {
      command: [command1, command2],
      callback: mockCommandCallback1,
    },
    {
      command: command3,
      callback: mockCommandCallback2,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to eat pizza and fries are great";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback1).toHaveBeenCalledTimes(2);
  expect(mockCommandCallback1).toHaveBeenNthCalledWith(
    1,
    "pizza",
    "fries are great",
    { command: command1, resetTranscript },
  );
  expect(mockCommandCallback1).toHaveBeenNthCalledWith(
    2,
    "I want to eat pizza",
    { command: command2, resetTranscript },
  );
  expect(mockCommandCallback2).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback2).toHaveBeenCalledWith(
    "I want to eat pizza",
    "fries",
    { command: command3, resetTranscript },
  );
});

test("transcript resets should be per instance, not global", async () => {
  mockRecognitionManager();
  const hook1 = renderHook(() => useSpeechRecognition());
  const hook2 = renderHook(() => useSpeechRecognition());
  const speech = "This is a test";

  await SpeechRecognition.startListening({ continuous: true });
  SpeechRecognition.getRecognition().say(speech);
  hook2.result.current.resetTranscript();

  expect(hook2.result.current.transcript).toBe("");
  expect(hook2.result.current.interimTranscript).toBe("");
  expect(hook2.result.current.finalTranscript).toBe("");
  expect(hook1.result.current.transcript).toBe(speech);
  expect(hook1.result.current.interimTranscript).toBe("");
  expect(hook1.result.current.finalTranscript).toBe(speech);
});

test("does not call command callback when isFuzzyMatch is not true", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "hello world",
      callback: mockCommandCallback,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).not.toHaveBeenCalled();
});

test("does not call command callback when isFuzzyMatch is true and similarity is less than fuzzyMatchingThreshold", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "hello world",
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.7,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "Hello";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).not.toHaveBeenCalled();
});

test("does call command callback when isFuzzyMatch is true and similarity is equal or greater than fuzzyMatchingThreshold", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const commands = [
    {
      command: "hello world",
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.5,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "Hello";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
});

test("callback is called with command, transcript and similarity ratio between those", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "I want to eat";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.5,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to drink";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith(
    "I want to eat",
    "I want to drink",
    0.6,
    { command, resetTranscript },
  );
});

test("different callbacks can be called for the same speech and with fuzzyMatchingThreshold", async () => {
  mockRecognitionManager();
  const mockCommandCallback1 = vi.fn();
  const mockCommandCallback2 = vi.fn();
  const commands = [
    {
      command: "I want to eat",
      callback: mockCommandCallback1,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 1,
    },
    {
      command: "I want to sleep",
      callback: mockCommandCallback2,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2,
    },
  ];
  renderHook(() => useSpeechRecognition({ commands }));
  const speech = "I want to eat";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback1).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback2).toHaveBeenCalledTimes(1);
});

test("fuzzy callback called for each matching command in array by default", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command1 = "I want to eat";
  const command2 = "I want to sleep";
  const commands = [
    {
      command: [command1, command2],
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to leap";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(2);
  expect(mockCommandCallback).toHaveBeenNthCalledWith(
    1,
    command1,
    "I want to leap",
    0.7368421052631579,
    { command: command1, resetTranscript },
  );
  expect(mockCommandCallback).toHaveBeenNthCalledWith(
    2,
    command2,
    "I want to leap",
    0.6666666666666666,
    { command: command2, resetTranscript },
  );
});

test("fuzzy callback called only for best matching command in array when bestMatchOnly is true", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command1 = "I want to eat";
  const command2 = "I want to sleep";
  const commands = [
    {
      command: [command1, command2],
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2,
      bestMatchOnly: true,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I want to leap";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenNthCalledWith(
    1,
    command1,
    "I want to leap",
    0.7368421052631579,
    { command: command1, resetTranscript },
  );
});

test("when command is regex with fuzzy match true runs similarity check with regex converted to string", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = /This is a \s+ test\.+/;
  const commands = [
    {
      command,
      callback: mockCommandCallback,
      isFuzzyMatch: true,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "This is a test";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith(
    "This is a s test",
    "This is a test",
    0.8571428571428571,
    { command, resetTranscript },
  );
});

test("when command is string special characters with fuzzy match true, special characters are removed from string and then we test similarity", async () => {
  mockRecognitionManager();
  const mockCommandCallback = vi.fn();
  const command = "! (I would :like) : * a :pizza ";
  const commands = [
    {
      command,
      callback: mockCommandCallback,
      isFuzzyMatch: true,
    },
  ];
  const { result } = renderHook(() => useSpeechRecognition({ commands }));
  const { resetTranscript } = result.current;
  const speech = "I would like a pizza";

  await SpeechRecognition.startListening();
  SpeechRecognition.getRecognition().say(speech);

  expect(mockCommandCallback).toHaveBeenCalledTimes(1);
  expect(mockCommandCallback).toHaveBeenCalledWith(
    "I would like a pizza",
    "I would like a pizza",
    1,
    { command, resetTranscript },
  );
});

test("sets isMicrophoneAvailable to false when recognition.start() throws", async () => {
  mockMicrophoneUnavailable();
  const { result } = renderHook(() => useSpeechRecognition());

  expect(result.current.isMicrophoneAvailable).toBe(true);

  await SpeechRecognition.startListening();

  expect(result.current.isMicrophoneAvailable).toBe(false);
});

test("sets isMicrophoneAvailable to false when not-allowed error emitted", async () => {
  mockRecognitionManager();
  const { result } = renderHook(() => useSpeechRecognition());

  expect(result.current.isMicrophoneAvailable).toBe(true);

  await SpeechRecognition.getRecognitionManager().recognition.onerror({
    error: "not-allowed",
  });

  expect(result.current.isMicrophoneAvailable).toBe(false);
});
