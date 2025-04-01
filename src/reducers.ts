import type { TranscriptAction, TranscriptState } from "./actions.js";
import { APPEND_TRANSCRIPT, CLEAR_TRANSCRIPT } from "./constants.js";
import { concatTranscripts } from "./utils.js";

const transcriptReducer = (
  state: TranscriptState,
  action: TranscriptAction,
): TranscriptState => {
  switch (action.type) {
    case CLEAR_TRANSCRIPT:
      return {
        interimTranscript: "",
        finalTranscript: "",
      };
    case APPEND_TRANSCRIPT:
      return {
        interimTranscript: action.payload.interimTranscript,
        finalTranscript: concatTranscripts(
          state.finalTranscript,
          action.payload.finalTranscript,
        ),
      };
    default:
      throw new Error();
  }
};

export { transcriptReducer };
