import React, { Component } from 'react'
import { debounce, autobind } from 'core-decorators'

const BrowserSpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition
const recognition = BrowserSpeechRecognition
  ? new BrowserSpeechRecognition()
  : null
recognition.start()
let listening = true
let isManuallyDisconnected = false

export default function SpeechRecognition(WrappedComponent) {
  return class SpeechRecognitionContainer extends Component {
    constructor(props) {
      super(props)

      this.state = {
        interimTranscript: '',
        finalTranscript: '',
        recognition: null,
        browserSupportsSpeechRecognition: true,
        listening: false
      }
    }

    componentWillMount() {
      if (recognition) {
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = this.updateTranscript.bind(this)
        recognition.onend = this.onRecognitionDisconnect.bind(this)
        this.setState({ recognition, listening })
      } else {
        this.setState({ browserSupportsSpeechRecognition: false })
      }
    }

    @autobind
    manualDisconnect(disconnectType) {
      if (this.state.recognition) {
        isManuallyDisconnected = true
        switch (disconnectType) {
          case 'ABORT':
            this.state.recognition.abort()
            break
          case 'STOP':
          default:
            this.state.recognition.stop()
        }
      }
    }

    @debounce(1000)
    onRecognitionDisconnect() {
      if (!isManuallyDisconnected) {
        this.startListening()
      } else {
        listening = false
        this.setState({ listening })
      }
      isManuallyDisconnected = false
    }

    updateTranscript(event) {
      const { finalTranscript, interimTranscript } = this.getNewTranscript(
        event
      )

      this.setState({ finalTranscript, interimTranscript })
    }

    getNewTranscript(event) {
      let finalTranscript = this.state.finalTranscript
      let interimTranscript = ''
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
      return { finalTranscript, interimTranscript }
    }

    concatTranscripts(...transcriptParts) {
      return transcriptParts.map(t => t.trim()).join(' ').trim()
    }

    @autobind
    resetTranscript() {
      this.setState({ interimTranscript: '', finalTranscript: '' })
      this.manualDisconnect('ABORT')
    }

    @autobind
    startListening() {
      if (this.state.recognition) {
        this.state.recognition.start()
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
      const { finalTranscript, interimTranscript } = this.state
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
          {...this.state}
          {...this.props} />
      )
    }
  }
}
