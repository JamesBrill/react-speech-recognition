import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT, BACKSPACE_TRANSCRIPT } from './constants'
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
    case BACKSPACE_TRANSCRIPT:
      if (state.finalTranscript && state.finalTranscript.length) {
        const lastIndex = state.finalTranscript.lastIndexOf(' ')
        const finalStr = state.finalTranscript.substring(0, lastIndex)
        return {
          interimTranscript: '',
          finalTranscript: finalStr
        }
      } else {
        return {
          interimTranscript: state.interimTranscript,
          finalTranscript: state.finalTranscript
        }
      }
    default:
      throw new Error()
  }
}

export { transcriptReducer }
