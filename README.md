# react-speech-recognition
A React hook that converts speech from the microphone to text and makes it available to your React components.

[![npm version](https://img.shields.io/npm/v/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![npm downloads](https://img.shields.io/npm/dm/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![license](https://img.shields.io/github/license/JamesBrill/react-speech-recognition.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/JamesBrill/react-speech-recognition/badge.svg?branch=commands)](https://coveralls.io/github/JamesBrill/react-speech-recognition?branch=commands)

## How it works
`useSpeechRecognition` is a React hook that gives a component access to a transcript of speech picked up from the user's microphone.

`SpeechRecognition` manages the global state of the Web Speech API, exposing functions to turn the microphone on and off.

Under the hood,
it uses [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Note that browser support for this API is currently limited, with Chrome having the best experience - see [supported browsers](#supported-browsers) for more information.

This version requires React 16.8 so that React hooks can be used. If you're used to version 2.x of `react-speech-recognition` or want to use an older version of React, you can see the old README [here](https://github.com/JamesBrill/react-speech-recognition/tree/v2.1.4). If you want to migrate to version 3.x, see the migration guide [here](docs/V3-MIGRATION.md).

## Useful links

* [Basic example](#basic-example)
* [Supported browsers](#supported-browsers)
* [Polyfills](docs/POLYFILLS.md)
* [API docs](docs/API.md)
* [Version 3 migration guide](docs/V3-MIGRATION.md)
* [TypeScript declaration file in DefinitelyTyped](https://github.com/OleksandrYehorov/DefinitelyTyped/blob/master/types/react-speech-recognition/index.d.ts)

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

You can see more examples in the example React app attached to this repo. See [Developing](#developing).

## Detecting browser support for Web Speech API

Currently, this feature is not supported in all browsers (unless you integrate a [polyfill](docs/POLYFILLS.md)), with the best experience being available on desktop Chrome. However, it fails gracefully on other browsers. It is recommended that you render some fallback content if it is not supported by the user's browser:

```
if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
  // Render some fallback content
}
```

### Supported browsers

The Web Speech API is largely only supported by Google browsers - if you want it to work on other browsers, this library does support polyfills to enable speech recognition outside of Chrome (see [here](docs/POLYFILLS.md) for more details).

As of January 2021, the following browsers support the Web Speech API:

* Chrome (desktop): this is by far the smoothest experience
* Microsoft Edge
* Chrome (Android): a word of warning about this platform, which is that there can be an annoying beeping sound when turning the microphone on. This is part of the Android OS and cannot be controlled from the browser
* Android webview
* Samsung Internet

iOS does not support the API on any browser.

For all other browsers, you can render fallback content using the `SpeechRecognition.browserSupportsSpeechRecognition` function described above. Alternatively, as mentioned before, you can integrate a [polyfill](docs/POLYFILLS.md).

## Controlling the microphone

Before consuming the transcript, you should be familiar with `SpeechRecognition`, which gives you control over the microphone. The state of the microphone is global, so any functions you call on this object will affect _all_ components using `useSpeechRecognition`.

### Turning the microphone on

To start listening to speech, call the `startListening` function.

```
SpeechRecognition.startListening()
```

This is an asynchronous function, so it will need to be awaited if you want to do something after the microphone has been turned on.

### Turning the microphone off

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

## Commands

To respond when the user says a particular phrase, you can pass in a list of commands to the `useSpeechRecognition` hook. Each command is an object with the following properties:
- `command`: This is a string or `RegExp` representing the phrase you want to listen for. If you want to use the same callback for multiple commands, you can also pass in an array here, with each value being a string or `RegExp`
- `callback`: The function that is executed when the command is spoken. The last argument that this function receives will always be an object containing the following properties:
  - `command`: The command phrase that was matched. This can be useful when you provide an array of command phrases for the same callback and need to know which one triggered it
  - `resetTranscript`: A function that sets the transcript to an empty string
- `matchInterim`: Boolean that determines whether "interim" results should be matched against the command. This will make your component respond faster to commands, but also makes false positives more likely - i.e. the command may be detected when it is not spoken. This is `false` by default and should only be set for simple commands.
- `isFuzzyMatch`: Boolean that determines whether the comparison between speech and `command` is based on similarity rather than an exact match. Fuzzy matching is useful for commands that are easy to mispronounce or be misinterpreted by the Speech Recognition engine (e.g. names of places, sports teams, restaurant menu items). It is intended for commands that are string literals without special characters. If `command` is a string with special characters or a `RegExp`, it will be converted to a string without special characters when fuzzy matching. The similarity that is needed to match the command can be configured with `fuzzyMatchingThreshold`. `isFuzzyMatch` is `false` by default. When it is set to `true`, it will pass four arguments to `callback`:
  - The value of `command` (with any special characters removed)
  - The speech that matched `command`
  - The similarity between `command` and the speech
  - The object mentioned in the `callback` description above
- `fuzzyMatchingThreshold`: If the similarity of speech to `command` is higher than this value when `isFuzzyMatch` is turned on, the `callback` will be invoked. You should set this only if `isFuzzyMatch` is `true`. It takes values between `0` (will match anything) and `1` (needs an exact match). The default value is `0.8`.
- `bestMatchOnly`: Boolean that, when `isFuzzyMatch` is `true`, determines whether the callback should only be triggered by the command phrase that _best_ matches the speech, rather than being triggered by all matching fuzzy command phrases. This is useful for fuzzy commands with multiple command phrases assigned to the same callback function - you may only want the callback to be triggered once for each spoken command. You should set this only if `isFuzzyMatch` is `true`. The default value is `false`.

### Command symbols

To make commands easier to write, the following symbols are supported:
- Splats: this is just a `*` and will match multi-word text:
  - Example: `'I would like to order *'`
  - The words that match the splat will be passed into the callback, one argument per splat
- Named variables: this is written `:<name>` and will match a single word:
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
      command: ['Hello', 'Hi'],
      callback: ({ command }) => setMessage(`Hi there! You said: "${command}"`),
      matchInterim: true
    },
    {
      command: 'Beijing',
      callback: (command, spokenPhrase, similarityRatio) => setMessage(`${command} and ${spokenPhrase} are ${similarityRatio * 100}% similar`),
      // If the spokenPhrase is "Benji", the message would be "Beijing and Benji are 40% similar"
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2
    },
    {
      command: ['eat', 'sleep', 'leave'],
      callback: (command) => setMessage(`Best matching command: ${command}`),
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2,
      bestMatchOnly: true
    },
    {
      command: 'clear',
      callback: ({ resetTranscript }) => resetTranscript()
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

## Continuous listening

By default, the microphone will stop listening when the user stops speaking. This reflects the approach taken by "press to talk" buttons on modern devices.

If you want to listen continuously, set the `continuous` property to `true` when calling `startListening`. The microphone will continue to listen, even after the user has stopped speaking.

```
SpeechRecognition.startListening({ continuous: true })
```

## Changing language

To listen for a specific language, you can pass a language tag (e.g. `'zh-CN'` for Chinese) when calling `startListening`. See [here](docs/API.md#language-string) for a list of supported languages.

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

## API docs

View the API docs [here](docs/API.md) or follow the guide above to learn how to use `react-speech-recognition`.

## License

MIT
