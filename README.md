# react-speech-recognition
A React component that converts speech from the microphone to text.

[![npm version](https://img.shields.io/npm/v/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![npm downloads](https://img.shields.io/npm/dm/react-speech-recognition.svg)](https://www.npmjs.com/package/react-speech-recognition)
[![license](https://img.shields.io/github/license/JamesBrill/react-speech-recognition.svg)](https://opensource.org/licenses/MIT)


## How it works
`SpeechRecognition` is a higher order component that wraps one of your React components.
In doing so, it injects some additional properties into the component that allow it
to access a transcript of speech picked up from the user's microphone.

Under the hood,
it uses [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
Currently, **this component will only work in Chrome**. It fails gracefully on other browsers.

It is recommended that you use Webpack to bundle this module with your web code.


## Installation

To install:

`npm install --save react-speech-recognition`

To import in your React code:

`import SpeechRecognition from 'react-speech-recognition'`

## Example usage

As only one component can be wrapped by `SpeechRecognition`, it is recommended that you add it to one of your root React components such as `App`. The transcription can then be passed down to child components.

```
import React, { Component } from "react";
import PropTypes from "prop-types";
import SpeechRecognition from "react-speech-recognition";

const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
};

const Dictaphone = ({
  transcript,
  resetTranscript,
  browserSupportsSpeechRecognition
}) => {
  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <div>
      <button onClick={resetTranscript}>Reset</button>
      <span>{transcript}</span>
    </div>
  );
};

Dictaphone.propTypes = propTypes;

export default SpeechRecognition(Dictaphone);
```

## Global options

You can configure the default initial state of the Speech Recognition API. To change these defaults, you need to pass an options object into the wrapper like so:

```
const options = {
  autoStart: false
}

export default SpeechRecognition(options)(YourComponent)
```

### autoStart [bool]

By default, the Speech Recognition API will immediately start listening to speech from the microphone. To have the API initially turned off, set this to `false`.

### continuous [bool]

By default, the Speech Recognition API is continuously listening to speech from the microphone when it is turned on. To have the API stop listening after the user has finished speaking, set this to `false`. For example, if you are building a chat app that only starts listening to the user's speech after a button click, you should set both `continuous` and `autoStart` options to `false`. Call [startListening](https://github.com/JamesBrill/react-speech-recognition#startListening-function) to make the API start listening again.

## Props added to your component

### transcript [string]

Transcription of all speech that has been spoken into the microphone. Is equivalent to the final transcript followed by the interim transcript, separated by a space.

### resetTranscript [function]

Sets the transcription to an empty string.

### startListening [function]

Causes the Web Speech API to start listening to speech from the microphone.

NOTE: if the `continuous` option is set to `false`, then `startListening` will reset the `transcript` prop.

### stopListening [function]

Causes the Web Speech API to stop listening to speech from the microphone, but will finish processing any remaining speech.

### abortListening [function]

Causes the Web Speech API to stop listening to speech from the microphone, and also stop processing the current speech.

### browserSupportsSpeechRecognition [bool]

If false, the browser does not support the Speech Recognition API.

### listening [bool]

If true, the Web Speech API is listening to speech from the microphone.

### interimTranscript [string]

Transcription of speech for which transcription hasn't finished yet.

For the current words being spoken, the interim transcript reflects each successive guess made by the transcription algorithm. When the browser’s confidence in its guess is maximized, it is added to the final transcript.

The difference between interim and final transcripts can be illustrated by an example over four iterations of the transcription algorithm:

| Final transcript | Interim transcript |
|-------------------|--------------------|
| 'Hello, I am' | 'jam' |
| 'Hello, I am' | 'jams' |
| 'Hello, I am' | 'James' |
| 'Hello, I am James' | '' |

### finalTranscript [string]

Transcription of speech for which transcription has finished.

### recognition [Object]

The underlying [object](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) used
by Web Speech API. It can be used to change the
transcription language, which is the browser language if not specified. For example, to set the transcription language to Chinese:

`recognition.lang = 'zh-CN'`

## Troubleshooting

### How to use `react-speech-recognition` offline?

Unfortunately, speech recognition will not function in Chrome when offline. According to the [Web Speech API docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API): `On Chrome, using Speech Recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline.`

If you are building an offline web app, you can detect when the browser is offline by inspecting the value of `navigator.onLine`. If it is `true`, you can render the transcript generated by React Speech Recognition. If it is `false`, it's advisable to render offline fallback content that signifies that speech recognition is disabled. The online/offline API is simple to use - you can read how to use it [here](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events).

### The transcript contains duplicate words!

There is a [bug in Android Chrome](https://stackoverflow.com/questions/35112561/speech-recognition-api-duplicated-phrases-on-android/43458449#43458449) that causes the Web Speech API to generate duplicate words in the speech recognition result. Possible workarounds:
- Set the `continuous` option to `false`
- [Detect Android Chrome](https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system) and render fallback content on that browser

## Developing

You can run an example React app that uses `react-speech-recognition` with:
```
npm i
npm run dev
```

On `http://localhost:3000`, you'll be able to speak into the microphone and see your speech as text on the web page. There are also controls for turning speech recognition on and off. You can make changes to the web app itself in the `example` directory. Any changes you make to the web app or `react-speech-recognition` itself will be live reloaded in the browser.

## License

MIT
