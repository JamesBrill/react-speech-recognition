import React from 'react'
import { shallow } from 'enzyme'
import '../tests/vendor/corti'
import SpeechRecognition from './SpeechRecognition'
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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(true)
  })

  test('indicates when SpeechRecognition API is not available', () => {
    const recognitionManager = mockRecognitionManager()
    recognitionManager.browserSupportsSpeechRecognition = false
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(false)
  })

  test('sets default transcripts correctly', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('updates transcripts correctly', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('resets transcripts correctly', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)
    component.props().resetTranscript()

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('is listening when Speech Recognition is listening', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    await SpeechRecognition.startListening()

    const props = component.props()
    expect(props.listening).toEqual(true)
  })

  test('is not listening when Speech Recognition is not listening', () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)

    const props = component.props()
    expect(props.listening).toEqual(false)
  })

  test('injects Speech Recognition object', () => {
    const recognitionManager = mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)

    const props = component.props()
    expect(props.recognition).toEqual(recognitionManager.recognition)
  })

  test('ignores speech when listening is stopped', () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('ignores speech when listening is aborted', () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    SpeechRecognition.abortListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('transcibes when listening is started', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('does not transcibe when listening is started but not transcribing', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent transcribing={false} />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('listens continuously by default', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'
    const expectedTranscript = [speech, speech].join(' ')

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(expectedTranscript)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(expectedTranscript)
  })

  test('can turn continuous listening off', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening({ continuous: false })
    component.props().recognition.say(speech)
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('can set language', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)

    await SpeechRecognition.startListening({ language: 'zh-CN' })

    const props = component.props()
    expect(props.recognition.lang).toEqual('zh-CN')
  })

  test('sets interim transcript correctly', async() => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech, { onlyFirstResult: true })

    const props = component.props()
    expect(props.transcript).toEqual('This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual('')
  })

  test('appends interim transcript correctly', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)
    component.props().recognition.say(speech, { onlyFirstResult: true })

    const props = component.props()
    expect(props.transcript).toEqual('This is a test This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('appends interim transcript correctly on Android', async () => {
    isAndroid.mockReturnValue(true)
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech, { isAndroid: true })
    component.props().recognition.say(speech, { onlyFirstResult: true, isAndroid: true })

    const props = component.props()
    expect(props.transcript).toEqual('This is a test This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('resets transcript on subsequent discontinuous speech when clearTranscriptOnListen set', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent clearTranscriptOnListen />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening({ continuous: false })
    component.props().recognition.say(speech)

    let props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)

    SpeechRecognition.stopListening()

    props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)

    await SpeechRecognition.startListening({ continuous: false })

    props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('does not reset transcript on subsequent discontinuous speech when clearTranscriptOnListen not set', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening({ continuous: false })
    component.props().recognition.say(speech)

    let props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)

    SpeechRecognition.stopListening()

    props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)

    await SpeechRecognition.startListening({ continuous: false })

    props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('props from parent get passed down to wrapped component', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(
      ({ foo }) => <p>{foo}</p>
    )
    const component = shallow(<WrappedComponent foo='test' />)

    expect(component.html()).toEqual('<p>test</p>')
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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'hello world'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'I want to eat pizza and fries'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'I want to eat pizza and fries'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'I want to eat pizza and fries'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'Hello to you'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'Hello you'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'I spy with my little eye'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'This is a      test.......'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'this is a      TEST.......'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'I want to eat pizza and fries are great'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent commands={commands} />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening()
    component.props().recognition.say(speech)

    expect(mockCommandCallback.mock.calls.length).toBe(1)
  })
})
