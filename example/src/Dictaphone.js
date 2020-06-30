import React from 'react'
import PropTypes from 'prop-types'
import SpeechRecognition from './SpeechRecognition'

const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
}

const Dictaphone = ({
  transcript,
  resetTranscript,
  startTranscribing,
  stopTranscribing,
  browserSupportsSpeechRecognition
}) => {
  if (!browserSupportsSpeechRecognition) {
    return null
  }

  return (
    <div>
      <button onClick={resetTranscript}>Reset</button>
      <button onClick={startTranscribing}>Start</button>
      <button onClick={stopTranscribing}>Stop</button>
      <span>{transcript}</span>
    </div>
  )
}

Dictaphone.propTypes = propTypes
export default SpeechRecognition(Dictaphone)
