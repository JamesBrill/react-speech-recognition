import React from 'react'
import { shallow, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Corti from './vendor/corti'
import SpeechRecognition from '../src'
import isAndroid from '../src/isAndroid'

jest.mock('../src/isAndroid')

configure({ adapter: new Adapter() })

describe('SpeechRecognition', () => {
  const mockSpeechRecognition = Corti(global)

  beforeEach(() => {
    mockSpeechRecognition.unpatch()
  })

  test('indicates when SpeechRecognition API is available', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(true)
    expect(props.listening).toEqual(true)
  })

  test('indicates when SpeechRecognition API is not available', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(false)
    expect(props.listening).toEqual(false)
  })

  test('sets default transcripts correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('updates transcripts correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('resets transcripts correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)
    component.props().resetTranscript()

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('stops listening correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().stopListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('aborts listening correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().abortListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('starts listening correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().stopListening()
    component.props().startListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('can turn auto-start off', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent autoStart={false} />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual('')
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual('')
  })

  test('can listen again after auto-start turned off', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent autoStart={false} />)
    const speech = 'This is a test'

    component.props().startListening()
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('listens continuously by default', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'
    const expectedTranscript = [speech, speech].join(' ')

    component.props().recognition.say(speech)
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(expectedTranscript)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(expectedTranscript)
  })

  test('can turn continuous listening off', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent continuous={false} />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('sets interim transcript correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech, { onlyFirstResult: true })

    const props = component.props()
    expect(props.transcript).toEqual('This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual('')
  })

  test('appends interim transcript correctly', () => {
    mockSpeechRecognition.patch()
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech)
    component.props().recognition.say(speech, { onlyFirstResult: true })

    const props = component.props()
    expect(props.transcript).toEqual('This is a test This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('appends interim transcript correctly on Android', () => {
    mockSpeechRecognition.patch()
    isAndroid.mockReturnValue(true)
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const speech = 'This is a test'

    component.props().recognition.say(speech, { isAndroid: true })
    component.props().recognition.say(speech, { onlyFirstResult: true, isAndroid: true })

    const props = component.props()
    expect(props.transcript).toEqual('This is a test This')
    expect(props.interimTranscript).toEqual('This')
    expect(props.finalTranscript).toEqual(speech)
  })
})
