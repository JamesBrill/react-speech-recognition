import type { SpeechRecognition } from "./types";

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognition;
    webkitSpeechRecognition?: SpeechRecognition;
    mozSpeechRecognition?: SpeechRecognition;
    msSpeechRecognition?: SpeechRecognition;
    oSpeechRecognition?: SpeechRecognition;
  }
}
