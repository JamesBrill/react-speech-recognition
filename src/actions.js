import { APPEND_TRANSCRIPT, CLEAR_TRANSCRIPT } from "./constants";

export const clearTranscript = () => {
  return { type: CLEAR_TRANSCRIPT };
};

export const appendTranscript = (interimTranscript, finalTranscript) => {
  return {
    type: APPEND_TRANSCRIPT,
    payload: {
      interimTranscript,
      finalTranscript,
    },
  };
};
