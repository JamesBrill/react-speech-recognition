# Polyfills

If you want `react-speech-recognition` to work on more browsers than just Chrome, you can integrate a polyfill. This is a piece of code that fills in some missing feature in browsers that don't support it.

Under the hood, Web Speech API in Chrome uses Google's speech recognition servers. To replicate this functionality elsewhere, you will need to host your own speech recognition service and implement the Web Speech API using that service. That implementation, which is essentially a polyfill, can then be plugged into `react-speech-recognition`. You can write that polyfill yourself, but it's recommended you use one someone else has already made.

# Basic usage

The `SpeechRecognition` class exported by `react-speech-recognition` has the method `applyPolyfill`. This can take an implementation of the [W3C SpeechRecognition specification](https://wicg.github.io/speech-api/#speechreco-section). From then on, that implementation will used by `react-speech-recognition` to transcribe speech picked up by the microphone.

```js
SpeechRecognition.applyPolyfill(SpeechRecognitionPolyfill)
```

Note that this type of polyfill that does not pollute the global scope is known as a "ponyfill" - the distinction is explained [here](https://ponyfoo.com/articles/polyfills-or-ponyfills). `react-speech-recognition` will also pick up traditional polyfills - just make sure you import them before `react-speech-recognition`.

Polyfills can be removed using `removePolyfill`. This can be useful when the user switches to a language that is supported by the native Speech Recognition engine but not the polyfill engine.

```js
SpeechRecognition.removePolyfill()
```

## Usage recommendations
* Call this as early as possible to minimise periods where fallback content, which you should render while the polyfill is loading, is rendered. Also note that if there is a Speech Recognition implementation already listening to the microphone, this will be turned off when the polyfill is applied, so make sure the polyfill is applied before rendering any buttons to start listening
* After `applyPolyfill` has been called, `browserSupportsSpeechRecognition` will be `true` on _most_ browsers, but there are still exceptions. Browsers like Internet Explorer do not support the APIs needed for polyfills - in these cases where `browserSupportsSpeechRecognition` is `false`, you should still have some suitable fallback content
* Do not rely on polyfills being perfect implementations of the Speech Recognition specification - make sure you have tested them in different browsers and are aware of their individual limitations

# Polyfill libraries

Rather than roll your own, you should use a ready-made polyfill for a cloud provider's speech recognition service. `react-speech-recognition` currently supports polyfills for the following cloud providers:

## Microsoft Azure Cognitive Services

<a href="https://azure.microsoft.com/en-gb/services/cognitive-services/speech-to-text/">
  <img src="logos/microsoft.png" width="175" alt="Microsoft Azure Cognitive Services">
</a>

This is Microsoft's offering for speech recognition (among many other features). The free trial gives you $200 of credit to get started. It's pretty easy to set up - see the [documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/).

* Polyfill repo: [web-speech-cognitive-services](https://github.com/compulim/web-speech-cognitive-services)
* Polyfill author: [compulim](https://github.com/compulim)
* Requirements:
  * Install `web-speech-cognitive-services` and `microsoft-cognitiveservices-speech-sdk` in your web app for this polyfill to function
  * You will need two things to configure this polyfill: the name of the Azure region your Speech Service is deployed in, plus a subscription key (or better still, an authorization token). [This doc](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/overview#find-keys-and-region) explains how to find those

Here is a basic example combining `web-speech-cognitive-services` and `react-speech-recognition` to get you started (do not use this in production; for a production-friendly version, read on below). This code worked with version 7.1.0 of the polyfill in February 2021 - if it has become outdated due to changes in the polyfill or in Azure Cognitive Services, please raise a GitHub issue or PR to get this updated.

```jsx
import React from 'react';
import createSpeechServicesPonyfill from 'web-speech-cognitive-services';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SUBSCRIPTION_KEY = '<INSERT_SUBSCRIPTION_KEY_HERE>';
const REGION = '<INSERT_REGION_HERE>';

const { SpeechRecognition: AzureSpeechRecognition } = createSpeechServicesPonyfill({
  credentials: {
    region: REGION,
    subscriptionKey: SUBSCRIPTION_KEY,
  }
});
SpeechRecognition.applyPolyfill(AzureSpeechRecognition);

const Dictaphone = () => {
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const startListening = () => SpeechRecognition.startListening({
    continuous: true,
    language: 'en-US'
  });

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <div>
      <button onClick={startListening}>Start</button>
      <button onClick={SpeechRecognition.abortListening}>Abort</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  );
};
export default Dictaphone;
```

### Usage in production

Your subscription key is a secret that you should not be leaking to your users in production. In other words, it should never be downloaded to your users' browsers. A more secure approach that's recommended by Microsoft is to exchange your subscription key for an authorization token, which has a limited lifetime. You should get this token on your backend and pass this to your frontend React app. Microsoft give guidance on how to do this [here](https://docs.microsoft.com/en-us/azure/cognitive-services/authentication?tabs=powershell).

Once your React app has the authorization token, it should be passed into the polyfill creator instead of the subscription key like this:
```js
const { SpeechRecognition: AzureSpeechRecognition } = createSpeechServicesPonyfill({
  credentials: {
    region: REGION,
    authorizationToken: AUTHORIZATION_TOKEN,
  }
});
```

### Limitations
* There is currently a [bug](https://github.com/compulim/web-speech-cognitive-services/issues/166) in this polyfill's `stop` method when using continuous listening. If you are using `continuous: true`, use `abortListening` to stop the transcription. Otherwise, you can use `stopListening`.
* On Safari and Firefox, an error will be thrown if calling `startListening` to switch to a different language without first calling `stopListening`. It's recommended that you stick to one language and, if you do need to change languages, call `stopListening` first
* If you don't specify a language, Azure will return a 400 response. When calling `startListening`, you will need to explicitly provide one of the language codes defined [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support). For English, use `en-GB` or `en-US`
* Currently untested on iOS (let me know if it works!)

<br />
<br />

## AWS Transcribe

There is no polyfill for [AWS Transcribe](https://aws.amazon.com/transcribe/) in the ecosystem yet, though a promising project can be found [here](https://github.com/ceuk/speech-recognition-aws-polyfill).

# Providing your own polyfill

If you want to roll your own implementation of the Speech Recognition API, follow the [W3C SpeechRecognition specification](https://wicg.github.io/speech-api/#speechreco-section). You should implement at least the following for `react-speech-recognition` to work:
* `continuous` (property)
* `lang` (property)
* `interimResults` (property)
* `onresult` (property). On the events received, the following properties are used:
  * `event.resultIndex`
  * `event.results[i].isFinal`
  * `event.results[i][0].transcript`
  * `event.results[i][0].confidence`
* `onend` (property)
* `onerror` (property)
* `start` (method)
* `stop` (method)
* `abort` (method)

