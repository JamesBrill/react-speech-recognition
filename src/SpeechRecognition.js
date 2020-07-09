import { useState, useEffect, useReducer, useCallback } from 'react'
import { concatTranscripts, commandToRegExp } from './utils'
import { clearTrancript, appendTrancript } from './actions'
import { transcriptReducer } from './reducers'
import RecognitionManager from './RecognitionManager'

const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = false,
  commands = []
} = {}) => {
  const [recognitionManager] = useState(SpeechRecognition.getRecognitionManager())
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(transcriptReducer, {
    interimTranscript: recognitionManager.interimTranscript,
    finalTranscript: ''
  })
  const [listening, setListening] = useState(recognitionManager.listening)

  const clearTranscript = () => {
    dispatch(clearTrancript())
  }

  const matchCommands = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      commands.forEach(({ command, callback, matchInterim = false }) => {
        const pattern = commandToRegExp(command)
        const input = !newFinalTranscript && matchInterim
          ? newInterimTranscript.trim()
          : newFinalTranscript.trim()
        const result = pattern.exec(input)
        if (result) {
          const parameters = result.slice(1)
          callback(...parameters)
        }
      })
    }, [commands]
  )

  const handleTranscriptChange = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      matchCommands(newInterimTranscript, newFinalTranscript)
      if (transcribing) {
        dispatch(appendTrancript(newInterimTranscript, newFinalTranscript))
      }
    }, [matchCommands, transcribing]
  )

  const handleClearTranscript = useCallback(
    () => {
      if (clearTranscriptOnListen) {
        clearTranscript()
      }
    }, [clearTranscriptOnListen]
  )

  const resetTranscript = () => {
    recognitionManager.resetTranscript()
    clearTranscript()
  }

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
    recognition: recognitionManager.getRecognition(),
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
  startListening: async ({ continuous, language } = {}) => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    await recognitionManager.startListening({ continuous, language })
  },
  stopListening: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    recognitionManager.stopListening()
  },
  abortListening: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    recognitionManager.abortListening()
  },
  browserSupportsSpeechRecognition: () => {
    const recognitionManager = SpeechRecognition.getRecognitionManager()
    return recognitionManager.browserSupportsSpeechRecognition
  }
}

export { useSpeechRecognition }
export default SpeechRecognition
