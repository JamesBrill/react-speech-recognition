import { APPEND_TRANSCRIPT, CLEAR_TRANSCRIPT } from "./constants.js";
import type { Transcript } from "./types.js";

export const clearTranscript = () => {
  return { type: CLEAR_TRANSCRIPT } as const;
};

export const appendTranscript = (
  interimTranscript: Transcript,
  finalTranscript: Transcript,
) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript,
    },
  } as const;
};

type ClearTranscriptAction = ReturnType<typeof clearTranscript>;
type AppendTranscriptAction = ReturnType<typeof appendTranscript>;
export type TranscriptState = AppendTranscriptAction["payload"];
export type TranscriptAction = ClearTranscriptAction | AppendTranscriptAction;
