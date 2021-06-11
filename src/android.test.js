/* eslint-disable import/first */
jest.mock('./isAndroid', () => () => true)

import { renderHook } from '@testing-library/react-hooks'
import '../tests/vendor/corti'
import SpeechRecognition, { useSpeechRecognition } from './SpeechRecognition'
import RecognitionManager from './RecognitionManager'
import { browserSupportsPolyfills } from './utils'

jest.mock('./utils', () => {
  return {
    ...jest.requireActual('./utils'),
    browserSupportsPolyfills: jest.fn()
  }
})

const mockRecognitionManager = () => {
  const recognitionManager = new RecognitionManager(window.SpeechRecognition)
  SpeechRecognition.getRecognitionManager = () => recognitionManager
  return recognitionManager
}

describe('SpeechRecognition (Android)', () => {
  beforeEach(() => {
    browserSupportsPolyfills.mockImplementation(() => true)
  })

  test('sets browserSupportsContinuousListening to false on Android', async () => {
    mockRecognitionManager()

    const { result } = renderHook(() => useSpeechRecognition())
    const { browserSupportsContinuousListening } = result.current

    expect(browserSupportsContinuousListening).toEqual(false)
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(false)
  })

  test('sets browserSupportsContinuousListening to true when using polyfill', () => {
    const MockSpeechRecognition = class {}
    SpeechRecognition.applyPolyfill(MockSpeechRecognition)

    const { result } = renderHook(() => useSpeechRecognition())
    const { browserSupportsContinuousListening } = result.current

    expect(browserSupportsContinuousListening).toEqual(true)
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(true)
  })

  test('sets browserSupportsContinuousListening to false when using polyfill on unsupported browser', () => {
    browserSupportsPolyfills.mockImplementation(() => false)
    const MockSpeechRecognition = class {}
    SpeechRecognition.applyPolyfill(MockSpeechRecognition)

    const { result } = renderHook(() => useSpeechRecognition())
    const { browserSupportsContinuousListening } = result.current

    expect(browserSupportsContinuousListening).toEqual(false)
    expect(SpeechRecognition.browserSupportsContinuousListening()).toEqual(false)
  })
})
