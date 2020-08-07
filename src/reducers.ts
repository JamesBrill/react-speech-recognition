import { CLEAR_TRANSCRIPT, APPEND_TRANSCRIPT } from './constants'
import { concatTranscripts } from './utils'

interface ReducerState {
  interimTranscript: string
  finalTranscript: string
}

export interface ReducerAction {
  type: string
  payload?: {
    interimTranscript: string
    finalTranscript: string
  }
}

const transcriptReducer = (
  state: ReducerState,
  action: ReducerAction
): ReducerState => {
  switch (action.type) {
    case CLEAR_TRANSCRIPT:
      return {
        interimTranscript: "",
        finalTranscript: "",
      };
    case APPEND_TRANSCRIPT:
      return {
        interimTranscript: action?.payload?.interimTranscript ?? "",
        finalTranscript: concatTranscripts(
          state.finalTranscript,
          action.payload?.finalTranscript ?? ""
        ),
      };
    default:
      throw new Error();
  }
};

export { transcriptReducer }
