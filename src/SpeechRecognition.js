import React, { Component } from 'react'
import { debounce, autobind } from 'core-decorators'

export default function SpeechRecognition(WrappedComponent) {
  const BrowserSpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    window.mozSpeechRecognition ||
    window.msSpeechRecognition ||
    window.oSpeechRecognition
  const recognition = BrowserSpeechRecognition
    ? new BrowserSpeechRecognition()
    : null
  const browserSupportsSpeechRecognition = recognition !== null
  recognition.start()
  let listening = true
  let pauseAfterDisconnect = false
  let interimTranscript = ''
  let finalTranscript = ''

  return class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.state = {
        interimTranscript,
        finalTranscript,
        listening: false
      }
    }

    componentWillMount() {
      if (recognition) {
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = this.updateTranscript.bind(this)
        recognition.onend = this.onRecognitionDisconnect.bind(this)
        this.setState({ listening })
      }
    }

    @autobind
    disconnect(disconnectType) {
      if (recognition) {
        switch (disconnectType) {
          case 'ABORT':
            pauseAfterDisconnect = true
            recognition.abort()
            break
          case 'RESET':
            pauseAfterDisconnect = false
            recognition.abort()
            break
          case 'STOP':
          default:
            pauseAfterDisconnect = true
            recognition.stop()
        }
      }
    }

    @debounce(1000)
    onRecognitionDisconnect() {
      listening = false
      if (pauseAfterDisconnect) {
        this.setState({ listening })
      } else {
        this.startListening()
      }
      pauseAfterDisconnect = false
    }

    updateTranscript(event) {
      interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript = this.concatTranscripts(
            finalTranscript,
            event.results[i][0].transcript
          )
        } else {
          interimTranscript = this.concatTranscripts(
            interimTranscript,
            event.results[i][0].transcript
          )
        }
      }
      this.setState({ finalTranscript, interimTranscript })
    }

    concatTranscripts(...transcriptParts) {
      return transcriptParts.map(t => t.trim()).join(' ').trim()
    }

    @autobind
    resetTranscript() {
      interimTranscript = ''
      finalTranscript = ''
      this.disconnect('RESET')
      this.setState({ interimTranscript, finalTranscript })
    }

    @autobind
    startListening() {
      if (recognition && !listening) {
        recognition.start()
        listening = true
        this.setState({ listening })
      }
    }

    @autobind
    abortListening() {
      listening = false
      this.setState({ listening })
      this.disconnect('ABORT')
    }

    @autobind
    stopListening() {
      listening = false
      this.setState({ listening })
      this.disconnect('STOP')
    }

    render() {
      const transcript = this.concatTranscripts(
        finalTranscript,
        interimTranscript
      )

      return (
        <WrappedComponent
          resetTranscript={this.resetTranscript}
          startListening={this.startListening}
          abortListening={this.abortListening}
          stopListening={this.stopListening}
          transcript={transcript}
          recognition={recognition}
          browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
          {...this.state}
          {...this.props} />
      )
    }
  }
}
