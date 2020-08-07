# Migrating from v2 to v3

v3 makes use of React hooks to simplify the consumption of `react-speech-recognition`:

* Replacing the higher order component with a React hook

* Introducing commands, functions that get executed when the user says a particular phrase

* A clear separation between all parts of `react-speech-recognition` that are global (e.g. whether the microphone is listening or not) and local (e.g. transcripts). This makes it possible to have multiple components consuming the global microphone input while maintaining their own transcripts and commands

* Some default prop values have changed so check those out below

## The original Dictaphone example

### In v2

```js
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

### In v3

```js
import React, { useEffect } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

const Dictaphone = () => {
  const { transcript, resetTranscript } = useSpeechRecognition()

  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true })
  }, []);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  return (
    <div>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  )
}
export default Dictaphone
```

## autoStart

This was a global option in v2 that would cause the microphone to start listening from the beginning by default. In v3, the microphone is initially turned off by default. It can be turned on when your component first renders by either `useEffect` if you're using hooks or `componentDidMount` if you're still using class components. It is recommended that you do this close to the root of your application as this affects global state.

```js
useEffect(() => {
  SpeechRecognition.startListening({ continuous: true })
}, []);
```

## continuous

This was another global option in v2 that would by default have the microphone permanently listen to the user, even when they finished speaking. This default behaviour did not match the most common usage pattern, which is to use `react-speech-recognition` for "press to talk" buttons that stop listening once a command has been spoken.

`continuous` is now an option that can be passed to `SpeechRecognition.startListening`. It is `false` by default, but can be overridden like so:

```js
SpeechRecognition.startListening({ continuous: true })
```

## clearTranscriptOnListen

This is a new prop in v3 that is passed into `useSpeechRecognition` from the consumer. Its default value makes a subtle change to the previous behaviour. When `continuous` was set to `false` in v2, the transcript would not be reset when the microphone started listening again. `clearTranscriptOnListen` changes that, clearing the component's transcript at the beginning of every new discontinuous speech. To replicate the old behaviour, this can be turned off when passing props into `useSpeechRecognition`:

```js
const { transcript } = useSpeechRecognition({ clearTranscriptOnListen: false })
```

## Injected props

`SpeechRecognition` used to inject props into components in v2. These props are still available, but in different forms.

### transcript

This is now state returned by `useSpeechRecognition`. This transcript is local to the component using the hook.

### resetTranscript

This is now state returned by `useSpeechRecognition`. This only resets the component's transcript, not any global state.

### startListening

This is now available as `SpeechRecognition.startListening`, an asynchronous function documented [here](API.md#startListening-async).

### stopListening

This is now available as `SpeechRecognition.stopListening`, documented [here](API.md#stopListening).

### abortListening

This is now available as `SpeechRecognition.abortListening`, documented [here](API.md#abortListening).

### browserSupportsSpeechRecognition

This is now available as the function `SpeechRecognition.browserSupportsSpeechRecognition`, documented [here](API.md#browserSupportsSpeechRecognition).

### listening

This is now state returned by `useSpeechRecognition`. This is the global listening state.

### interimTranscript

This is now state returned by `useSpeechRecognition`. This transcript is local to the component using the hook.

### finalTranscript

This is now state returned by `useSpeechRecognition`. This transcript is local to the component using the hook.

### recognition

This is now returned by the function `SpeechRecognition.getRecognition`, documented [here](API.md#getRecognition).
