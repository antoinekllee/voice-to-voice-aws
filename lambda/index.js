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
                    text: 'Activated. Start by setting a language.',
                },
                shouldEndSession: false,
            },
        };
    } 
    else if (event.request.type === 'IntentRequest') 
    {
        if (event.request.intent.name === 'CapturePhraseIntent') 
        {    
            let phrase = event.request.intent.slots.phrase.value; 
            
            let language = (event.session.attributes && event.session.attributes['language']) || 'english';
            language = languageToCode[language];

            if (language === undefined) 
            {
                return {
                    version: '1.0',
                    response: {
                        outputSpeech: {
                            type: 'PlainText',
                            text: 'No language set. Please set a language.',
                        },
                        shouldEndSession: false,
                    },
                };
            }

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

            let language = event.request.intent.slots.language.value;

            if (languageToCode[language] === undefined) {
                return {
                    version: '1.0',
                    response: {
                        outputSpeech: {
                            type: 'PlainText',
                            text: `${language} is not supported`,
                        },
                        shouldEndSession: false,
                    },
                };
            }
            else 
            {
                let languageCode = languageToCode[language];
                // Store the language in the session attributes
                let sessionAttributes = event.session.attributes;
                sessionAttributes['language'] = languageCode;

                return {
                    version: '1.0',
                    response: {
                        outputSpeech: {
                            type: 'PlainText',
                            text: `language set to ${language}`,
                        },
                        shouldEndSession: false,
                    },
                    sessionAttributes: sessionAttributes
                };
            }
        }
    }
};

