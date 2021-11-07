export type Transcript = string

export type SubscriberId = string

export type SubscriberCallbacks = {
  onListeningChange: (listening: boolean) => void;
  onMicrophoneAvailabilityChange: (isMicrophoneAvailable: boolean) => void;
  onTranscriptChange: (interimTranscript: Transcript, finalTranscript: Transcript) => void;
  onClearTranscript: () => void;
  onBrowserSupportsSpeechRecognitionChange: (browserSupportsSpeechRecognitionChange: boolean) => void;
  onBrowserSupportsContinuousListeningChange: (browserSupportsSpeechRecognitionChange: boolean) => void;
}

export type SubscriberMap = {
  [id: SubscriberId]: SubscriberCallbacks
}

export enum Disconnect {
  Abort = 'ABORT',
  Stop = 'STOP',
  Reset = 'RESET',
}

export type ListeningOptions = {
  continuous?: boolean;
  language?: string;
}

export type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
}

export type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export type SpeechRecognitionEvent = {
  results: SpeechRecognitionResult[];
  resultIndex: number;
}

export type SpeechRecognitionErrorEvent = {
  error: 'not-allowed' | 'audio-capture';
  message: string;
}

export type SpeechRecognitionEventCallback = (speechRecognitionEvent: SpeechRecognitionEvent) => void

export type SpeechEndCallback = () => void

export type SpeechErrorCallback = (speechRecognitionErrorEvent: SpeechRecognitionErrorEvent) => void

export interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: SpeechRecognitionEventCallback;
  onend: SpeechEndCallback;
  onerror: SpeechErrorCallback;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  abort: () => Promise<void>;
  new (): SpeechRecognition;
}

export type Maybe<T> = T | null | undefined

export type Phrase = string | RegExp

export type FuzzyPhraseMatch = {
  phrase: Phrase;
  phraseWithoutSpecials: string;
  howSimilar: number;
  isFuzzyMatch: boolean;
}

export type PhraseMatch = {
  phrase: Phrase;
  parameters: string[];
  isFuzzyMatch: boolean;
}

export type Command = {
  command: Phrase | Phrase[];
  callback: (...args: any[]) => void;
  matchInterim: boolean;
  isFuzzyMatch: boolean;
  fuzzyMatchingThreshold: number;
  bestMatchOnly: boolean;
}

export type UseSpeechRecognitionOptions = {
  transcribing?: boolean;
  clearTranscriptOnListen?: boolean;
  commands?: Command[];
}