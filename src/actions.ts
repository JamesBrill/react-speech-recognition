import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'

export const clearTrancript = () => {
  return { type: CLEAR_TRANSCRIPT }
}

export const appendTrancript = (interimTranscript: string, finalTranscript: string) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript
    }
  }
}
