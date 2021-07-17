import { useState, useEffect, useReducer, useCallback, useRef } from 'react'
import {
  concatTranscripts,
  commandToRegExp,
  compareTwoStringsUsingDiceCoefficient,
  browserSupportsPolyfills
} from './utils'
import { clearTrancript, appendTrancript } from './actions'
import { transcriptReducer } from './reducers'
import RecognitionManager from './RecognitionManager'
import isAndroid from './isAndroid'
import NativeSpeechRecognition from './NativeSpeechRecognition'

let _browserSupportsSpeechRecognition = !!NativeSpeechRecognition
let _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid()
let recognitionManager

const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = true,
  commands = []
} = {}) => {
  const [recognitionManager] = useState(SpeechRecognition.getRecognitionManager())
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] =
    useState(_browserSupportsSpeechRecognition)
  const [browserSupportsContinuousListening, setBrowserSupportsContinuousListening] =
    useState(_browserSupportsContinuousListening)
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

  const testFuzzyMatch = (command, input, fuzzyMatchingThreshold) => {
    const commandToString = (typeof command === 'object') ? command.toString() : command
    const commandWithoutSpecials = commandToString
      .replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, '')
      .replace(/  +/g, ' ')
      .trim()
    const howSimilar = compareTwoStringsUsingDiceCoefficient(commandWithoutSpecials, input)
    if (howSimilar >= fuzzyMatchingThreshold) {
      return {
        command,
        commandWithoutSpecials,
        howSimilar,
        isFuzzyMatch: true
      }
    }
    return null
  }

  const testMatch = (command, input, fuzzyMatchers) => {
    const pattern = commandToRegExp(command)
    const result = pattern.exec(input)
    if (result) {
      const fuzzyResults = {}
      if (fuzzyMatchers) {
        const fuzzyGroups = result.groups
        if (!fuzzyGroups) {
          return null
        }
        const fuzzyMatcherNames = Object.keys(fuzzyMatchers)
        for (let i = 0; i < fuzzyMatcherNames.length; i += 1) {
          const fuzzyMatcherName = fuzzyMatcherNames[i]
          const fuzzyGroup = fuzzyGroups[fuzzyMatcherName]
          const { command, fuzzyMatchingThreshold } = fuzzyMatchers[fuzzyMatcherName]
          const subcommands = Array.isArray(command) ? command : [command]
          const results = subcommands
            .map(subcommand =>
              testFuzzyMatch(subcommand, fuzzyGroup, fuzzyMatchingThreshold)
            )
            .filter(x => x)
            .sort((a, b) => b.howSimilar - a.howSimilar)
          if (results.length === 0) {
            return null
          }
          fuzzyResults[fuzzyMatcherName] = {
            utterance: fuzzyGroup,
            ...results[0]
          }
        }
      }
      const matchResult = {
        command,
        parameters: result.slice(1)
      }
      if (fuzzyMatchers) {
        matchResult.fuzzyResults = fuzzyResults
      }
      return matchResult
    }
    return null
  }

  const matchCommands = useCallback(
    (newInterimTranscript, newFinalTranscript) => {
      commandsRef.current.forEach(({
        command,
        callback,
        matchInterim = false,
        isFuzzyMatch = false,
        fuzzyMatchingThreshold = 0.8,
        bestMatchOnly = false,
        fuzzyMatchers = null
      }) => {
        const input = !newFinalTranscript && matchInterim
          ? newInterimTranscript.trim()
          : newFinalTranscript.trim()
        const subcommands = Array.isArray(command) ? command : [command]
        const results = subcommands.map(subcommand => {
          if (isFuzzyMatch) {
            return testFuzzyMatch(subcommand, input, fuzzyMatchingThreshold)
          }
          return testMatch(subcommand, input, fuzzyMatchers)
        }).filter(x => x)
        if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
          results.sort((a, b) => b.howSimilar - a.howSimilar)
          const { command, commandWithoutSpecials, howSimilar } = results[0]
          callback(commandWithoutSpecials, input, howSimilar, { command, resetTranscript })
        } else {
          results.forEach(result => {
            if (result.isFuzzyMatch) {
              const { command, commandWithoutSpecials, howSimilar } = result
              callback(commandWithoutSpecials, input, howSimilar, { command, resetTranscript })
            } else {
              const { command, parameters, fuzzyResults } = result
              callback(...parameters, { command, resetTranscript, fuzzyResults })
            }
          })
        }
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
      onClearTranscript: handleClearTranscript,
      onBrowserSupportsSpeechRecognitionChange: setBrowserSupportsSpeechRecognition,
      onBrowserSupportsContinuousListeningChange: setBrowserSupportsContinuousListening
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
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening
  }
}
const SpeechRecognition = {
  counter: 0,
  applyPolyfill: (PolyfillSpeechRecognition) => {
    if (recognitionManager) {
      recognitionManager.setSpeechRecognition(PolyfillSpeechRecognition)
    } else {
      recognitionManager = new RecognitionManager(PolyfillSpeechRecognition)
    }
    const browserSupportsPolyfill = !!PolyfillSpeechRecognition && browserSupportsPolyfills()
    _browserSupportsSpeechRecognition = browserSupportsPolyfill
    _browserSupportsContinuousListening = browserSupportsPolyfill
  },
  getRecognitionManager: () => {
    if (!recognitionManager) {
      recognitionManager = new RecognitionManager(NativeSpeechRecognition)
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
  browserSupportsSpeechRecognition: () => _browserSupportsSpeechRecognition,
  browserSupportsContinuousListening: () => _browserSupportsContinuousListening
}

export { useSpeechRecognition }
export default SpeechRecognition
