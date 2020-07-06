import React, { useState } from 'react'
import { DictaphoneWidgetA, DictaphoneWidgetB } from './Dictaphone'
import SpeechRecognition from './SpeechRecognition'

export default () => {
  const [showFirstWidget, setShowFirstWidget] = useState(true)
  const toggleShowFirstWidget = () => setShowFirstWidget(!showFirstWidget)

  const [transcribing, setTranscribing] = useState(true)
  const toggleTranscribing = () => {
    setTranscribing(!transcribing)
  }

  const listenContinuously = () => SpeechRecognition.startListening({
    continuous: true,
    language: 'en-GB'
  })
  const listenContinuouslyInChinese = () => SpeechRecognition.startListening({
    continuous: true,
    language: 'zh-CN'
  })
  const listenOnce = () => SpeechRecognition.startListening({ continuous: false })

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      {showFirstWidget && <DictaphoneWidgetA />}
      <DictaphoneWidgetB />
      <button onClick={toggleTranscribing}>Toggle transcribing</button>
      <button onClick={listenOnce}>Listen once</button>
      <button onClick={listenContinuously}>Listen continuously</button>
      <button onClick={listenContinuouslyInChinese}>Listen continuously (Chinese)</button>
      <button onClick={toggleShowFirstWidget}>Toggle first widget</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
    </div>
  )
}
