# react-speech-recognition
A React component that converts speech from the microphone to text.

## Installation

`npm install --save react-speech-recognition`

## Example

```
import React, { Component } from 'react'
import SpeechRecognition from 'react-speech-recognition'
import save from 'api'

export default class Notepad extends Component {
  constructor(props) {
    super(props)

    this.state = {
      transcript: ''
    }
  }

  handleHearEntity(entity, transcript) {
    if (entity === 'save') {
      save(transcript)
    }
  }

  render() {
    return (
      <div>
        <SpeechRecognition
          onChange={transcript => this.setState({ transcript })}
          entities={['save']}
          onHearEntity={entity => this.handleHearEntity(entity, this.state.transcript)} />
      </div>
    )
  }
}
```

## Props

### className [string]

CSS class name for the component styling.

### onChange [function]

Whenever the transcript changes, it's passed to this function.

### visible [bool]

If false, the component is not rendered. Defaults to true.

### listening [bool]

If false, speech is not transcribed. Defaults to true.

### language [string]

The language that is transcribed. Defaults to the browser language.

### showInterimResults [bool]

If true, interim results are included in the transcript. Defaults to true.

### showFinalResults [bool]

If true, final results are included in the transcript. Defaults to true.

### entities [array of strings]

Words or phrases that the component listens for in the transcript.

### onHearEntity [function]

When an entity appears in the transcript, this function is called with the entity that was heard.

### onLoad [function]

When the Speech Recognition API finishes loading, this function receives this object:

```javascript
{
  success: [bool]
}
```

The success flag is false if the browser doesn't support the Speech Recognition API or it failed to load.

### name [string]

Change this to reset the transcript.

## License

MIT
