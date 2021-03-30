import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT, BACKSPACE_TRANSCRIPT } from './constants'
import { concatTranscripts, removeWords } from './utils'

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
        const cmdArr = action.payload.command.split(' ')
        const transcript = state.finalTranscript
        const finalStr = removeWords(transcript, cmdArr.length + 1)
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
