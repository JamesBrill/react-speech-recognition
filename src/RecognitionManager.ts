import debounce from "lodash.debounce";
import { isNative } from "./NativeSpeechRecognition.js";
import isAndroid from "./isAndroid.js";
import {
  Disconnect,
  type ListeningOptions,
  type SpeechRecognition,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
  type SubscriberCallbacks,
  type SubscriberId,
  type SubscriberMap,
  type Transcript,
} from "./types.js";
import { browserSupportsPolyfills, concatTranscripts } from "./utils.js";

export default class RecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private pauseAfterDisconnect = false;
  public interimTranscript = "";
  private finalTranscript = "";
  public listening = false;
  public isMicrophoneAvailable = true;
  private subscribers: SubscriberMap = {};
  private onStopListening = () => {};
  private previousResultWasFinalOnly = false;

  constructor(SpeechRecognition: SpeechRecognition) {
    this.resetTranscript = this.resetTranscript.bind(this);
    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.abortListening = this.abortListening.bind(this);
    this.setSpeechRecognition = this.setSpeechRecognition.bind(this);
    this.disableRecognition = this.disableRecognition.bind(this);

    this.setSpeechRecognition(SpeechRecognition);

    if (isAndroid()) {
      this.updateFinalTranscript = debounce(this.updateFinalTranscript, 250);
    }
  }

  setSpeechRecognition(SpeechRecognition: SpeechRecognition) {
    const browserSupportsRecogniser =
      !!SpeechRecognition &&
      (isNative(SpeechRecognition) || browserSupportsPolyfills());
    if (browserSupportsRecogniser) {
      this.disableRecognition();
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.onresult = this.updateTranscript.bind(this);
      this.recognition.onend = this.onRecognitionDisconnect.bind(this);
      this.recognition.onerror = this.onError.bind(this);
    }
    this.emitBrowserSupportsSpeechRecognitionChange(browserSupportsRecogniser);
  }

  subscribe(id: SubscriberId, callbacks: SubscriberCallbacks) {
    this.subscribers[id] = callbacks;
  }

  unsubscribe(id: SubscriberId) {
    delete this.subscribers[id];
  }

  emitListeningChange(listening: boolean) {
    this.listening = listening;
    Object.keys(this.subscribers).forEach((id) => {
      const { onListeningChange } = this.subscribers[id];
      onListeningChange(listening);
    });
  }

  emitMicrophoneAvailabilityChange(isMicrophoneAvailable: boolean) {
    this.isMicrophoneAvailable = isMicrophoneAvailable;
    Object.keys(this.subscribers).forEach((id) => {
      const { onMicrophoneAvailabilityChange } = this.subscribers[id];
      onMicrophoneAvailabilityChange(isMicrophoneAvailable);
    });
  }

  emitTranscriptChange(
    interimTranscript: Transcript,
    finalTranscript: Transcript,
  ) {
    Object.keys(this.subscribers).forEach((id) => {
      const { onTranscriptChange } = this.subscribers[id];
      onTranscriptChange(interimTranscript, finalTranscript);
    });
  }

  emitClearTranscript() {
    Object.keys(this.subscribers).forEach((id) => {
      const { onClearTranscript } = this.subscribers[id];
      onClearTranscript();
    });
  }

  emitBrowserSupportsSpeechRecognitionChange(
    browserSupportsSpeechRecognitionChange: boolean,
  ) {
    Object.keys(this.subscribers).forEach((id) => {
      const {
        onBrowserSupportsSpeechRecognitionChange,
        onBrowserSupportsContinuousListeningChange,
      } = this.subscribers[id];
      onBrowserSupportsSpeechRecognitionChange(
        browserSupportsSpeechRecognitionChange,
      );
      onBrowserSupportsContinuousListeningChange(
        browserSupportsSpeechRecognitionChange,
      );
    });
  }

  disconnect(disconnectType: Disconnect) {
    if (this.recognition && this.listening) {
      switch (disconnectType) {
        case Disconnect.Abort:
          this.pauseAfterDisconnect = true;
          this.abort();
          break;
        case Disconnect.Reset:
          this.pauseAfterDisconnect = false;
          this.abort();
          break;
        case Disconnect.Stop:
        default:
          this.pauseAfterDisconnect = true;
          this.stop();
      }
    }
  }

  disableRecognition() {
    if (this.recognition) {
      this.recognition.onresult = () => {};
      this.recognition.onend = () => {};
      this.recognition.onerror = () => {};
      if (this.listening) {
        this.stopListening();
      }
    }
  }

  onError(event: SpeechRecognitionErrorEvent) {
    if (event && event.error && event.error === "not-allowed") {
      this.emitMicrophoneAvailabilityChange(false);
      this.disableRecognition();
    }
  }

  onRecognitionDisconnect() {
    this.onStopListening();
    this.listening = false;
    if (this.pauseAfterDisconnect) {
      this.emitListeningChange(false);
    } else if (this.recognition) {
      if (this.recognition.continuous) {
        this.startListening({ continuous: this.recognition.continuous });
      } else {
        this.emitListeningChange(false);
      }
    }
    this.pauseAfterDisconnect = false;
  }

  updateTranscript({ results, resultIndex }: SpeechRecognitionEvent) {
    const currentIndex =
      resultIndex === undefined ? results.length - 1 : resultIndex;
    this.interimTranscript = "";
    this.finalTranscript = "";
    for (let i = currentIndex; i < results.length; ++i) {
      if (
        results[i].isFinal &&
        (!isAndroid() || results[i][0].confidence > 0)
      ) {
        this.updateFinalTranscript(results[i][0].transcript);
      } else {
        this.interimTranscript = concatTranscripts(
          this.interimTranscript,
          results[i][0].transcript,
        );
      }
    }
    let isDuplicateResult = false;
    if (this.interimTranscript === "" && this.finalTranscript !== "") {
      if (this.previousResultWasFinalOnly) {
        isDuplicateResult = true;
      }
      this.previousResultWasFinalOnly = true;
    } else {
      this.previousResultWasFinalOnly = false;
    }
    if (!isDuplicateResult) {
      this.emitTranscriptChange(this.interimTranscript, this.finalTranscript);
    }
  }

  updateFinalTranscript(newFinalTranscript: Transcript) {
    this.finalTranscript = concatTranscripts(
      this.finalTranscript,
      newFinalTranscript,
    );
  }

  resetTranscript() {
    this.disconnect(Disconnect.Reset);
  }

  async startListening({
    continuous = false,
    language,
  }: ListeningOptions = {}) {
    if (!this.recognition) {
      return;
    }

    const isContinuousChanged = continuous !== this.recognition.continuous;
    const isLanguageChanged = language && language !== this.recognition.lang;
    if (isContinuousChanged || isLanguageChanged) {
      if (this.listening) {
        await this.stopListening();
      }
      this.recognition.continuous = isContinuousChanged
        ? continuous
        : this.recognition.continuous;
      this.recognition.lang = isLanguageChanged
        ? language
        : this.recognition.lang;
    }
    if (!this.listening) {
      if (!this.recognition.continuous) {
        this.resetTranscript();
        this.emitClearTranscript();
      }
      try {
        await this.start();
        this.emitListeningChange(true);
      } catch (e) {
        // DOMExceptions indicate a redundant microphone start - safe to swallow
        if (!(e instanceof DOMException)) {
          this.emitMicrophoneAvailabilityChange(false);
        }
      }
    }
  }

  async abortListening() {
    this.disconnect(Disconnect.Abort);
    this.emitListeningChange(false);
    await new Promise<void>((resolve) => {
      this.onStopListening = resolve;
    });
  }

  async stopListening() {
    this.disconnect(Disconnect.Stop);
    this.emitListeningChange(false);
    await new Promise<void>((resolve) => {
      this.onStopListening = resolve;
    });
  }

  getRecognition() {
    return this.recognition;
  }

  async start() {
    if (this.recognition && !this.listening) {
      await this.recognition.start();
      this.listening = true;
    }
  }

  stop() {
    if (this.recognition && this.listening) {
      this.recognition.stop();
      this.listening = false;
    }
  }

  abort() {
    if (this.recognition && this.listening) {
      this.recognition.abort();
      this.listening = false;
    }
  }
}