const languageToCode = {
    'arabic': 'arb',
    'catalan': 'ca-ES',
    'cantonese': 'yue-CN',
    'chinese': 'cmn-CN',
    'mandarin': 'cmn-CN',
    'danish': 'da-DK',
    'flemish': 'nl-BE',
    'dutch': 'nl-NL',
    'english': 'en-US',
    'finnish': 'fi-FI',
    'french': 'fr-FR',
    'hindi': 'hi-IN',
    'german': 'de-DE',
    'icelandic': 'is-IS',
    'italian': 'it-IT',
    'japanese': 'ja-JP',
    'korean': 'ko-KR',
    'norwegian': 'nb-NO',
    'polish': 'pl-PL',
    'portuguese': 'pt-BR',
    'romanian': 'ro-RO',
    'russian': 'ru-RU',
    'spanish': 'es-US',
    'swedish': 'sv-SE',
    'turkish': 'tr-TR',
    'welsh': 'cy-GB'
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

// Language and language variants

// Language code

// Name/ID

// Gender

// Neural Voice

// Standard Voice

// Arabic

// arb

// Zeina

// Female

// No

// Yes

// Arabic (Gulf)

// ar-AE

// Hala*

// Female

// Yes

// No

// Dutch (Belgian)

// nl-BE

// Lisa

// Female

// Yes

// No

// Catalan

// ca-ES

// Arlet

// Female

// Yes

// No

// Chinese (Cantonese)

// yue-CN

// Hiujin

// Female

// Yes

// No

// Chinese (Mandarin)

// cmn-CN

// Zhiyu

// Female

// Yes

// Yes

// Danish

// da-DK

// Naja

// Mads

// Sofie

// Female

// Male

// Female

// No

// No

// Yes

// Yes

// Yes

// No

// Dutch

// nl-NL

// Laura

// Lotte

// Ruben

// Female

// Female

// Male

// Yes

// No

// No

// No

// Yes

// Yes

// English (Australian)

// en-AU

// Nicole

// Olivia

// Russell

// Female

// Female

// Male

// No

// Yes

// No

// Yes

// No

// Yes

// English (British)

// en-GB

// Amy**

// Emma

// Brian

// Arthur

// Female

// Female

// Male

// Male

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// No

// English (Indian)

// en-IN

// Aditi*

// Raveena

// Kajal*

// Female

// Female

// Female

// No

// No

// Yes

// Yes

// Yes

// No

// English (Ireland)

// en-IE

// Niamh

// Female

// Yes

// No

// English (New Zealand)

// en-NZ

// Aria

// Female

// Yes

// No

// English (South African)

// en-ZA

// Ayanda

// Female

// Yes

// No

// English (US)

// en-US

// Ivy

// Joanna**

// Kendra

// Kimberly

// Salli

// Joey

// Justin

// Kevin

// Matthew**

// Ruth

// Stephen

// Female (child)

// Female

// Female

// Female

// Female

// Male

// Male (child)

// Male (child)

// Male

// Female

// Male

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// Yes

// No

// Yes

// No

// No

// English (Welsh)

// en-GB-WLS

// Geraint

// Male

// No

// Yes

// Finnish

// fi-FI

// Suvi

// Female

// Yes

// No

// French

// fr-FR

// Céline/Celine

// Léa

// Mathieu

// Rémi

// Female

// Female

// Male

// Male

// No

// Yes

// No

// Yes

// Yes

// Yes

// Yes

// No

// French (Canadian)

// fr-CA

// Chantal

// Gabrielle

// Liam

// Female

// Female

// Male

// No

// Yes

// Yes

// Yes

// No

// No

// German

// de-DE

// Marlene

// Vicki

// Hans

// Daniel

// Female

// Female

// Male

// Male

// No

// Yes

// No

// Yes

// Yes

// Yes

// Yes

// No

// German (Austrian)

// de-AT

// Hannah

// Female

// Yes

// No

// Hindi

// hi-IN

// Aditi*

// Kajal*

// Female

// Female

// No

// Yes

// Yes

// No

// Icelandic

// is-IS

// Dóra/Dora

// Karl

// Female

// Male

// No

// No

// Yes

// Yes

// Italian

// it-IT

// Carla

// Bianca

// Giorgio

// Adriano

// Female

// Female

// Male

// Male

// No

// Yes

// No

// Yes

// Yes

// Yes

// Yes

// No

// Japanese

// ja-JP

// Mizuki

// Takumi

// Kazuha

// Tomoko

// Female

// Male

// Female

// Female

// No

// Yes

// Yes

// Yes

// Yes

// Yes

// No

// No

// Korean

// ko-KR

// Seoyeon

// Female

// Yes

// Yes

// Norwegian

// nb-NO

// Liv

// Ida

// Female

// Female

// No

// Yes

// Yes

// No

// Polish

// pl-PL

// Ewa

// Maja

// Jacek

// Jan

// Ola

// Female

// Female

// Male

// Male

// Female

// No

// No

// No

// No

// Yes

// Yes

// Yes

// Yes

// Yes

// No

// Portuguese (Brazilian)

// pt-BR

// Camila

// Vitória/Vitoria

// Ricardo

// Thiago

// Female

// Female

// Male

// Male

// Yes

// Yes

// No

// Yes

// Yes

// Yes

// Yes

// No

// Portuguese (European)

// pt-PT	
// Inês/Ines

// Cristiano

// Female

// Male

// Yes

// No

// Yes

// Yes

// Romanian

// ro-RO

// Carmen

// Female

// No

// Yes

// Russian

// ru-RU

// Tatyana

// Maxim

// Female

// Male

// No

// No

// Yes

// Yes

// Spanish (European)

// es-ES

// Conchita

// Lucia

// Enrique

// Sergio

// Female

// Female

// Male

// Male

// No

// Yes

// No

// Yes

// Yes

// Yes

// Yes

// No

// Spanish (Mexican)

// es-MX

// Mia

// Andrés

// Female

// Male

// Yes

// Yes

// Yes

// No

// Spanish (US)

// es-US

// Lupe**

// Penélope/Penelope

// Miguel

// Pedro

// Female

// Female

// Male

// Male

// Yes

// No

// No

// Yes

// Yes

// Yes

// Yes

// No

// Swedish

// sv-SE

// Astrid

// Elin

// Female

// Female

// No

// Yes

// Yes

// No

// Turkish

// tr-TR

// Filiz

// Female

// No

// Yes

// Welsh

// cy-GB

// Gwyneth

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
        Body: audioBuffer
    };
    
    let uploadResult = await s3.upload(s3Params).promise();
    return uploadResult.Location;
}