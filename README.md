# react-speech-recognition
A React component that converts speech from the microphone to text.

## How it works
`SpeechRecognition` is a higher order component that wraps one of your React components.
In doing so, it injects some additional properties into the component that allow it
to access a transcript of speech picked up from the user's microphone.

Under the hood,
it uses [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
Currently, **this component will only work in Chrome**. It fails gracefully on other browsers.

You will need a dependency manager like Browserify or Webpack to bundle this module
with your web code.


## Installation

To install:

`npm install --save react-speech-recognition`

To import in your React code:

`import SpeechRecognition from 'react-speech-recognition'`

## Example usage

As only one component can be wrapped by `SpeechRecognition`, it is recommended that you add it to one of your root React components such as `App`. The transcription can then be passed down to child components.

```
import React, { PropTypes, Component } from 'react'
import SpeechRecognition from 'react-speech-recognition'

const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
}

class Dictaphone extends Component {
  render() {
    const { transcript, resetTranscript, browserSupportsSpeechRecognition } = this.props

    if (!browserSupportsSpeechRecognition) {
      return null
    }

    return (
      <div>
        <button onClick={resetTranscript}>Reset</button>
        <span>{transcript}</span>
      </div>
    )
  }
}

Dictaphone.propTypes = propTypes

export default SpeechRecognition(Dictaphone)
```

If you are writing ES7 code, you can add the `@SpeechRecognition` decorator
to your component's class. To use the decorator syntax, add the
[decorator plugin](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy) to Babel.

## Global options

You can configure the default initial state of the Speech Recognition API. To change these defaults, you need to pass an options object into the wrapper like so:

```
const options = {
  autoStart: false
}

export default SpeechRecognition(options)(YourComponent)
```

or in ES7:

`@SpeechRecognition(options)`

### autoStart [bool]

By default, the Speech Recognition API is listening to speech from the microphone. To have the API turned off by default, set this to `false`.

## Props added to your component

### transcript [string]

Transcription of all speech that has been spoken into the microphone. Is equivalent to the final transcript followed by the interim transcript, separated by a space.

### resetTranscript [function]

Sets the transcription to an empty string.

### startListening [function]

Causes the Web Speech API to start listening to speech from the microphone.

### stopListening [function]

Causes the Web Speech API to stop listening to speech from the microphone, but will finish processing any remaining speech.

### abortListening [function]

Causes the Web Speech API to stop listening to speech from the microphone, and also stop processing the current speech. Initially, the Web Speech API is turned on, so you may want to call this in `componentWillMount` if you don't want speech to be collected when your component is first mounted.

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

## License

MIT
