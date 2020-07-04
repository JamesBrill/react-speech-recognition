import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import SpeechRecognition from '../SpeechRecognition'

const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  listening: PropTypes.bool,
  transcribing: PropTypes.bool,
  clearTranscriptOnListen: PropTypes.bool
}

const Dictaphone = ({
  transcript,
  resetTranscript,
  interimTranscript,
  finalTranscript,
  listening,
  transcribing,
  clearTranscriptOnListen
}) => {
  useEffect(() => {
    if (interimTranscript !== '') {
      console.log('Got interim result:', interimTranscript)
    }
    if (finalTranscript !== '') {
      console.log('Got final result:', finalTranscript)
    }
  }, [interimTranscript, finalTranscript]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span>listening: {listening ? 'on' : 'off'}</span>
      <span>transcribing: {transcribing ? 'on' : 'off'}</span>
      <span>clearTranscriptOnListen: {clearTranscriptOnListen ? 'on' : 'off'}</span>
      <button onClick={resetTranscript}>Reset</button>
      <span>{transcript}</span>
    </div>
  )
}

Dictaphone.propTypes = propTypes
export default SpeechRecognition(Dictaphone)
