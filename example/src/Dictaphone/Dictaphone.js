import React, { useState, useEffect } from 'react'
import SpeechRecognition, { useSpeechRecognition } from '../SpeechRecognition'

export default ({ commands }) => {
  const [transcribing, setTranscribing] = useState(true)
  const [clearTranscriptOnListen, setClearTranscriptOnListen] = useState(false)
  const toggleTranscribing = () => setTranscribing(!transcribing)
  const toggleClearTranscriptOnListen = () => setClearTranscriptOnListen(!clearTranscriptOnListen)
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
  } = useSpeechRecognition({ transcribing, clearTranscriptOnListen, commands })
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
      <button onClick={toggleTranscribing}>Toggle transcribing</button>
      <button onClick={toggleClearTranscriptOnListen}>Toggle clearTranscriptOnListen</button>
      <span>{transcript}</span>
    </div>
  )
}