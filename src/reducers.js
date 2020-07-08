import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'
import { concatTranscripts } from './utils'

const transcriptReducer = (state, action) => {
  switch (action.type) {
    case CLEAR_TRANSCRIPT:
      return {
        interimTranscript: '',
        finalTranscript: ''
      }
    case APPEND_TRANSCRIPT:
      return {
        interimTranscript: action.payload.interimTranscript,
        finalTranscript: concatTranscripts(state.finalTranscript, action.payload.finalTranscript)
      }
    default:
      throw new Error()
  }
}

export { transcriptReducer }
