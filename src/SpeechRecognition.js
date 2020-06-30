import React, { Component } from 'react'
import { concatTranscripts, RecognitionManager } from './utils'

let id = 0
export default function SpeechRecognition(WrappedComponent) {
  const recognitionManager = new RecognitionManager()

  return class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.resetTranscript = this.resetTranscript.bind(this)
      this.handleListeningChange = this.handleListeningChange.bind(this)
      this.handleTranscriptChange = this.handleTranscriptChange.bind(this)
      this.startTranscribing = this.startTranscribing.bind(this)
      this.stopTranscribing = this.stopTranscribing.bind(this)

      this.id = id
      id += 1

      this.state = {
        interimTranscript: recognitionManager.interimTranscript,
        finalTranscript: '',
        listening: recognitionManager.listening
      }
    }

    componentDidMount() {
      this.startTranscribing()
    }

    componentWillUnmount() {
      this.stopTranscribing()
    }

    startTranscribing() {
      const autoStart = this.props.autoStart === undefined ? true : this.props.autoStart
      const continuous = this.props.continuous === undefined ? true : this.props.continuous

      recognitionManager.subscribe(this.id, { autoStart, continuous }, {
        onListeningChange: this.handleListeningChange,
        onTranscriptChange: this.handleTranscriptChange
      })
    }

    stopTranscribing() {
      recognitionManager.unsubscribe(this.id)
    }

    handleListeningChange(listening) {
      this.setState({ listening })
    }

    handleTranscriptChange(interimTranscript, finalTranscript) {
      this.setState({
        interimTranscript,
        finalTranscript:
         concatTranscripts(this.state.finalTranscript, finalTranscript)
      })
    }

    resetTranscript() {
      recognitionManager.resetTranscript()
      this.setState({ interimTranscript: '', finalTranscript: '' })
    }

    render() {
      const { autoStart, continuous, ...otherProps } = this.props
      const { interimTranscript, finalTranscript } = this.state
      const transcript = concatTranscripts(
        finalTranscript,
        interimTranscript
      )

      return (
        <WrappedComponent
          resetTranscript={this.resetTranscript}
          startTranscribing={this.startTranscribing}
          stopTranscribing={this.stopTranscribing}
          transcript={transcript}
          recognition={recognitionManager.getRecognition()}
          browserSupportsSpeechRecognition={recognitionManager.browserSupportsSpeechRecognition}
          {...this.state}
          {...otherProps} />
      )
    }
  }
}
