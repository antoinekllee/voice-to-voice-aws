const AWS = require("aws-sdk");
const axios = require("axios");

const s3 = new AWS.S3();
const translate = new AWS.Translate();
const polly = new AWS.Polly();

const MAX_RETRY_ATTEMPTS = 3; 
const RETRY_DELAY_MS = 500; 

exports.handler = async (event) => {
    try {
        if (event.request.type === "LaunchRequest") {
            return handleLaunchRequest();
        } else if (event.request.type === "IntentRequest") {
            switch(event.request.intent.name) {
                case "CaptureLanguageIntent":
                    return await handleCaptureLanguageIntent(event);
                case "CapturePhraseIntent":
                    return await handleCapturePhraseIntent(event);
                case "AMAZON.FallbackIntent":
                    return handleFallbackIntent();
                default:
                    return handleUnrecognizedIntent();
            }
        }
    } catch (error) {
        console.error(error);
        return buildResponse("Please try again.");
    }
};

async function handleLaunchRequest() 
{
    let message = {
        type: "init",
        language: "english"
    };

    await sendToServerWithRetry(message);

    return buildResponse("Activated. Set a language.");
}

async function handleCaptureLanguageIntent(event) {
    let language = event.request.intent.slots.language.value || "english";
    language = language.toLowerCase();
    
    let languageData = languageInfo[language];

    if (languageData === undefined) {
        return buildResponse(`${language} is not supported`);
    } else {
        let sessionAttributes = event.session.attributes;
        sessionAttributes["language"] = language;
        
        let message = {
            type: "language",
            language: language || "english"
        };
        
        await sendToServerWithRetry(message);
        return buildResponse(`${language} set.`, sessionAttributes);
    }
}

async function handleCapturePhraseIntent(event) {
    let phrase = event.request.intent.slots.phrase.value;

    let sessionAttributes = event.session.attributes;
    let language = sessionAttributes && sessionAttributes["language"];
    
    let languageData = languageInfo[language];

    if (languageData === undefined) {
        languageData = languageInfo["english"];
    }

    let translatedText = await translateText(phrase, languageData.code);
    
    let message = {
        type: "translation",
        original: phrase,
        translated: translatedText,
        language: language || "english"
    };
    
    await sendToServerWithRetry(message);
    
    let speech = await textToSpeech(translatedText, languageData.voice);
    return buildResponseWithSSML(`<speak><audio src="${speech}" /></speak>`, sessionAttributes);
}

function handleFallbackIntent() {
    return buildResponse("Please try again.");
}

function handleUnrecognizedIntent() {
    return buildResponse("Please try again.");
}

async function sendToServerWithRetry(message, attempt = 0) {
    try {
        const serverUrl = process.env.SERVER_URL || "http://vocice-to-voice-server-env.eba-mf6mtamm.us-east-1.elasticbeanstalk.com";
        await axios.post(serverUrl + "/update", message); 
    } catch (error) {
        if (attempt < MAX_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            await sendToServerWithRetry(message, attempt + 1);
        } else {
            console.error(`Failed to send message to server after ${MAX_RETRY_ATTEMPTS} attempts`, error);
            throw error;
        }
    }
}

function buildResponse(speechText, sessionAttributes = {}) {
    return {
        version: "1.0",
        sessionAttributes,
        response: {
            outputSpeech: {
                type: "PlainText",
                text: speechText,
            },
            shouldEndSession: false,
        },
    };
}

function buildResponseWithSSML(ssmlText, sessionAttributes = {}) {
    return {
        version: "1.0",
        sessionAttributes,
        response: {
            outputSpeech: {
                type: "SSML",
                ssml: ssmlText,
            },
            shouldEndSession: false,
        },
    };
}

async function translateText(text, targetLanguage) {
    try {
        let params = {
            Text: text,
            SourceLanguageCode: "auto",
            TargetLanguageCode: targetLanguage,
        };

        let translation = await translate.translateText(params).promise();
        return translation.TranslatedText;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const languageInfo = {
    arabic: { code: "ar", voice: "Zeina" },
    catalan: { code: "ca", voice: "Conchita" },
    chinese: { code: "zh", voice: "Zhiyu" },
    mandarin: { code: "zh", voice: "Zhiyu" },
    danish: { code: "da", voice: "Naja" },
    flemish: { code: "nl-BE", voice: "Ruben" },
    dutch: { code: "nl", voice: "Lotte" },
    english: { code: "en", voice: "Joanna" },
    finnish: { code: "fi", voice: "Suvi" },
    french: { code: "fr", voice: "Lea" },
    hindi: { code: "hi", voice: "Aditi" },
    german: { code: "de", voice: "Marlene" },
    italian: { code: "it", voice: "Bianca" },
    japanese: { code: "ja", voice: "Mizuki" },
    korean: { code: "ko", voice: "Seoyeon" },
    norwegian: { code: "no", voice: "Liv" },
    polish: { code: "pl", voice: "Ewa" },
    portuguese: { code: "pt", voice: "Ines" },
    romanian: { code: "ro", voice: "Carmen" },
    russian: { code: "ru", voice: "Tatyana" },
    spanish: { code: "es", voice: "Lupe" },
    swedish: { code: "sv", voice: "Astrid" },
    turkish: { code: "tr", voice: "Filiz" },
    welsh: { code: "cy", voice: "Gwyneth" },
};

async function textToSpeech(text, voice) {
    try {
        let params = {
            OutputFormat: "mp3",
            Text: text,
            VoiceId: voice,
        };

        let speech = await polly.synthesizeSpeech(params).promise();
        // return speech.AudioStream.toString('base64');

        // Convert the base64-encoded audio to a Buffer
        let audioBuffer = Buffer.from(speech.AudioStream, "base64");

        // Define S3 upload parameters
        let timestamp = new Date().getTime();
        let s3Params = {
            Bucket: "alexa-translations",
            Key: `translation_${timestamp}.mp3`,
            Body: audioBuffer,
        };

        let uploadResult = await s3.upload(s3Params).promise();
        return uploadResult.Location;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
