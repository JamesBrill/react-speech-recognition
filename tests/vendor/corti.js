//! Corti - Replaces the browser's SpeechRecognition with a fake object.
//! version : 0.4.0
//! author  : Tal Ater @TalAter
//! license : MIT
//! https://github.com/TalAter/Corti

const Corti = (_root) => {
  // Holds the browser's implementation
  var _productionVersion = false

  // Patch DOMException
  // eslint-disable-next-line no-use-before-define
  var DOMException = DOMException || TypeError

  // Speech Recognition attributes
  var _maxAlternatives = 1
  var _lang = ''
  var _continuous = false
  var _interimResults = false

  var newSpeechRecognition = function() {
    var _self = this
    var _listeners = document.createElement('div')
    _self._started = false
    _self._soundStarted = false
    _self.eventListenerTypes = ['start', 'soundstart', 'end', 'result']
    _self.maxAlternatives = 1

    // Add listeners for events registered through attributes (e.g. recognition.onend = function) and not as proper listeners
    _self.eventListenerTypes.forEach(function(eventName) {
      _listeners.addEventListener(eventName, function () {
        if (typeof _self['on' + eventName] === 'function') {
          _self['on' + eventName].apply(_listeners, arguments)
        }
      }, false)
    })

    Object.defineProperty(this, 'maxAlternatives', {
      get: function() { return _maxAlternatives },
      set: function(val) {
        if (typeof val === 'number') {
          _maxAlternatives = Math.floor(val)
        } else {
          _maxAlternatives = 0
        }
      }
    })

    Object.defineProperty(this, 'lang', {
      get: function() { return _lang },
      set: function(val) {
        if (val === undefined) {
          val = 'undefined'
        }
        _lang = val.toString()
      }
    })

    Object.defineProperty(this, 'continuous', {
      get: function() { return _continuous },
      set: function(val) {
        _continuous = Boolean(val)
      }
    })

    Object.defineProperty(this, 'interimResults', {
      get: function() { return _interimResults },
      set: function(val) {
        _interimResults = Boolean(val)
      }
    })

    this.start = function() {
      if (_self._started) {
        throw new DOMException('Failed to execute \'start\' on \'SpeechRecognition\': recognition has already started.')
      }
      _self._started = true
      // Create and dispatch an event
      var event = document.createEvent('CustomEvent')
      event.initCustomEvent('start', false, false, null)
      _listeners.dispatchEvent(event)
    }

    this.abort = function() {
      if (!_self._started) {
        return
      }
      _self._started = false
      _self._soundStarted = false
      // Create and dispatch an event
      var event = document.createEvent('CustomEvent')
      event.initCustomEvent('end', false, false, null)
      _listeners.dispatchEvent(event)
    }

    this.stop = function() {
      return _self.abort()
    }

    this.isStarted = function() {
      return _self._started
    }

    this.emitStartEvent = function(text, isFinal, itemFunction, isAndroid) {
      var startEvent = document.createEvent('CustomEvent')
      startEvent.initCustomEvent('result', false, false, { sentence: text })
      startEvent.resultIndex = 0
      startEvent.results = {
        item: itemFunction,
        0: {
          item: itemFunction,
          isFinal: isFinal || isAndroid
        }
      }
      startEvent.results[0][0] = {
        transcript: text,
        confidence: isAndroid && !isFinal ? 0 : 1
      }
      Object.defineProperty(startEvent.results, 'length', {
        get: function() { return 1 }
      })
      Object.defineProperty(startEvent.results[0], 'length', {
        get: function() { return _maxAlternatives }
      })
      startEvent.interpretation = null
      startEvent.emma = null
      _listeners.dispatchEvent(startEvent)

      // Create soundstart event
      if (!_self._soundStarted) {
        _self._soundStarted = true
        var soundStartEvent = document.createEvent('CustomEvent')
        soundStartEvent.initCustomEvent('soundstart', false, false, null)
        _listeners.dispatchEvent(soundStartEvent)
      }
    }

    this.say = function(sentence, {
      onlyFirstResult = false,
      isAndroid = false
    } = {}) {
      if (!_self._started) {
        return
      }

      var itemFunction = function(index) {
        if (undefined === index) {
          throw new DOMException('Failed to execute \'item\' on \'SpeechRecognitionResult\': 1 argument required, but only 0 present.')
        }
        index = Number(index)
        if (isNaN(index)) {
          index = 0
        }
        if (index >= this.length) {
          return null
        } else {
          return this[index]
        }
      }

      const words = sentence.split(' ')
      if (onlyFirstResult) {
        this.emitStartEvent(words[0], false, itemFunction)
      } else {
        let text = ''
        words.forEach(word => {
          text = [text, word].join(' ')
          this.emitStartEvent(text, false, itemFunction, isAndroid)
        })
        this.emitStartEvent(sentence, true, itemFunction)
        if (isAndroid) {
          this.emitStartEvent(sentence, true, itemFunction)
        }
      }

      // stop if not set to continuous mode
      if (!_self.continuous) {
        _self.abort()
      }
    }

    this.addEventListener = function(event, callback) {
      _listeners.addEventListener(event, callback, false)
    }
  }

  // Expose functionality
  return {
    patch: function() {
      if (_productionVersion === false) {
        _productionVersion = _root.SpeechRecognition ||
            _root.webkitSpeechRecognition ||
            _root.mozSpeechRecognition ||
            _root.msSpeechRecognition ||
            _root.oSpeechRecognition
      }
      _root.SpeechRecognition = newSpeechRecognition
    },

    unpatch: function() {
      _root.SpeechRecognition = _productionVersion
    }
  }
}

const mockSpeechRecognition = Corti(global)
mockSpeechRecognition.patch()
export default mockSpeechRecognition
