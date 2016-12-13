import React, { Component, PropTypes as PT } from 'react'
import { debounce } from 'core-decorators'

export default class Dictation extends Component {
  static propTypes = {
    className: PT.string,
    onChange: PT.func,
    visible: PT.bool,
    listening: PT.bool,
    showInterimResults: PT.bool,
    showFinalResults: PT.bool,
    entities: PT.arrayOf(PT.string),
    onHearEntity: PT.func,
    name: PT.string
  };

  static defaultProps = {
    visible: true,
    listening: true,
    showInterimResults: true,
    showFinalResults: true
  };

  constructor(props) {
    super(props)

    this.state = {
      interimTranscript: '',
      finalTranscript: '',
      browserSupportsSpeechRecognition: true,
      recognition: null
    }
  }

  componentWillMount() {
    const root = typeof window !== 'undefined' ? window : this
    const SpeechRecognition = root.SpeechRecognition ||
                              root.webkitSpeechRecognition ||
                              root.mozSpeechRecognition ||
                              root.msSpeechRecognition ||
                              root.oSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-UK'
      recognition.onresult = this.updateTranscript.bind(this)
      recognition.onend = this.restartRecognition.bind(this)
      if (this.props.listening) {
        recognition.start()
      }
      this.setState({ recognition })
    } else {
      this.setState({ browserSupportsSpeechRecognition: false })
    }
  }

  componentWillUnmount() {
    if (this.state.recognition) {
      this.state.recognition.abort()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.recognition) {
      if (this.props.listening && !nextProps.listening) {
        this.state.recognition.stop()
      } else if (!this.props.listening && nextProps.listening) {
        this.state.recognition.start()
      }

      /* Changing the name prop is the equivalent of resetting the component.
        Preferably, this would be done by changing the key prop, but
        re-rendering the component seems to break the speech recognition. */
      if (this.props.name !== nextProps.name) {
        this.setState({ interimTranscript: '', finalTranscript: '' })
        this.state.recognition.abort()
      }
    }
  }

  updateTranscript(event) {
    const { onChange } = this.props
    const { finalTranscript, interimTranscript } = this.getNewTranscript(event)

    this.handleSpokenEntity(interimTranscript)

    const transcriptBefore = this.concatTranscripts(this.state.finalTranscript, this.state.interimTranscript)
    const transcriptAfter = this.concatTranscripts(finalTranscript, interimTranscript)

    if (onChange && transcriptBefore !== transcriptAfter) {
      onChange(transcriptAfter)
    }

    this.setState({ finalTranscript, interimTranscript })
  }

  @debounce(1000)
  restartRecognition() {
    const { listening } = this.props
    const { recognition } = this.state

    if (listening) {
      recognition.start()
    }
  }

  getNewTranscript(event) {
    let finalTranscript = this.state.finalTranscript
    let interimTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript = this.concatTranscripts(finalTranscript, event.results[i][0].transcript)
      } else {
        interimTranscript = this.concatTranscripts(interimTranscript, event.results[i][0].transcript)
      }
    }
    return { finalTranscript, interimTranscript }
  }

  concatTranscripts(...transcriptParts) {
    return transcriptParts.map(t => t.trim()).join(' ').trim()
  }

  handleSpokenEntity(interimTranscript) {
    const { entities, onHearEntity } = this.props

    if (entities && onHearEntity && interimTranscript !== this.state.interimTranscript) {
      const mostRecentlySpokenEntity = this.findEntity(entities, interimTranscript)
      if (mostRecentlySpokenEntity) {
        onHearEntity(mostRecentlySpokenEntity)
      }
    }
  }

  findEntity(entities, transcript) {
    const words = transcript.toLowerCase().split(' ')
    const normalisedEntities = entities.map(e => e.toLowerCase())
    for (let i = 0; i < normalisedEntities.length; ++i) {
      if (words[words.length - 1] === normalisedEntities[i]) {
        return normalisedEntities[i]
      }
    }
    return null
  }

  render() {
    const { className, visible, showInterimResults, showFinalResults } = this.props
    const { interimTranscript, finalTranscript, browserSupportsSpeechRecognition } = this.state

    if (!visible) {
      return null
    }

    if (!browserSupportsSpeechRecognition) {
      return (
        <div>
          Browser does not support speech recognition.
        </div>
      )
    }

    const transcriptParts = []
    if (showFinalResults) {
      transcriptParts.push(finalTranscript)
    }
    if (showInterimResults) {
      transcriptParts.push(interimTranscript)
    }

    return (
      <div className={className}>
        {transcriptParts.join(' ')}
      </div>
    )
  }
}
