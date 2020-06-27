import React from 'react'
import { shallow, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Corti from './vendor/corti'
import SpeechRecognition from '../src'

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
  })

  test('indicates when SpeechRecognition API is not available', () => {
    const WrappedComponent = SpeechRecognition(() => null)
    const component = shallow(<WrappedComponent />)
    const props = component.props()

    expect(props.browserSupportsSpeechRecognition).toEqual(false)
  })
})
