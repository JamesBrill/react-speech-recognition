import type { SpeechRecognition } from './types'

const NativeSpeechRecognition = typeof window !== 'undefined' && (
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition
)

export const isNative = (SpeechRecognitionImpl: SpeechRecognition) => SpeechRecognitionImpl === NativeSpeechRecognition

export default NativeSpeechRecognition
