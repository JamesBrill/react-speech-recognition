import isAndroid from './isAndroid'
import { debounce, concatTranscripts } from './utils'
import { StartListeningParameter, DisconnectType, CallbacksType } from './types'

export default class RecognitionManager {
  recognition: any
  browserSupportsSpeechRecognition: boolean
  pauseAfterDisconnect: boolean
  interimTranscript: string
  finalTranscript: string
  listening: boolean
  subscribers: {
    id: CallbacksType | undefined
  }
  onStopListening: Function

  constructor() {
    const BrowserSpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition ||
        (window as any).oSpeechRecognition);
    this.recognition = BrowserSpeechRecognition
      ? new BrowserSpeechRecognition()
      : null
    this.browserSupportsSpeechRecognition = this.recognition !== null
    this.pauseAfterDisconnect = false
    this.interimTranscript = ''
    this.finalTranscript = ''
    this.listening = false
    this.subscribers = {
      id: undefined
    }
    this.onStopListening = () => {}

    if (this.browserSupportsSpeechRecognition) {
      this.recognition.continuous = false
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

  subscribe(id: number, callbacks: CallbacksType) {
    this.subscribers.id = callbacks
  }

  unsubscribe(id: number) {
    delete this.subscribers.id
  }

  emitListeningChange(listening: boolean) {
    this.listening = listening
    Object.keys(this.subscribers).forEach((id) => {
      const { onListeningChange } = this.subscribers.id as CallbacksType
      onListeningChange(listening)
    })
  }

  emitTranscriptChange(interimTranscript: string, finalTranscript: string) {
    Object.keys(this.subscribers).forEach((id) => {
      const { onTranscriptChange } = this.subscribers.id as CallbacksType
      onTranscriptChange(interimTranscript, finalTranscript)
    })
  }

  emitClearTranscript() {
    Object.keys(this.subscribers).forEach((id) => {
      const { onClearTranscript } = this.subscribers.id as CallbacksType
      onClearTranscript()
    })
  }

  disconnect(disconnectType: DisconnectType) {
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
    this.onStopListening()
    this.listening = false
    if (this.pauseAfterDisconnect) {
      this.emitListeningChange(false)
    } else if (this.browserSupportsSpeechRecognition) {
      if (this.recognition.continuous) {
        this.startListening({ continuous: this.recognition.continuous })
      } else {
        this.emitListeningChange(false)
      }
    }
    this.pauseAfterDisconnect = false
  }

  updateTranscript(event: SpeechRecognitionEvent) {
    this.interimTranscript = ''
    this.finalTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal && (!isAndroid() || event.results[i][0].confidence > 0)) {
        this.updateFinalTranscript(event.results[i][0].transcript)
      } else {
        this.interimTranscript = concatTranscripts(
          this.interimTranscript,
          event.results[i][0].transcript
        )
      }
    }
    this.emitTranscriptChange(this.interimTranscript, this.finalTranscript)
  }

  updateFinalTranscript(newFinalTranscript: string) {
    this.finalTranscript = concatTranscripts(
      this.finalTranscript,
      newFinalTranscript
    )
  }

  resetTranscript() {
    this.disconnect('RESET')
  }

  async startListening({ continuous = false, language }: StartListeningParameter = {}) {
    if (!this.browserSupportsSpeechRecognition) {
      return
    }

    const isContinuousChanged = continuous !== this.recognition.continuous
    const isLanguageChanged = language && language !== this.recognition.lang
    if (isContinuousChanged || isLanguageChanged) {
      if (this.listening) {
        this.stopListening()
        await new Promise(resolve => {
          this.onStopListening = resolve
        })
      }
      this.recognition.continuous = isContinuousChanged ? continuous : this.recognition.continuous
      this.recognition.lang = isLanguageChanged ? language : this.recognition.lang
    }
    if (!this.listening) {
      if (!this.recognition.continuous) {
        this.resetTranscript()
        this.emitClearTranscript()
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
    this.disconnect('ABORT')
    this.emitListeningChange(false)
  }

  stopListening() {
    this.disconnect('STOP')
    this.emitListeningChange(false)
  }

  getRecognition() {
    return this.recognition
  }

  start() {
    if (this.browserSupportsSpeechRecognition && !this.listening) {
      this.recognition.start()
      this.listening = true
    }
  }

  stop() {
    if (this.browserSupportsSpeechRecognition && this.listening) {
      this.recognition.stop()
      this.listening = false
    }
  }

  abort() {
    if (this.browserSupportsSpeechRecognition && this.listening) {
      this.recognition.abort()
      this.listening = false
    }
  }
}
