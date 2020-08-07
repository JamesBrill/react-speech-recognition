import { renderHook, act } from '@testing-library/react-hooks'
import '../../tests/vendor/corti'
import SpeechRecognition, { useSpeechRecognition } from '../SpeechRecognition'
import isAndroid from '../isAndroid'
import RecognitionManager from '../RecognitionManager'

jest.mock('./isAndroid')

const mockRecognitionManager = () => {
  const recognitionManager = new RecognitionManager()
  SpeechRecognition.getRecognitionManager = () => recognitionManager
  return recognitionManager
}

describe('SpeechRecognition', () => {
  beforeEach(() => {
    // TODO: Check how it can be enabled if it has to be
    // isAndroid.mockClear()
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
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
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

  test('exposes Speech Recognition object', () => {
    const recognitionManager = mockRecognitionManager()

    expect(SpeechRecognition.getRecognition()).toEqual(recognitionManager.recognition)
  })

  test('ignores speech when listening is stopped', () => {
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('')
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual('')
  })

  test('listens discontinuously by default', async () => {
    mockRecognitionManager()
    renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual(expectedTranscript)
    expect(interimTranscript).toEqual('')
    expect(finalTranscript).toEqual(expectedTranscript)
  })

  test('can set language', async () => {
    mockRecognitionManager()
    renderHook(() => useSpeechRecognition())

    await act(async () => {
      await SpeechRecognition.startListening({ language: 'zh-CN' })
    })

    expect(SpeechRecognition.getRecognition().lang).toEqual('zh-CN')
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
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech, { onlyFirstResult: true })
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
      SpeechRecognition.getRecognition().say(speech)
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech, { onlyFirstResult: true })
    })

    const { transcript, interimTranscript, finalTranscript } = result.current
    expect(transcript).toEqual('This is a test This')
    expect(interimTranscript).toEqual('This')
    expect(finalTranscript).toEqual(speech)
  })

  test('appends interim transcript correctly on Android', async () => {
    // isAndroid.mockReturnValue(true)
    mockRecognitionManager()
    const { result } = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening({ continuous: true })
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech, { isAndroid: true })
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech, { onlyFirstResult: true, isAndroid: true })
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
      SpeechRecognition.getRecognition().say(speech)
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
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'hello world'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'Hello to you'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'Hello you'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I spy with my little eye'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a      test.......'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'this is a      TEST.......'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'I want to eat pizza and fries are great'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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
    renderHook(() => useSpeechRecognition({ commands }))
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening()
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
    })

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })

  test('transcript resets should be per instance, not global', async () => {
    mockRecognitionManager()
    const hook1 = renderHook(() => useSpeechRecognition())
    const hook2 = renderHook(() => useSpeechRecognition())
    const speech = 'This is a test'

    await act(async () => {
      await SpeechRecognition.startListening({ continuous: true })
    })
    act(() => {
      SpeechRecognition.getRecognition().say(speech)
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

test('does not call command callback when isFuzzyMatch is not true', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: 'hello world',
      callback: mockCommandCallback
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'This is a test'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(0)
})

test('does not call command callback when isFuzzyMatch is true and similarity is less than fuzzyMatchingThreshold', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: 'hello world',
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.7
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'Hello'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(0)
})

test('does call command callback when isFuzzyMatch is true and similarity is equal or greater than fuzzyMatchingThreshold', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: 'hello world',
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.5
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'Hello'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(1)
})

test('callback is called with command, transcript and similarity ratio between those', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: 'I want to eat',
      callback: mockCommandCallback,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.5
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'I want to drink'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(1)
  expect(mockCommandCallback).toBeCalledWith('I want to eat', 'I want to drink', 0.6)
})

test('different callbacks can be called for the same speech and with fuzzyMatchingThreshold', async () => {
  mockRecognitionManager()
  const mockCommandCallback1 = jest.fn()
  const mockCommandCallback2 = jest.fn()
  const commands = [
    {
      command: 'I want to eat',
      callback: mockCommandCallback1,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 1
    },
    {
      command: 'I want to sleep',
      callback: mockCommandCallback2,
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'I want to eat'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback1.mock.calls.length).toBe(1)
  expect(mockCommandCallback2.mock.calls.length).toBe(1)
})

test('when command is regex with fuzzy match true runs similarity check with regex converted to string', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: new RegExp('This is a \\s+ test\\.+'),
      callback: mockCommandCallback,
      isFuzzyMatch: true
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'This is a test'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(1)
  expect(mockCommandCallback).toBeCalledWith('This is a s test', 'This is a test', 0.8571428571428571)
})

test('when command is string special characters with fuzzy match true, special characters are removed from string and then we test similarity', async () => {
  mockRecognitionManager()
  const mockCommandCallback = jest.fn()
  const commands = [
    {
      command: '! (I would :like) : * a :pizza ',
      callback: mockCommandCallback,
      isFuzzyMatch: true
    }
  ]
  renderHook(() => useSpeechRecognition({ commands }))
  const speech = 'I would like a pizza'

  await act(async () => {
    await SpeechRecognition.startListening()
  })
  act(() => {
    SpeechRecognition.getRecognition().say(speech)
  })

  expect(mockCommandCallback.mock.calls.length).toBe(1)
  expect(mockCommandCallback).toBeCalledWith('I would like a pizza', 'I would like a pizza', 1)
})
