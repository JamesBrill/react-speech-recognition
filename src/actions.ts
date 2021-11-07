import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'

export const clearTrancript = () => {
  return { type: CLEAR_TRANSCRIPT }
}

export const appendTrancript = (interimTranscript, finalTranscript) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript
    }
  }
}
