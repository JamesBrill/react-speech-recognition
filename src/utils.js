import isAndroid from './isAndroid'

const debounce = (func, wait, immediate) => {
  let timeout
  return function() {
    const context = this
    const args = arguments
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

const concatTranscripts = (...transcriptParts) => {
  return transcriptParts.map(t => t.trim()).join(' ').trim()
}

class RecognitionManager {
  constructor() {
    const BrowserSpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition ||
      window.oSpeechRecognition)
    this.recognition = BrowserSpeechRecognition
      ? new BrowserSpeechRecognition()
      : null
    this.browserSupportsSpeechRecognition = this.recognition !== null
    this.started = false
    this.pauseAfterDisconnect = false
    this.interimTranscript = ''
    this.finalTranscript = ''
    this.listening = false
    this.subscribers = {}

    if (this.browserSupportsSpeechRecognition) {
      this.recognition.interimResults = true
      this.recognition.onresult = this.updateTranscript.bind(this)
      this.recognition.onend = this.onRecognitionDisconnect.bind(this)
    }

    this.resetTranscript = this.resetTranscript.bind(this)
    this.startListening = this.startListening.bind(this)
    this.stopListening = this.stopListening.bind(this)
    this.abortListening = this.abortListening.bind(this)

    if (isAndroid()) {
      this.updateFinalTranscript = debounce(this.updateFinalTranscript, 250, true)
    }
  }

  subscribe(id, options, listeners) {
    this.subscribers[id] = listeners
    const { autoStart, continuous } = options
    if (this.browserSupportsSpeechRecognition) {
      this.recognition.continuous = continuous !== false
    }
    if (autoStart) {
      this.startListening()
    }
  }

  unsubscribe(id) {
    delete this.subscribers[id]
  }

  emitListeningChange(listening) {
    Object.keys(this.subscribers).forEach(subscriber => {
      const { onListeningChange } = this.subscribers[subscriber]
      onListeningChange(listening)
    })
  }

  emitTranscriptChange(interimTranscript, finalTranscript) {
    Object.keys(this.subscribers).forEach(subscriber => {
      const { onTranscriptChange } = this.subscribers[subscriber]
      onTranscriptChange(interimTranscript, finalTranscript)
    })
  }

  disconnect(disconnectType) {
    if (this.browserSupportsSpeechRecognition) {
      switch (disconnectType) {
        case 'ABORT':
          this.pauseAfterDisconnect = true
          this.abort()
          break
        case 'RESET':
          this.pauseAfterDisconnect = false
          this.abort()
          break
        case 'STOP':
        default:
          this.pauseAfterDisconnect = true
          this.stop()
      }
    }
  }

  onRecognitionDisconnect() {
    if (this.pauseAfterDisconnect) {
      this.emitListeningChange(false)
    } else if (this.recognition) {
      if (this.recognition.continuous) {
        this.startListening()
      } else {
        this.emitListeningChange(false)
      }
    }
    this.pauseAfterDisconnect = false
  }

  updateTranscript(event) {
    this.interimTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal && (!isAndroid() || event.results[i][0].confidence > 0)) {
        this.updateFinalTranscript(this.finalTranscript, event.results[i][0].transcript)
      } else {
        this.interimTranscript = concatTranscripts(
          this.interimTranscript,
          event.results[i][0].transcript
        )
      }
    }
    this.emitTranscriptChange(this.interimTranscript, this.finalTranscript)
  }

  updateFinalTranscript(finalTranscript, newFinalTranscript) {
    this.finalTranscript = concatTranscripts(
      finalTranscript,
      newFinalTranscript
    )
  }

  resetTranscript() {
    this.disconnect('RESET')
    this.emitTranscriptChange('', '')
  }

  startListening() {
    if (this.recognition && !this.listening) {
      if (!this.recognition.continuous) {
        this.resetTranscript()
      }
      try {
        this.start()
      } catch (DOMException) {
        // Tried to start recognition after it has already started - safe to swallow this error
      }
      this.emitListeningChange(true)
    }
  }

  abortListening() {
    this.emitListeningChange(false)
    this.disconnect('ABORT')
  }

  stopListening() {
    this.emitListeningChange(false)
    this.disconnect('STOP')
  }

  getRecognition() {
    return this.recognition
  }

  start() {
    if (this.browserSupportsSpeechRecognition && !this.started) {
      this.recognition.start()
      this.started = true
    }
  }

  stop() {
    if (this.browserSupportsSpeechRecognition && this.started) {
      this.recognition.stop()
      this.started = false
    }
  }

  abort() {
    if (this.browserSupportsSpeechRecognition && this.started) {
      this.recognition.abort()
      this.started = false
    }
  }
}

export { debounce, concatTranscripts, RecognitionManager }
