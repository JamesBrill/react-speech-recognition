import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'
import { ReducerAction } from './reducers'

export const clearTrancript = (): ReducerAction => {
  return { type: CLEAR_TRANSCRIPT }
}

export const appendTrancript = (interimTranscript: string, finalTranscript: string): ReducerAction => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript
    }
  }
}
