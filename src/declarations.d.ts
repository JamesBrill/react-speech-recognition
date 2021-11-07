import type { SpeechRecognition } from './types'

interface Window {
  SpeechRecognition?: SpeechRecognition;
  webkitSpeechRecognition?: SpeechRecognition;
  mozSpeechRecognition?: SpeechRecognition;
  msSpeechRecognition?: SpeechRecognition;
  oSpeechRecognition?: SpeechRecognition;
}
