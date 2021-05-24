# Polyfills

If you want `react-speech-recognition` to work on more browsers than just Chrome, you can integrate a polyfill. This is a piece of code that fills in some missing feature in browsers that don't support it.

Under the hood, Web Speech API in Chrome uses Google's speech recognition servers. To replicate this functionality elsewhere, you will need to host your own speech recognition service and implement the Web Speech API using that service. That implementation, which is essentially a polyfill, can then be plugged into `react-speech-recognition`. You can write that polyfill yourself, but it's recommended you use one someone else has already made.

# Basic usage

The `SpeechRecognition` class exported by `react-speech-recognition` has the method `applyPolyfill`. This can take an implementation of the [W3C SpeechRecognition specification](https://wicg.github.io/speech-api/#speechreco-section). From then on, that implementation will used by `react-speech-recognition` to transcribe speech picked up by the microphone.

```
SpeechRecognition.applyPolyfill(SpeechRecognitionPolyfill)
```

Note that this type of polyfill that does not pollute the global scope is known as a "ponyfill" - the distinction is explained [here](https://ponyfoo.com/articles/polyfills-or-ponyfills). `react-speech-recognition` will also pick up traditional polyfills - just make sure you import them before `react-speech-recognition`.

## Usage recommendations
* Call this as early as possible to minimise periods where fallback content, which you should render while the polyfill is loading, is rendered
* Use your own `loadingSpeechRecognition` state rather than `browserSupportsSpeechRecognition` to decide when to render fallback content when Speech Recognition is not available. This is because on Chrome, `browserSupportsSpeechRecognition` will return `true` - as a result, your speech recognition component will appear briefly with the Google Speech Recognition engine and then with the polyfill engine, potentially causing a janky user experience. Some example code using the loading state approach can be found below
* After `applyPolyfill` has been called, `browserSupportsSpeechRecognition` will always be `true`. The polyfill itself may not work on all browsers - it's worth having a further fallback to cover that case. Polyfills will usually require WebRTC support in the browser, so it's worth checking that `window.navigator.mediaDevices.getUserMedia` is present
* Do not rely on polyfills being perfect implementations of the Speech Recognition specification - make sure you have tested them in different browsers and are aware of their individual limitations

# Polyfill libraries

Rather than roll your own, you should use a ready-made polyfill for a cloud provider's speech recognition service. `react-speech-recognition` currently supports polyfills for the following cloud providers:

## Speechly

<a href="https://www.speechly.com/?utm_source=github">
  <img src="logos/speechly.png" width="200" alt="Speechly">
</a>

[Speechly](https://www.speechly.com/) specialises in enabling developers to create voice-driven UIs and provides a speech recognition API with a generous free tier to get you started. Their web speech recognition polyfill was developed with `react-speech-recognition` in mind so is a great choice to combine with this library. You can see an example of the two libraries working together in its [README](https://github.com/speechly/speech-recognition-polyfill#integrating-with-react-speech-recognition).

* Polyfill repo: [speech-recognition-polyfill](https://github.com/speechly/speech-recognition-polyfill)
* Polyfill author: [speechly](https://github.com/speechly)
* Requirements: 
  * Install `@speechly/speech-recognition-polyfill` in your web app
  * You will need a Speechly app ID. To get one of these, sign up with Speechly and follow [the guide here](https://docs.speechly.com/quick-start/). Note that you can skip the steps for creating a Speechly configuration

Here is a basic example combining `speech-recognition-polyfill` and `react-speech-recognition` to get you started. This code worked with version 1.0.0 of the polyfill in May 2021 - if it has become outdated due to changes in the polyfill or in Speechly, please raise a GitHub issue or PR to get this updated.

```
import React, { useState } from 'react';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const appId = '<INSERT_SPEECHLY_APP_ID_HERE>';
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

const Dictaphone = () => {
  const { transcript, listening } = useSpeechRecognition();
  const startListening = () => SpeechRecognition.startListening({ continuous: true });

  return (
    <div>
      <p>Microphone: {listening ? 'on' : 'off'}</p>x
      <div
        onTouchStart={startListening}
        onMouseDown={startListening}
        onTouchEnd={SpeechRecognition.stopListening}
        onMouseUp={SpeechRecognition.stopListening}
      >Hold to talk</div>
      <p>{transcript}</p>
    </div>
  );
};
export default Dictaphone;
```

### Limitations
* The `lang` property is currently unsupported, defaulting to English transcription. In `react-speech-recognition`, this means that the `language` property in `startListening` cannot be used to change languages when using this polyfill. New languages will be coming soon!
* Transcripts are generated in uppercase letters without punctuation. If needed, you can transform them using [toLowerCase()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase)

<br />
<br />

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

Here is a basic example combining `web-speech-cognitive-services` and `react-speech-recognition` to get you started. This code worked with version 7.1.0 of the polyfill in February 2021 - if it has become outdated due to changes in the polyfill or in Azure Cognitive Services, please raise a GitHub issue or PR to get this updated.

```
import React, { useEffect, useState } from 'react';
import createSpeechServicesPonyfill from 'web-speech-cognitive-services';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SUBSCRIPTION_KEY = '<INSERT_SUBSCRIPTION_KEY_HERE>';
const REGION = '<INSERT_REGION_HERE>';
const TOKEN_ENDPOINT = `https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;

const Dictaphone = () => {
  const [loadingSpeechRecognition, setLoadingSpeechRecognition] = useState(true);
  const { transcript, resetTranscript } = useSpeechRecognition();

  const startListening = () => SpeechRecognition.startListening({
    continuous: true,
    language: 'en-US'
  });

  useEffect(() => {
    const loadSpeechRecognition = async () => {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY }
      });
      const authorizationToken = await response.text();
      const {
        SpeechRecognition: AzureSpeechRecognition
      } = await createSpeechServicesPonyfill({
        credentials: {
          region: REGION,
          authorizationToken,
        }
      });
      SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
      setLoadingSpeechRecognition(false);
    }
    loadSpeechRecognition();
  }, []);

  if (loadingSpeechRecognition) {
    return null;
  }

  return (
    <div>
      <button onClick={startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  );
};
export default Dictaphone;
```

### Limitations
* On Safari and Firefox, an error will be thrown if calling `startListening` to switch to a different language without first calling `stopListening`. It's recommended that you stick to one language and, if you do need to change languages, call `stopListening` first
* If you don't specify a language, Azure will return a 400 response. When calling `startListening`, you will need to explicitly provide one of the language codes defined [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support). For English, use `en-GB` or `en-US`
* Safari will throw an error on `localhost` as it requires HTTPS. [ngrok](https://ngrok.com/) is a nice tool for serving a local web app over HTTPS (also good for testing your web app on mobile devices as well)
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
* `start` (method)
* `stop` (method)
* `abort` (method)

