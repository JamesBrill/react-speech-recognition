import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import NativeSpeechRecognition from "./NativeSpeechRecognition.js";
import RecognitionManager from "./RecognitionManager.js";
import { appendTranscript, clearTranscript } from "./actions.js";
import isAndroid from "./isAndroid.js";
import { transcriptReducer } from "./reducers.js";
import type {
  FuzzyMatch,
  ListeningOptions,
  Match,
  Phrase,
  SpeechRecognition as PolyfillSpeechRecognition,
  Transcript,
  UseSpeechRecognitionOptions,
} from "./types.js";
import {
  browserSupportsPolyfills,
  commandToRegExp,
  compareTwoStringsUsingDiceCoefficient,
  concatTranscripts,
} from "./utils.js";

const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = true,
  commands = [],
}: UseSpeechRecognitionOptions = {}) => {
  const [recognitionManager] = useState<RecognitionManager>(
    SpeechRecognition.getRecognitionManager(),
  );
  const [
    browserSupportsSpeechRecognition,
    setBrowserSupportsSpeechRecognition,
  ] = useState(_browserSupportsSpeechRecognition);
  const [
    browserSupportsContinuousListening,
    setBrowserSupportsContinuousListening,
  ] = useState(_browserSupportsContinuousListening);
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(
    transcriptReducer,
    {
      interimTranscript: recognitionManager.interimTranscript,
      finalTranscript: "",
    },
  );
  const [listening, setListening] = useState(recognitionManager.listening);
  const [isMicrophoneAvailable, setMicrophoneAvailable] = useState(
    recognitionManager.isMicrophoneAvailable,
  );
  const commandsRef = useRef(commands);
  commandsRef.current = commands;

  const dispatchClearTranscript = () => {
    dispatch(clearTranscript());
  };

  const resetTranscript = useCallback(() => {
    recognitionManager.resetTranscript();
    dispatchClearTranscript();
  }, [recognitionManager]);

  const testFuzzyMatch = (
    command: Phrase,
    input: Transcript,
    fuzzyMatchingThreshold: number,
  ): FuzzyMatch | null => {
    const commandToString =
      typeof command === "object" ? command.toString() : command;
    const commandWithoutSpecials = commandToString
      .replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, "")
      .replace(/  +/g, " ")
      .trim();
    const howSimilar = compareTwoStringsUsingDiceCoefficient(
      commandWithoutSpecials,
      input,
    );
    if (howSimilar >= fuzzyMatchingThreshold) {
      return {
        command,
        commandWithoutSpecials,
        howSimilar,
        isFuzzyMatch: true,
      };
    }
    return null;
  };

  const testMatch = (command: Phrase, input: Transcript): Match | null => {
    const pattern = commandToRegExp(command);
    const result = pattern.exec(input);
    if (result) {
      return {
        command,
        parameters: result.slice(1),
        // isFuzzyMatch: false,
      };
    }
    return null;
  };

  const matchCommands = useCallback(
    (newInterimTranscript: Transcript, newFinalTranscript: Transcript) => {
      commandsRef.current.forEach(
        ({
          command,
          callback,
          matchInterim = false,
          isFuzzyMatch = false,
          fuzzyMatchingThreshold = 0.8,
          bestMatchOnly = false,
        }) => {
          const input =
            !newFinalTranscript && matchInterim
              ? newInterimTranscript.trim()
              : newFinalTranscript.trim();
          const subcommands = Array.isArray(command) ? command : [command];
          const results = subcommands
            .map((subcommand) => {
              if (isFuzzyMatch) {
                return testFuzzyMatch(
                  subcommand,
                  input,
                  fuzzyMatchingThreshold,
                );
              }
              return testMatch(subcommand, input);
            })
            .filter((x): x is FuzzyMatch | Match => x !== null);
          if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
            (results as FuzzyMatch[]).sort(
              (a, b) => b.howSimilar - a.howSimilar,
            );
            const { command, commandWithoutSpecials, howSimilar } =
              results[0] as FuzzyMatch;
            callback(commandWithoutSpecials, input, howSimilar, {
              command,
              resetTranscript,
            });
          } else {
            results.forEach((result) => {
              if (result.isFuzzyMatch) {
                const { command, commandWithoutSpecials, howSimilar } =
                  result as FuzzyMatch;
                callback(commandWithoutSpecials, input, howSimilar, {
                  command,
                  resetTranscript,
                });
              } else {
                const { command, parameters } = result as Match;
                callback(...parameters, { command, resetTranscript });
              }
            });
          }
        },
      );
    },
    [resetTranscript],
  );

  const handleTranscriptChange = useCallback(
    (newInterimTranscript: string, newFinalTranscript: string) => {
      if (transcribing) {
        dispatch(appendTranscript(newInterimTranscript, newFinalTranscript));
      }
      matchCommands(newInterimTranscript, newFinalTranscript);
    },
    [matchCommands, transcribing],
  );

  const handleClearTranscript = useCallback(() => {
    if (clearTranscriptOnListen) {
      dispatchClearTranscript();
    }
  }, [clearTranscriptOnListen]);

  useEffect(() => {
    const id = SpeechRecognition.counter.toString();
    SpeechRecognition.counter += 1;
    const callbacks = {
      onListeningChange: setListening,
      onMicrophoneAvailabilityChange: setMicrophoneAvailable,
      onTranscriptChange: handleTranscriptChange,
      onClearTranscript: handleClearTranscript,
      onBrowserSupportsSpeechRecognitionChange:
        setBrowserSupportsSpeechRecognition,
      onBrowserSupportsContinuousListeningChange:
        setBrowserSupportsContinuousListening,
    };
    recognitionManager.subscribe(id, callbacks);

    return () => {
      recognitionManager.unsubscribe(id);
    };
  }, [
    transcribing,
    clearTranscriptOnListen,
    recognitionManager,
    handleTranscriptChange,
    handleClearTranscript,
  ]);

  const transcript = concatTranscripts(finalTranscript, interimTranscript);
  return {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    isMicrophoneAvailable,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
  };
};

