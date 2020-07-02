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

  test('resets transcript on subsequent discontinuous speech', async () => {
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

  test('props from parent get passed down to wrapped component', async () => {
    mockRecognitionManager()
    const WrappedComponent = SpeechRecognition(
      ({ foo }) => <p>{foo}</p>
    )
    const component = shallow(<WrappedComponent foo='test' />)

    expect(component.html()).toEqual('<p>test</p>')
  })
})
