import React, { useState } from 'react'
import Dictaphone from './Dictaphone'

const DictaphoneWidgetA = () => {
  const [message, setMessage] = useState('')
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

  return (
    <div>
      <h3>Dictaphone A</h3>
      <p>{message}</p>
      <Dictaphone commands={commands} />
    </div>
  )
}

export default DictaphoneWidgetA