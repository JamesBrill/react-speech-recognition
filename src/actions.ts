import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'
import type { Transcript } from './types'

export const clearTrancript = () => {
  return { type: CLEAR_TRANSCRIPT }
}

export const appendTrancript = (interimTranscript: Transcript, finalTranscript: Transcript) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript
    }
  }
}