let _browserSupportsSpeechRecognition = !!NativeSpeechRecognition;
let _browserSupportsContinuousListening =
  _browserSupportsSpeechRecognition && !isAndroid();
let recognitionManager: RecognitionManager;

const SpeechRecognition = {
  counter: 0,
  applyPolyfill: (PolyfillSpeechRecognition: PolyfillSpeechRecognition) => {
    if (recognitionManager) {
      recognitionManager.setSpeechRecognition(PolyfillSpeechRecognition);
    } else {
      recognitionManager = new RecognitionManager(PolyfillSpeechRecognition);
    }
    const browserSupportsPolyfill =
      !!PolyfillSpeechRecognition && browserSupportsPolyfills();
    _browserSupportsSpeechRecognition = browserSupportsPolyfill;
    _browserSupportsContinuousListening = browserSupportsPolyfill;
  },
  removePolyfill: () => {
    if (recognitionManager) {
      recognitionManager.setSpeechRecognition(NativeSpeechRecognition);
    } else {
      recognitionManager = new RecognitionManager(NativeSpeechRecognition);
    }
    _browserSupportsSpeechRecognition = !!NativeSpeechRecognition;
    _browserSupportsContinuousListening =
      _browserSupportsSpeechRecognition && !isAndroid();
  },
  getRecognitionManager: () => {
    if (!recognitionManager) {
      recognitionManager = new RecognitionManager(NativeSpeechRecognition);
    }
    return recognitionManager;
  },
  getRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    return recognitionManager.getRecognition();
  },
  startListening: async ({ continuous, language }: ListeningOptions = {}) => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    await recognitionManager.startListening({ continuous, language });
  },
  stopListening: async () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    await recognitionManager.stopListening();
  },
  abortListening: async () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    await recognitionManager.abortListening();
  },
  browserSupportsSpeechRecognition: () => _browserSupportsSpeechRecognition,
  browserSupportsContinuousListening: () => _browserSupportsContinuousListening,
};

export { useSpeechRecognition };
export default SpeechRecognition;
