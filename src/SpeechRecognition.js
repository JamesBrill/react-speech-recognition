import React, { Component } from 'react'
import { concatTranscripts, RecognitionManager } from './utils'

let id = 0
const recognitionManager = new RecognitionManager()
const SpeechRecognition = (WrappedComponent) => {
  return class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.resetTranscript = this.resetTranscript.bind(this)
      this.handleListeningChange = this.handleListeningChange.bind(this)
      this.handleTranscriptChange = this.handleTranscriptChange.bind(this)

      this.id = id
      id += 1

      this.state = {
        interimTranscript: recognitionManager.interimTranscript,
        finalTranscript: '',
        listening: recognitionManager.listening
      }
    }

    componentDidMount() {
      recognitionManager.subscribe(this.id, {
        onListeningChange: this.handleListeningChange,
        onTranscriptChange: this.handleTranscriptChange
      })
    }

    componentWillUnmount() {
      recognitionManager.unsubscribe(this.id)
    }

    handleListeningChange(listening) {
      this.setState({ listening })
    }

    handleTranscriptChange(interimTranscript, finalTranscript) {
      const { transcribing } = this.props
      if (transcribing) {
        this.setState({
          interimTranscript,
          finalTranscript:
         concatTranscripts(this.state.finalTranscript, finalTranscript)
        })
      }
    }

    resetTranscript() {
      recognitionManager.resetTranscript()
      this.setState({ interimTranscript: '', finalTranscript: '' })
    }

    render() {
      const { interimTranscript, finalTranscript } = this.state
      const transcript = concatTranscripts(
        finalTranscript,
        interimTranscript
      )

      return (
        <WrappedComponent
          resetTranscript={this.resetTranscript}
          transcript={transcript}
          recognition={recognitionManager.getRecognition()}
          browserSupportsSpeechRecognition={recognitionManager.browserSupportsSpeechRecognition}
          {...this.state}
          {...this.props} />
      )
    }
  }
}

SpeechRecognition.startListening = ({ continuous, language }) => {
  recognitionManager.startListening({ continuous, language })
}

SpeechRecognition.stopListening = () => {
  recognitionManager.stopListening()
}

SpeechRecognition.abortListening = () => {
  recognitionManager.abortListening()
}

export default SpeechRecognition
