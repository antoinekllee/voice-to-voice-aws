const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const translate = new AWS.Translate(); // translates to desired language
const polly = new AWS.Polly(); // ai voice output

exports.handler = async (event) => {
    try {
        if (event.request.type === "LaunchRequest") {
            console.log("Launch");
            // Return a response to indicate that the LaunchRequest is working
            return {
                version: "1.0",
                response: {
                    outputSpeech: {
                        type: "PlainText",
                        text: "Activated. Start by setting a language.",
                    },
                    shouldEndSession: false,
                },
            };
        } else if (event.request.type === "IntentRequest") {
            if (event.request.intent.name === "CaptureLanguageIntent") {
                console.log("Capture language intent");

                let language = event.request.intent.slots.language.value || "english";
                language = language.toLowerCase();

                console.log("LANGUAGE CAPTURED: " + language);

                let languageData = languageInfo[language];

                if (languageData === undefined) {
                    console.log("Language not supported");

                    return {
                        version: "1.0",
                        response: {
                            outputSpeech: {
                                type: "PlainText",
                                text: `${language} is not supported`,
                            },
                            shouldEndSession: false,
                        },
                    };
                } else {
                    let sessionAttributes = event.session.attributes;
                    sessionAttributes["language"] = language;

                    console.log("LANGUAGE SET: " + language);

                    return {
                        version: "1.0",
                        response: {
                            outputSpeech: {
                                type: "PlainText",
                                text: `language set to ${language}`,
                            },
                            shouldEndSession: false,
                        },
                        sessionAttributes: sessionAttributes,
                    };
                }
            } else if (event.request.intent.name === "CapturePhraseIntent") {
                console.log("Capture phrase intent called");

                let phrase = event.request.intent.slots.phrase.value;
                // let language = event.session.attributes.language || "english"; 
                let language = event.session.attributes && event.session.attributes["language"];
                console.log("THE LANGUAGE THAT WILL BE USED IS: " + language);

                let languageData = languageInfo[language];

                if (languageData === undefined) {
                    languageData = languageInfo["english"];
                    console.log("LANGUAGE NOT SUPPORTED, DEFAULTING TO ENGLISH");
                }

                let translatedText = await translateText(phrase, languageData.code);

                console.log("TRANSLATED TEXT: " + translatedText);

                let speech = await textToSpeech(translatedText, languageData.voice);

                console.log("Speech: " + speech);

                // Return a response to Alexa
                return {
                    version: "1.0",
                    response: {
                        outputSpeech: {
                            type: "SSML",
                            ssml: `<speak><audio src="${speech}" /></speak>`,
                        },
                        shouldEndSession: false,
                    },
                };
            } else if (event.request.intent.name === "AMAZON.FallbackIntent") {
                console.log("Fallback intent called");

                // Return a response to Alexa
                return {
                    version: "1.0",
                    response: {
                        outputSpeech: {
                            type:"PlainText",
                            text: "Sorry, I didn't understand that. Can you rephrase?",
                        },
                        shouldEndSession: false,
                    },
                };
            }
        }
    } catch (error) {
        console.error(error);

        // Return an error response to Alexa
        return {
            version: "1.0",
            response: {
                outputSpeech: {
                    type: "PlainText",
                    text: "An error occurred while processing your request. Please try again.",
                },
                shouldEndSession: false,
            },
        };
    }
};

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
    french: { code: "fr", voice: "Céline" },
    hindi: { code: "hi", voice: "Aditi" },
    german: { code: "de", voice: "Marlene" },
    icelandic: { code: "is", voice: "Dóra" },
    italian: { code: "it", voice: "Bianca" },
    japanese: { code: "ja", voice: "Mizuki" },
    korean: { code: "ko", voice: "Seoyeon" },
    norwegian: { code: "no", voice: "Liv" },
    polish: { code: "pl", voice: "Ewa" },
    portuguese: { code: "pt", voice: "Vitória" },
    romanian: { code: "ro", voice: "Carmen" },
    russian: { code: "ru", voice: "Tatyana" },
    spanish: { code: "es", voice: "Penélope" },
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
            Bucket: "alexa-polly-translations",
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
