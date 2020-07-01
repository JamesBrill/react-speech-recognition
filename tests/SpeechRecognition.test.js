/* eslint-disable import/first */
import React from 'react'
import { shallow } from 'enzyme'
import mockSpeechRecognition from './vendor/corti'
import SpeechRecognition from '../src'
import recognitionManager from '../src/recognitionManager'
import isAndroid from '../src/isAndroid'

jest.mock('../src/isAndroid')

describe('SpeechRecognition', () => {
  beforeEach(() => {
    recognitionManager.browserSupportsSpeechRecognition = true
    recognitionManager.recognition.continuous = true
    recognitionManager.stopListening()
  })

  test('indicates when SpeechRecognition API is available', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(true)
  })

  test('indicates when SpeechRecognition API is not available', () => {
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
    mockSpeechRecognition.patch()
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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    await SpeechRecognition.startListening()

    const props = component.props()
    expect(props.listening).toEqual(true)
  })

  test('is not listening when Speech Recognition is not listening', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)

    const props = component.props()
    expect(props.listening).toEqual(false)
  })

  test('injects Speech Recognition object', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)

    const props = component.props()
    expect(props.recognition).toEqual(recognitionManager.recognition)
  })

  test('ignores speech when listening is stopped', () => {
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
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent continuous={false} />)
    const speech = 'This is a test'

    await SpeechRecognition.startListening({ continuous: false })
    component.props().recognition.say(speech)
    component.props().recognition.say(speech)

    const props = component.props()
    expect(props.transcript).toEqual(speech)
    expect(props.interimTranscript).toEqual('')
    expect(props.finalTranscript).toEqual(speech)
  })

  test('sets interim transcript correctly', async() => {
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

  // test('appends interim transcript correctly on Android', async () => {
  //   isAndroid.mockReturnValue(true)
  //   const WrappedComponent = SpeechRecognition(() => null)
  //   const component = shallow(<WrappedComponent />)
  //   const speech = 'This is a test'

  //   await SpeechRecognition.startListening()
  //   component.props().recognition.say(speech, { isAndroid: true })
  //   component.props().recognition.say(speech, { onlyFirstResult: true, isAndroid: true })

  //   const props = component.props()
  //   expect(props.transcript).toEqual('This is a test This')
  //   expect(props.interimTranscript).toEqual('This')
  //   expect(props.finalTranscript).toEqual(speech)
  // })
})
