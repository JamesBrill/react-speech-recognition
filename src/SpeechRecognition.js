import { useState, useEffect, useReducer, useCallback, useRef } from 'react'
import { concatTranscripts, commandToRegExp, compareTwoStringsUsingDiceCoefficient } from './utils'
import { clearTrancript, appendTrancript } from './actions'
import { transcriptReducer } from './reducers'
import RecognitionManager from './RecognitionManager'

const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = true,
  commands = []
} = {}) => {
  const [recognitionManager] = useState(SpeechRecognition.getRecognitionManager())
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(transcriptReducer, {
    interimTranscript: recognitionManager.interimTranscript,
    finalTranscript: ''
  })
  const [listening, setListening] = useState(recognitionManager.listening)
  const commandsRef = useRef(commands)
  commandsRef.current = commands

  const clearTranscript = () => {
    dispatch(clearTrancript())
  }

  const resetTranscript = useCallback(() => {
    recognitionManager.resetTranscript()
    clearTranscript()
  }, [recognitionManager])

  const matchCommands = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      commandsRef.current.forEach(({ command, callback, matchInterim = false, isFuzzyMatch = false, fuzzyMatchingThreshold = 0.8 }) => {
        const subcommands = Array.isArray(command) ? command : [command]
        subcommands.forEach(subcommand => {
          const input = !newFinalTranscript && matchInterim
            ? newInterimTranscript.trim()
            : newFinalTranscript.trim()
          if (isFuzzyMatch) {
            const commandToString = (typeof subcommand === 'object') ? subcommand.toString() : subcommand
            const commandWithoutSpecials = commandToString
              .replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, '')
              .replace(/  +/g, ' ')
              .trim()
            const howSimilar = compareTwoStringsUsingDiceCoefficient(commandWithoutSpecials, input)
            if (howSimilar >= fuzzyMatchingThreshold) {
              callback(commandWithoutSpecials, input, howSimilar, { command: subcommand, resetTranscript })
            }
          } else {
            const pattern = commandToRegExp(subcommand)
            const result = pattern.exec(input)
            if (result) {
              const parameters = result.slice(1)
              callback(...parameters, { command: subcommand, resetTranscript })
            }
          }
        })
      })
    }, [resetTranscript]
  )

  const handleTranscriptChange = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      if (transcribing) {
        dispatch(appendTrancript(newInterimTranscript, newFinalTranscript))
      }
      matchCommands(newInterimTranscript, newFinalTranscript)
    }, [matchCommands, transcribing]
  )

  const handleClearTranscript = useCallback(
    () => {
      if (clearTranscriptOnListen) {
        clearTranscript()
      }
    }, [clearTranscriptOnListen]
  )

  useEffect(() => {
    const id = SpeechRecognition.counter
    SpeechRecognition.counter += 1
    const callbacks = {
      onListeningChange: setListening,
      onTranscriptChange: handleTranscriptChange,
      onClearTranscript: handleClearTranscript
    }
    recognitionManager.subscribe(id, callbacks)

    return () => {
      recognitionManager.unsubscribe(id)
    }
  }, [
    transcribing,
    clearTranscriptOnListen,
    recognitionManager,
    handleTranscriptChange,
    handleClearTranscript
  ])

  const transcript = concatTranscripts(finalTranscript, interimTranscript)
  return {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript
  }
}

let recognitionManager
const SpeechRecognition = {
  counter: 0,
  getRecognitionManager: () => {
    if (!recognitionManager) {
      recognitionManager = new RecognitionManager()
    }
    return recognitionManager
  },
  getRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    return recognitionManager.getRecognition()
  },
  startListening: async ({ continuous, language } = {}) => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    await recognitionManager.startListening({ continuous, language })
  },
  stopListening: async () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    await recognitionManager.stopListening()
  },
  abortListening: async () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    await recognitionManager.abortListening()
  },
  browserSupportsSpeechRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    return recognitionManager.browserSupportsSpeechRecognition
  }
}

export { useSpeechRecognition }
export default SpeechRecognition
