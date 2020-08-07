import { useState, useEffect, useReducer, useCallback } from 'react'
import { concatTranscripts, commandToRegExp, compareTwoStringsUsingDiceCoefficient } from './utils'
import { clearTrancript, appendTrancript } from './actions'
import { transcriptReducer } from './reducers'
import RecognitionManager from './RecognitionManager'
import { StartListeningParameter, CustomHookParameter } from './types'

const useSpeechRecognition = (param: CustomHookParameter = {}) => {
  const { transcribing, clearTranscriptOnListen, commands} = param
  const [recognitionManager] = useState(
    SpeechRecognition.getRecognitionManager()
  );
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(
    transcriptReducer,
    {
      interimTranscript: recognitionManager.interimTranscript,
      finalTranscript: "",
    }
  );
  const [listening, setListening] = useState(recognitionManager.listening);

  const clearTranscript = () => {
    dispatch(clearTrancript());
  };

  const matchCommands = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      commands?.forEach(
        ({
          command,
          callback,
          matchInterim = false,
          isFuzzyMatch = false,
          fuzzyMatchingThreshold = 0.8,
        }) => {
          const input =
            !newFinalTranscript && matchInterim
              ? newInterimTranscript.trim()
              : newFinalTranscript.trim();
          if (isFuzzyMatch) {
            const commandToString =
              typeof command === "object"
                ? (command as Object).toString()
                : command;
            const commandWithoutSpecials = commandToString
              .replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, "")
              .replace(/  +/g, " ")
              .trim();
            const howSimilar = compareTwoStringsUsingDiceCoefficient(
              commandWithoutSpecials,
              input
            );
            if (howSimilar >= fuzzyMatchingThreshold) {
              callback(commandWithoutSpecials, input, howSimilar);
            }
          } else {
            const pattern = commandToRegExp(command);
            const result = pattern.exec(input);
            if (result) {
              const parameters = result.slice(1);
              callback(...parameters);
            }
          }
        }
      );
    },
    [commands]
  );

  const handleTranscriptChange = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      matchCommands(newInterimTranscript, newFinalTranscript);
      if (transcribing) {
        dispatch(appendTrancript(newInterimTranscript, newFinalTranscript));
      }
    },
    [matchCommands, transcribing]
  );

  const handleClearTranscript = useCallback(() => {
    if (clearTranscriptOnListen) {
      clearTranscript();
    }
  }, [clearTranscriptOnListen]);

  const resetTranscript = () => {
    recognitionManager.resetTranscript();
    clearTranscript();
  };

  useEffect(() => {
    const id = SpeechRecognition.counter;
    SpeechRecognition.counter += 1;
    const callbacks = {
      onListeningChange: setListening,
      onTranscriptChange: handleTranscriptChange,
      onClearTranscript: handleClearTranscript,
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
    resetTranscript,
  };
};

let recognitionManager: RecognitionManager
const SpeechRecognition = {
  counter: 0,
  getRecognitionManager: () => {
    if (!recognitionManager) {
      recognitionManager = new RecognitionManager();
    }
    return recognitionManager;
  },
  getRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    return recognitionManager.getRecognition();
  },
  startListening: async (startListeningParam: StartListeningParameter = {}) => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    await recognitionManager.startListening(startListeningParam);
  },
  stopListening: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    recognitionManager.stopListening();
  },
  abortListening: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    recognitionManager.abortListening();
  },
  browserSupportsSpeechRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager();
    return recognitionManager.browserSupportsSpeechRecognition;
  },
};

export { useSpeechRecognition }
export default SpeechRecognition
