import React, { useState } from 'react'
import SpeechRecognition from '../SpeechRecognition'
import Dictaphone from './Dictaphone'

const DictaphoneWidgetA = () => {
  const [message, setMessage] = useState('')
  const [transcribing, setTranscribing] = useState(true)
  const [clearTranscriptOnListen, setClearTranscriptOnListen] = useState(false)
  const toggleTranscribing = () => setTranscribing(!transcribing)
  const toggleClearTranscriptOnListen = () => setClearTranscriptOnListen(!clearTranscriptOnListen)

  const commands = [
    {
      command: 'I would like to order *',
      callback: (food) => setMessage(`Your order is for: ${food}`),
      matchInterim: true
    },
    {
      command: 'The weather is :condition today',
      callback: (condition) => setMessage(`Today, the weather is ${condition}`)
    },
    {
      command: 'Hello',
      callback: () => setMessage('Hi there'),
      matchInterim: true
    }
  ]

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      <h3>Dictaphone A</h3>
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

export default DictaphoneWidgetA