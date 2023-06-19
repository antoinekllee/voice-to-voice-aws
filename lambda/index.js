const AWS = require('aws-sdk');

const s3 = new AWS.S3(); 
const translate = new AWS.Translate(); // translates to desired language
const polly = new AWS.Polly(); // ai voice output

exports.handler = async (event) => {
    if (event.request.type === 'LaunchRequest') 
    {
        console.log ("Launch");
        // Return a response to indicate that the LaunchRequest is working
        return {
            version: '1.0',
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: '...',
                },
                shouldEndSession: false,
            },
        };
    } 
    else if (event.request.type === 'IntentRequest') 
    {
        if (event.request.intent.name === 'CapturePhraseIntent') 
        {    
            let phrase = event.request.intent.slots.phrase.value; // Extract the phrase from the slots
            
            // Retrieve the language from the session attributes
            // let language = (event.session.attributes && event.session.attributes['language']) || 'chinese';
            let language = 'zh';

            let translatedText = await translateText(phrase, language);

            console.log ("TRANSLATED TEXT: " + translatedText)
            console.log (translatedText)

            let speech = await textToSpeech(translatedText, language);

            console.log ("Speech: " + speech)
            
            // Return a response to Alexa
            return {
                version: '1.0',
                response: {
                    outputSpeech: {
                        type: 'SSML',
                        ssml: `<speak><audio src="${speech}" /></speak>`,
                    },
                    shouldEndSession: false,
                },
            };

        }

        else if (event.request.intent.name === 'CaptureLanguageIntent') 
        {
            console.log ("Capture language intent"); 

            // TODO
            
            // // Extract the language from the slots
            // let language = event.request.intent.slots.language.value;
        
            // // Store the language in the session attributes
            // let sessionAttributes = event.session.attributes;
            // sessionAttributes['language'] = language;
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
    'en': 'Joanna',
    'zh': 'Zhiyu',
    'hi': 'Kajal'
};

async function textToSpeech(text, language) {
    let params = {
        OutputFormat: 'mp3',
        Text: text,
        VoiceId: languageToVoiceId[language]
    };

    let speech = await polly.synthesizeSpeech(params).promise();
    // return speech.AudioStream.toString('base64');

    // Convert the base64-encoded audio to a Buffer
    let audioBuffer = Buffer.from(speech.AudioStream, 'base64');
    
    // Define S3 upload parameters
    let timestamp = new Date().getTime();
    let s3Params = {
        Bucket: 'alexa-polly-translations',
        Key: `translation_${timestamp}.mp3`, 
        Body: audioBuffer,
        // ACL: 'public-read' 
    };
    
    // Upload audio to S3
    let uploadResult = await s3.upload(s3Params).promise();
    return uploadResult.Location;
}