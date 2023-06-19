const AWS = require('aws-sdk');

const translate = new AWS.Translate(); // translates to desired language
const polly = new AWS.Polly(); // ai voice output

exports.handler = async (event) => {
    if (event.request.type === 'LaunchRequest') {
        // Handle LaunchRequest
        console.log ("Handle launch request");

        // Return a response to indicate that the LaunchRequest is working
        return {
            version: '1.0',
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'It\'s working!',
                },
                shouldEndSession: false,
            },
        };
    } else if (event.request.type === 'IntentRequest') {
        // Handle intents
        if (event.request.intent.name === 'CapturePhraseIntent') {
            console.log ("Capture phrase intent");
            
            // Extract the phrase from the slots
            let phrase = event.request.intent.slots.phrase.value;
            
            // Retrieve the language from the session attributes
            // TODO: may never retrieve language as CapturePhraseIntent is before CaptureLanguageIntent
            let language = (event.session.attributes && event.session.attributes['language']) || 'chinese';
            
            // Translate the phrase to the desired language
            let translatedText = await translateText(phrase, language);
            
            // Convert the translated text to speech
            let speech = await textToSpeech(translatedText, language);
            
            // Return a response to Alexa
            return {
                version: '1.0',
                response: {
                    outputSpeech: {
                        type: 'SSML',
                        ssml: `<speak>${speech}</speak>`,
                    },
                    shouldEndSession: false,
                },
            };
        }

        else if (event.request.intent.name === 'CaptureLanguageIntent') {
            console.log ("Capture language intent"); 
            
            // Extract the language from the slots
            let language = event.request.intent.slots.language.value;
        
            // Store the language in the session attributes
            let sessionAttributes = event.session.attributes;
            sessionAttributes['language'] = language;
        }
    }
};

async function translateText(text, targetLanguage) {
    let params = {
        Text: text,
        SourceLanguageCode: 'auto',
        TargetLanguageCode: targetLanguage,
    };

    let translation = await translate.translateText(params).promise();
    return translation.TranslatedText;
}

const languageToVoiceId = {
    'English': 'Joanna',
    'Chinese': 'Zhiyu',
    'Spanish': 'Lupe',
    'Hindi': 'Kajal'
};

async function textToSpeech(text, language) {
    let params = {
        OutputFormat: 'mp3',
        Text: text,
        VoiceId: languageToVoiceId[language],
        TextType: 'text',
    };

    let speech = await polly.synthesizeSpeech(params).promise();
    return speech.AudioStream.toString('base64');
}
