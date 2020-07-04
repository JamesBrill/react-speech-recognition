import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { concatTranscripts, commandToRegExp } from './utils'
import RecognitionManager from './RecognitionManager'

let id = 0
const SpeechRecognition = (WrappedComponent) => {
  class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.resetTranscript = this.resetTranscript.bind(this)
      this.handleListeningChange = this.handleListeningChange.bind(this)
      this.handleTranscriptChange = this.handleTranscriptChange.bind(this)
      this.handleClearTranscript = this.handleClearTranscript.bind(this)
      this.matchCommands = this.matchCommands.bind(this)

      this.recognitionManager = SpeechRecognition.getRecognitionManager()
      this.id = id
      id += 1

      this.state = {
        interimTranscript: this.recognitionManager.interimTranscript,
        finalTranscript: '',
        listening: this.recognitionManager.listening
      }
    }

    componentDidMount() {
      this.recognitionManager.subscribe(this.id, {
        onListeningChange: this.handleListeningChange,
        onTranscriptChange: this.handleTranscriptChange,
        onClearTranscript: this.handleClearTranscript
      })
    }

    componentWillUnmount() {
      this.recognitionManager.unsubscribe(this.id)
    }

    matchCommands(interimTranscript, finalTranscript) {
      const { commands } = this.props
      commands.forEach(({ command, callback, matchInterim = false }) => {
        const pattern = commandToRegExp(command)
        const input = !finalTranscript && matchInterim
          ? interimTranscript.trim()
          : finalTranscript.trim()
        const result = pattern.exec(input)
        if (result) {
          const parameters = result.slice(1)
          callback(...parameters)
        }
      })
    }

    handleListeningChange(listening) {
      this.setState({ listening })
    }

    handleTranscriptChange(interimTranscript, finalTranscript) {
      const { transcribing } = this.props
      this.matchCommands(interimTranscript, finalTranscript)
      if (transcribing) {
        this.setState({
          interimTranscript,
          finalTranscript:
         concatTranscripts(this.state.finalTranscript, finalTranscript)
        })
      }
    }

    handleClearTranscript() {
      const { clearTranscriptOnListen } = this.props
      if (clearTranscriptOnListen) {
        this.setState({ interimTranscript: '', finalTranscript: '' })
      }
    }

    resetTranscript() {
      this.recognitionManager.resetTranscript()
      this.setState({ interimTranscript: '', finalTranscript: '' })
    }

    render() {
      const { transcribing, ...otherProps } = this.props
      const { interimTranscript, finalTranscript } = this.state
      const transcript = concatTranscripts(
        finalTranscript,
        interimTranscript
      )

      return (
        <WrappedComponent
          resetTranscript={this.resetTranscript}
          transcript={transcript}
          recognition={this.recognitionManager.getRecognition()}
          browserSupportsSpeechRecognition={this.recognitionManager.browserSupportsSpeechRecognition}
          {...this.state}
          {...otherProps} />
      )
    }
  }

  SpeechRecognitionContainer.propTypes = {
    transcribing: PropTypes.bool,
    clearTranscriptOnListen: PropTypes.bool,
    commands: PropTypes.arrayOf(PropTypes.shape({
      command: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)]).isRequired,
      callback: PropTypes.func.isRequired,
      matchInterim: PropTypes.bool
    }))
  }

  SpeechRecognitionContainer.defaultProps = {
    transcribing: true,
    clearTranscriptOnListen: false,
    commands: []
  }
  return SpeechRecognitionContainer
}

SpeechRecognition.startListening = async ({ continuous, language } = {}) => {
  const recognitionManager = SpeechRecognition.getRecognitionManager()
  await recognitionManager.startListening({ continuous, language })
}

SpeechRecognition.stopListening = () => {
  const recognitionManager = SpeechRecognition.getRecognitionManager()
  recognitionManager.stopListening()
}

SpeechRecognition.abortListening = () => {
  const recognitionManager = SpeechRecognition.getRecognitionManager()
  recognitionManager.abortListening()
}

let recognitionManager
SpeechRecognition.getRecognitionManager = () => {
  if (!recognitionManager) {
    recognitionManager = new RecognitionManager()
  }
  return recognitionManager
}

export default SpeechRecognition
