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
  let isManuallyDisconnected = false
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
    manualDisconnect(disconnectType) {
      if (recognition) {
        isManuallyDisconnected = true
        switch (disconnectType) {
          case 'ABORT':
            recognition.abort()
            break
          case 'STOP':
          default:
            recognition.stop()
        }
      }
    }

    @debounce(1000)
    onRecognitionDisconnect() {
      listening = false
      if (!isManuallyDisconnected) {
        this.startListening()
      } else {
        this.setState({ listening })
      }
      isManuallyDisconnected = false
    }

    updateTranscript(event) {
      this.setNewTranscript(event)
      this.setState({ finalTranscript, interimTranscript })
    }

    setNewTranscript(event) {
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
    }

    concatTranscripts(...transcriptParts) {
      return transcriptParts.map(t => t.trim()).join(' ').trim()
    }

    @autobind
    resetTranscript() {
      interimTranscript = ''
      finalTranscript = ''
      recognition.abort()
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
      this.manualDisconnect('ABORT')
    }

    @autobind
    stopListening() {
      listening = false
      this.setState({ listening })
      this.manualDisconnect('STOP')
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
