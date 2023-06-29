import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT, MUTATE_TRANSCRIPT } from './constants'

export const clearTranscript = () => {
  return { type: CLEAR_TRANSCRIPT }
}

export const appendTranscript = (interimTranscript, finalTranscript) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript
    }
  }
}

export const mutateTranscript = (mutatedTranscript) => {
  return {
    type: MUTATE_TRANSCRIPT,
    payload: {
      mutatedTranscript
    }
  }
}
