import { renderHook, act } from '@testing-library/react-hooks'
import '../tests/vendor/corti'
import SpeechRecognition, { useSpeechRecognition } from './SpeechRecognition'
import isAndroid from './isAndroid'
import RecognitionManager from './RecognitionManager'

jest.mock('./isAndroid')

const mockRecognitionManager = () => {
  const recognitionManager = new RecognitionManager()
  SpeechRecognition.getRecognitionManager = () => recognitionManager
  return recognitionManager
}

describe('SpeechRecognition', () => {
  beforeEach(() => {
    isAndroid.mockClear()
  })

  test('indicates when SpeechRecognition API is available', () => {
    const recognitionManager = mockRecognitionManager()
    recognitionManager.browserSupportsSpeechRecognition = true

    expect(SpeechRecognition.browserSupportsSpeechRecognition()).toEqual(true)
  })

  test('indicates when SpeechRecognition API is not available', () => {
    const recognitionManager = mockRecognitionManager()
    recognitionManager.browserSupportsSpeechRecognition = false

    expect(SpeechRecognition.browserSupportsSpeechRecognition()).toEqual(false)
  })

  test('sets default transcripts correctly', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('updates transcripts correctly', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual(speech)
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual(speech)
  })

  test('resets transcripts correctly', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })
    act(() => {
      result.current.resetTranscript()
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('is listening when Speech Recognition is listening', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    await act(async () => {
      await SpeechRecognition.startListening()
    })

    expect(result.current.listening).toEqual(true)
  })

  test('is not listening when Speech Recognition is not listening', () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())

    expect(result.current.listening).toEqual(false)
  })

  test('injects Speech Recognition object', () => {
    const recognitionManager = mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())

    expect(result.current.recognition).toEqual(recognitionManager.recognition)
  })

  test('ignores speech when listening is stopped', () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('ignores speech when listening is aborted', () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    act(() => {
      SpeechRecognition.abortListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('transcibes when listening is started', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual(speech)
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual(speech)
  })

  test('does not transcibe when listening is started but not transcribing', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition({ transcribing: false }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('listens discontinuously by default', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })
    act(() => {
      result.current.recognition.say(speech)
    })
  })

  test('can turn continuous listening on', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'
    const expectedTranscript = [speech, speech].join(' ')

    await act(async () => {
      await SpeechRecognition.startListening({ continuous: true })
    })
    act(() => {
      result.current.recognition.say(speech)
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual(expectedTranscript)
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual(expectedTranscript)
  })

  test('can set language', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await SpeechRecognition.startListening({ language: 'zh-CN' })
    })

    expect(result.current.recognition.lang).toEqual('zh-CN')
  })

  test('does not collect transcript after listening is stopped', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.stopListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('sets interim transcript correctly', async() => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech, { onlyFirstResult: true })
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('This')
    expect(interimTranscript).toEqual('This')
    expect(finalTranscript).toEqual('')
  })

  test('appends interim transcript correctly', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening({ continuous: true })
    })
    act(() => {
      result.current.recognition.say(speech)
    })
    act(() => {
      result.current.recognition.say(speech, { onlyFirstResult: true })
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('This is a test This')
    expect(interimTranscript).toEqual('This')
    expect(finalTranscript).toEqual(speech)
  })

  test('appends interim transcript correctly on Android', async () => {
    isAndroid.mockReturnValue(true)
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening({ continuous: true })
    })
    act(() => {
      result.current.recognition.say(speech, { isAndroid: true })
    })
    act(() => {
      result.current.recognition.say(speech, { onlyFirstResult: true, isAndroid: true })
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('This is a test This')
    expect(interimTranscript).toEqual('This')
    expect(finalTranscript).toEqual(speech)
  })

  test('resets transcript on subsequent discontinuous speech when clearTranscriptOnListen set', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(result.current.transcript).toEqual(speech)
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual(speech)

    act(() => {
      SpeechRecognition.stopListening()
    })

    expect(result.current.transcript).toEqual(speech)
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual(speech)

    await act(async () => {
      await SpeechRecognition.startListening()
    })

    expect(result.current.transcript).toEqual('')
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual('')
  })

  test('does not reset transcript on subsequent discontinuous speech when clearTranscriptOnListen not set', async () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition({ clearTranscriptOnListen: false }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })
    expect(result.current.transcript).toEqual(speech)
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual(speech)

    act(() => {
      SpeechRecognition.stopListening()
    })

    expect(result.current.transcript).toEqual(speech)
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual(speech)

    await act(async () => {
      await SpeechRecognition.startListening()
    })

    expect(result.current.transcript).toEqual(speech)
    expect(result.current.interimTranscript).toEqual('')
    expect(result.current.finalTranscript).toEqual(speech)
  })

  test('does not call command callback when no command matched', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'hello world',
        callback: mockCommandCallback,
        matchInterim: false
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(0)
  })

  test('matches simple command', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'hello world',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'hello world'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('matches one splat', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'I want to eat * and fries',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
    expect(mockCommandCallback).toBeCalledWith('pizza')
  })

  test('matches one splat at the end of the sentence', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'I want to eat *',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
    expect(mockCommandCallback).toBeCalledWith('pizza and fries')
  })

  test('matches two splats', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'I want to eat * and *',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
    expect(mockCommandCallback).toBeCalledWith('pizza', 'fries')
  })

  test('matches optional words when optional word spoken', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'Hello (to) you',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'Hello to you'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('matches optional words when optional word not spoken', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'Hello (to) you',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'Hello you'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('matches named variable', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'I :action with my little eye',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I spy with my little eye'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
    expect(mockCommandCallback).toBeCalledWith('spy')
  })

  test('matches regex', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: new RegExp('This is a \\s+ test\\.+'),
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a      test.......'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('matches regex case-insensitively', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: new RegExp('This is a \\s+ test\\.+'),
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'this is a      TEST.......'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('matches multiple commands', async () => {
    mockRecognitionManager()
    const mockCommandCallback1 = jest.fn()
    const mockCommandCallback2 = jest.fn()
    const mockCommandCallback3 = jest.fn()
    const commands = [
      {
        command: 'I want to eat * and *',
        callback: mockCommandCallback1
      },
      {
        command: '* and fries are great',
        callback: mockCommandCallback2
      },
      {
        command: 'flibble',
        callback: mockCommandCallback3
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries are great'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback1.mock.calls.length).toBe(1)
    expect(mockCommandCallback1).toBeCalledWith('pizza', 'fries are great')
    expect(mockCommandCallback2.mock.calls.length).toBe(1)
    expect(mockCommandCallback2).toBeCalledWith('I want to eat pizza')
    expect(mockCommandCallback3.mock.calls.length).toBe(0)
  })

  test('does not match interim results by default', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'This is',
        callback: mockCommandCallback
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(0)
  })

  test('matches interim results when configured', async () => {
    mockRecognitionManager()
    const mockCommandCallback = jest.fn()
    const commands = [
      {
        command: 'This is',
        callback: mockCommandCallback,
        matchInterim: true
      }
    ]
    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      result.current.recognition.say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('transcript resets should be per instance, not global', async () => {
    mockRecognitionManager()
    const hook1 = renderHook(() => useSpeechRecognition())
    const hook2 = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      hook1.result.current.recognition.say(speech)
    })
    act(() => {
      hook2.result.current.resetTranscript()
    })

    expect(hook2.result.current.transcript).toEqual('')
    expect(hook2.result.current.interimTranscript).toEqual('')
    expect(hook2.result.current.finalTranscript).toEqual('')
    expect(hook1.result.current.transcript).toEqual(speech)
    expect(hook1.result.current.interimTranscript).toEqual('')
    expect(hook1.result.current.finalTranscript).toEqual(speech)
  })
})
