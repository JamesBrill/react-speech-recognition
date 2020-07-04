import React, { useState } from 'react'
import SpeechRecognition from '../SpeechRecognition'
import Dictaphone from './Dictaphone'

const DictaphoneWidgetB = () => {
  const [message, setMessage] = useState('')
  const [transcribing, setTranscribing] = useState(true)
  const [clearTranscriptOnListen, setClearTranscriptOnListen] = useState(false)
  const toggleTranscribing = () => setTranscribing(!transcribing)
  const toggleClearTranscriptOnListen = () => setClearTranscriptOnListen(!clearTranscriptOnListen)

  const commands = [
    {
      command: '* is my name',
      callback: (name) => setMessage(`Hi ${name}!`),
      matchInterim: true
    },
    {
      command: 'My top sports are * and *',
      callback: (sport1, sport2) => setMessage(`#1: ${sport1}, #2: ${sport2}`)
    },
    {
      command: 'Goodbye',
      callback: () => setMessage('So long!'),
      matchInterim: true
    }
  ]

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      <h3>Dictaphone B</h3>
      <p>{message}</p>
      <button onClick={toggleTranscribing}>Toggle transcribing</button>
      <button onClick={toggleClearTranscriptOnListen}>Toggle clearTranscriptOnListen</button>
      <Dictaphone
        transcribing={transcribing}
        clearTranscriptOnListen={clearTranscriptOnListen}
        commands={commands}
      />
    </div>
  )
}

export default DictaphoneWidgetB