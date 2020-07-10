# react-speech-recognition
A React hook that converts speech from the microphone to text and makes it available to your React components.

[![npm version](https://img.shields.io/npm/v/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![npm downloads](https://img.shields.io/npm/dm/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![license](https://img.shields.io/github/license/JamesBrill/react-speech-recognition.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/JamesBrill/react-speech-recognition/badge.svg?branch=commands)](https://coveralls.io/github/JamesBrill/react-speech-recognition?branch=commands)


## How it works
`useSpeechRecognition` is a React hook that gives a component access to a transcript of speech picked up from the user's microphone.

`SpeechRecognition` manages the global state of the Speech Recognition API, exposing functions to turn the microphone on and off.

Under the hood,
it uses [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
Currently, **this component will only work in Chrome**. It fails gracefully on other browsers.

This version requires React 16.8 so that React hooks can be used. If you're used to version 2.x of `react-speech-recognition` or want to use an older version of React, you can see the old README [here](https://github.com/JamesBrill/react-speech-recognition/tree/v2.1.4). If you want to migrate to version 3.x, see the migration guide [here](docs/V3-MIGRATION.md).


## Installation

To install:

`npm install --save react-speech-recognition`

To import in your React code:

`import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'`


## Basic example

The most basic example of a component using this hook would be:

```
import React from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

const Dictaphone = () => {
  const { transcript, resetTranscript } = useSpeechRecognition()

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      <button onClick={SpeechRecognition.startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  )
}
export default Dictaphone
```

## Detecting browser support for Speech Recognition API

The Speech Recognition API is not supported on all browsers, so it is recommended that you render some fallback content if it is not supported by the user's browser:

```
if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
  // Render some fallback content
}
```

## Controlling the microphone

Before consuming the transcript, you should be familiar with `SpeechRecognition`, which gives you control over the microphone. The state of the microphone is global, so any functions you call on this object will affect _all_ components using `useSpeechRecognition`.

## Turning the microphone on

To start listening to speech, call the `startListening` function.

```
SpeechRecognition.startListening()
```

This is an asynchronous function, so it will need to be awaited if you want to do something after the microphone has been turned on.

## Turning the microphone off

To turn the microphone off, but still finish processing any speech in progress, call `stopListening`.

```
SpeechRecognition.stopListening()
```

To turn the microphone off, and cancel the processing of any speech in progress, call `abortListening`.

```
SpeechRecognition.abortListening()
```

## Consuming the microphone transcript

To make the microphone transcript available in your component, simply add:

```
const { transcript } = useSpeechRecognition()
```

## Resetting the microphone transcript

To set the transcript to an empty string, you can call the `resetTranscript` function provided by `useSpeechRecognition`. Note that this is local to your component and does not affect any other components using Speech Recognition.

```
const { resetTranscript } = useSpeechRecognition()
```

## Continuous listening

By default, the microphone will stop listening when the user stops speaking. This reflects the approach taken by "press to talk" buttons on modern devices.

If you want to listen continuously, set the `continuous` property to `true` when calling `startListening`. The microphone will continue to listen, even after the user has stopped speaking.

```
SpeechRecognition.startListening({ continuous: true })
```

## Commands

To respond when the user says a particular command, you can pass in a list of commands to the `useSpeechRecognition` hook. Each command is an object with the following properties:
- `command`: This is a string or `RegExp` representing the command you want to listen for
- `callback`: The function that is executed when the command is spoken
- `matchInterim`: Boolean that determines whether "interim" results should be matched against the command. This will make your component respond faster to commands, but also makes false positives more likely - i.e. the command is detected when it is not spoken. This is `false` by default and should only be set for simple commands.

### Command symbols

To make commands easier to write, the following symbols are supported:
- Splats: this is just a `*` and will match multi-word text
  - Example: `'I would like to order *'`
  - The words that match the splat will be passed into the callback, one argument per splat
- Named variables: this is written `:<name>` and will match a single word
  - Example: `'I am :height metres tall'`
  - The one word that matches the named variable will be passed into the callback
- Optional words: this is a phrase wrapped in parentheses `(` and `)`, and is not required to match the command:
  - Example: `'Pass the salt (please)'`
  - The above example would match both `'Pass the salt'` and `'Pass the salt please'`

### Example with commands

```
import React, { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

const Dictaphone = () => {
  const [message, setMessage] = useState('')
  const commands = [
    {
      command: 'I would like to order *',
      callback: (food) => setMessage(`Your order is for: ${food}`)
    },
    {
      command: 'The weather is :condition today',
      callback: (condition) => setMessage(`Today, the weather is ${condition}`)
    },
    {
      command: 'My top sports are * and *',
      callback: (sport1, sport2) => setMessage(`#1: ${sport1}, #2: ${sport2}`)
    },
    {
      command: 'Pass the salt (please)',
      callback: () => setMessage('My pleasure')
    },
    {
      command: 'Hello',
      callback: () => setMessage('Hi there!'),
      matchInterim: true
    }
  ]

  const { transcript } = useSpeechRecognition({ commands })

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      <p>{message}</p>
      <p>{transcript}</p>
    </div>
  )
}
export default Dictaphone
```

## Changing language

To listen for a specific language, you can pass a language tag (e.g. `zh-CN`for Chinese) calling `startListening`. See [here](docs/API.md#language-string) for a list of supported languages.

```
SpeechRecognition.startListening({ language: 'zh-CN' })
```

## How to use `react-speech-recognition` offline?

Unfortunately, speech recognition will not function in Chrome when offline. According to the [Web Speech API docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API): `On Chrome, using Speech Recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline.`

If you are building an offline web app, you can detect when the browser is offline by inspecting the value of `navigator.onLine`. If it is `true`, you can render the transcript generated by React Speech Recognition. If it is `false`, it's advisable to render offline fallback content that signifies that speech recognition is disabled. The online/offline API is simple to use - you can read how to use it [here](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events).


## Developing

You can run an example React app that uses `react-speech-recognition` with:
```
npm i
npm run dev
```

On `http://localhost:3000`, you'll be able to speak into the microphone and see your speech as text on the web page. There are also controls for turning speech recognition on and off. You can make changes to the web app itself in the `example` directory. Any changes you make to the web app or `react-speech-recognition` itself will be live reloaded in the browser.

## License

MIT
