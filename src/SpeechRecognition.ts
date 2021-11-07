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
import type { ListeningOptions, Phrase, PhraseMatch, FuzzyPhraseMatch, Maybe, SpeechRecognition, Transcript, UseSpeechRecognitionOptions } from './types'

let _browserSupportsSpeechRecognition = !!NativeSpeechRecognition
let _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid()
let recognitionManager: RecognitionManager

const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = true,
  commands = []
}: UseSpeechRecognitionOptions = {}) => {
  const [recognitionManager] = useState(ReactSpeechRecognition.getRecognitionManager())
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] =
    useState(_browserSupportsSpeechRecognition)
  const [browserSupportsContinuousListening, setBrowserSupportsContinuousListening] =
    useState(_browserSupportsContinuousListening)
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(transcriptReducer, {
    interimTranscript: recognitionManager.interimTranscript,
    finalTranscript: ''
  })
  const [listening, setListening] = useState(recognitionManager.listening)
  const [isMicrophoneAvailable, setMicrophoneAvailable] =
    useState(recognitionManager.isMicrophoneAvailable)
  const commandsRef = useRef(commands)
  commandsRef.current = commands

  const clearTranscript = () => {
    dispatch(clearTrancript())
  }

  const resetTranscript = useCallback(() => {
    recognitionManager.resetTranscript()
    clearTranscript()
  }, [recognitionManager])

  const testFuzzyMatch = (phrase: Phrase, input: Transcript, fuzzyMatchingThreshold: number): Maybe<FuzzyPhraseMatch> => {
    const phraseToString = (phrase instanceof RegExp) ? phrase.toString() : phrase
    const phraseWithoutSpecials = phraseToString
      .replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, '')
      .replace(/  +/g, ' ')
      .trim()
    const howSimilar = compareTwoStringsUsingDiceCoefficient(phraseWithoutSpecials, input)
    if (howSimilar >= fuzzyMatchingThreshold) {
      return {
        phrase,
        phraseWithoutSpecials,
        howSimilar,
        isFuzzyMatch: true,
      }
    }
    return null
  }

  const testMatch = (phrase: Phrase, input: Transcript): Maybe<PhraseMatch> => {
    const pattern = commandToRegExp(phrase)
    const result = pattern.exec(input)
    if (result) {
      return {
        phrase,
        parameters: result.slice(1),
        isFuzzyMatch: false,
      }
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
        bestMatchOnly = false
      }) => {
        const input = !newFinalTranscript && matchInterim
          ? newInterimTranscript.trim()
          : newFinalTranscript.trim()
        const phrases = Array.isArray(command) ? command : [command]
        const results = isFuzzyMatch ?
          phrases.map(phrase => testFuzzyMatch(phrase, input, fuzzyMatchingThreshold)).filter(x => x) as FuzzyPhraseMatch[] : 
          phrases.map(phrase => testMatch(phrase, input)).filter(x => x) as PhraseMatch[];
        if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
          const fuzzyResults = results as FuzzyPhraseMatch[]
          fuzzyResults.sort((a, b) => b.howSimilar - a.howSimilar)
          const { phrase, phraseWithoutSpecials, howSimilar } = fuzzyResults[0]
          callback(phraseWithoutSpecials, input, howSimilar, { phrase, resetTranscript })
        } else {
          results.forEach(result => {
            if (result.isFuzzyMatch) {
              const { phrase, phraseWithoutSpecials, howSimilar } = result as FuzzyPhraseMatch
              callback(phraseWithoutSpecials, input, howSimilar, { phrase, resetTranscript })
            } else {
              const { phrase, parameters } = result as PhraseMatch
              callback(...parameters, { phrase, resetTranscript })
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
    const id = ReactSpeechRecognition.counter
    ReactSpeechRecognition.counter += 1
    const callbacks = {
      onListeningChange: setListening,
      onMicrophoneAvailabilityChange: setMicrophoneAvailable,
      onTranscriptChange: handleTranscriptChange,
      onClearTranscript: handleClearTranscript,
      onBrowserSupportsSpeechRecognitionChange: setBrowserSupportsSpeechRecognition,
      onBrowserSupportsContinuousListeningChange: setBrowserSupportsContinuousListening
    }
    recognitionManager.subscribe(id.toString(), callbacks)

    return () => {
      recognitionManager.unsubscribe(id.toString())
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
    isMicrophoneAvailable,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening
  }
}
const ReactSpeechRecognition = {
  counter: 0,
  applyPolyfill: (PolyfillSpeechRecognition: SpeechRecognition) => {
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
    const recognitionManager = ReactSpeechRecognition.getRecognitionManager()
    return recognitionManager.getRecognition()
  },
  startListening: async ({ continuous, language }: ListeningOptions = {}) => {
    const recognitionManager = ReactSpeechRecognition.getRecognitionManager()
    await recognitionManager.startListening({ continuous, language })
  },
  stopListening: async () => {
    const recognitionManager = ReactSpeechRecognition.getRecognitionManager()
    await recognitionManager.stopListening()
  },
  abortListening: async () => {
    const recognitionManager = ReactSpeechRecognition.getRecognitionManager()
    await recognitionManager.abortListening()
  },
  browserSupportsSpeechRecognition: () => _browserSupportsSpeechRecognition,
  browserSupportsContinuousListening: () => _browserSupportsContinuousListening
}

export { useSpeechRecognition }
export default ReactSpeechRecognition
