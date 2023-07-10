import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { motion, AnimatePresence } from 'framer-motion';

import alexaLogo from './assets/alexaLogo.png'; 
import awsLogo from './assets/awsLogo.png'; 

import Card from "./components/Card";

const languageEmojis = {
    arabic: "🇸🇦",
    catalan: "🇦🇩",
    chinese: "🇨🇳",
    mandarin: "🇹🇼", 
    danish: "🇩🇰",
    flemish: "🇧🇪",
    dutch: "🇳🇱",
    english: "🇬🇧",
    finnish: "🇫🇮",
    french: "🇫🇷", 
    hindi: "🇮🇳", 
    german: "🇩🇪",
    italian: "🇮🇹",
    japanese: "🇯🇵",
    korean: "🇰🇷",
    norwegian: "🇳🇴",
    polish: "🇵🇱",
    portuguese: "🇵🇹", 
    romanian: "🇷🇴",
    russian: "🇷🇺",
    spanish: "🇪🇸",
    swedish: "🇸🇪",
    turkish: "🇹🇷",
    welsh: "🏴󠁧󠁢󠁷󠁬󠁳󠁿"
}

function isEmoji(str) {
    const ranges = [
        "\ud83c[\udf00-\udfff]", // U+1F300 to U+1F3FF
        "\ud83d[\udc00-\ude4f]", // U+1F400 to U+1F64F
        "\ud83d[\ude80-\udeff]", // U+1F680 to U+1F6FF
        "\ud83d[\udd00-\uddff]", // U+1F700 to U+1F77F
        "\u2600-\u27bf", // Miscellaneous Symbols
        "\u1f900-\u1f9ff", // U+1F900 to U+1F9FF
    ];
    let emojiRegex = new RegExp(ranges.join("|"), "g");
    return str.match(emojiRegex);
}

function splitEmojis(text) {
    const emojis = isEmoji(text);
    if (emojis) {
        const split = emojis.join("").split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/);
        return split.filter((emoji) => emoji !== "");
    } else {
        return [];
    }
}

function App() {
    const [translation, setTranslation] = useState(null);
    const [language, setLanguage] = useState({ text: "English", emoji: "🇬🇧" });
    const [emotes, setEmotes] = useState([]);
    
    const ws = useRef(null);
    const [wsStatus, setWsStatus] = useState('DISCONNECTED');
    // const [isListening, setIsListening] = useState(true);
    const isListening = useRef(true); 

    const [isAnimating, setIsAnimating] = useState(false);
    
    const logoVariants = {
        idle: { scale: 1, rotate: 0, y: 0 },
        animating: { scale: 1.2, rotate: 360, y: -20 }
    };

    useEffect(() => {
        function connectWebSocket() 
        {
            ws.current = new WebSocket("ws://vocice-to-voice-server-env.eba-mf6mtamm.us-east-1.elasticbeanstalk.com/update");
            ws.current.onopen = () => setWsStatus('CONNECTED');
            ws.current.onclose = () => {
                setWsStatus('DISCONNECTED');
                setTimeout(connectWebSocket, 1000);  // try reconnect after 1 sec
            };
            ws.current.onmessage = async(event) => {
                if (!isListening.current) return; 

                isListening.current = false; 

                console.log('WebSocket message received:', event.data);
                
                const message = JSON.parse(event.data);

                try {
                    const newLanguage = {
                        text: message.language.charAt(0).toUpperCase() + message.language.slice(1),
                        emoji: languageEmojis[message.language]
                    };
                    setLanguage(newLanguage);
                } catch(error) {
                    console.error('An error occurred when trying to process the language: ', error);
                }

                if (message.type === "translation") {
                    setIsAnimating(true); 
                    setTimeout(() => setIsAnimating(false), 1000); 

                    const newTranslation = {
                        original: message.original,
                        translated: message.translated
                    };
                    setTranslation(newTranslation);

                    setEmotes([]);

                    const response = await fetch("http://vocice-to-voice-server-env.eba-mf6mtamm.us-east-1.elasticbeanstalk.com/emotes", {
                        body: JSON.stringify({ text: message.original }), 
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                    });
                    const data = await response.json();
            
                    if (data.status === "ERROR") 
                    {
                        alert ("An error occurred while generating emojis.")
                        setEmotes([]);
                    }
                    else {
                        console.log (data.emojis)
                        setEmotes(splitEmojis(data.emojis));
                    }
                }
                else
                {
                    setTranslation(null);
                    setEmotes([]);
                }

                setTimeout(() => { isListening.current = true; }, 1000); 
            };
        }

        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="App">
            <div className="header">
                <div className="logo-container">
                    <img src={awsLogo} className={`aws-logo`} alt="Alexa" /> 
                    <span className="logo-text">Amazon SkillsFuture 2023</span>
                </div>
                <div className="language-text">{language.text + " " + language.emoji}</div>
            </div>
            <div className="translation-container">
                <div className="card-container">
                <AnimatePresence>
                    <Card title={"English " + languageEmojis["english"]} text={translation ? translation.original : "Waiting..."} isPlaceholder={translation === null} />
                </AnimatePresence>
                </div>
                <motion.img 
                    src={alexaLogo} 
                    className={`alexa-logo`} 
                    alt="Alexa" 
                    initial='idle'
                    animate={isAnimating ? 'animating' : 'idle'}
                    variants={logoVariants}
                    transition={{ type: "spring", duration: 1 }}
                />
                <div className="card-container">
                    <AnimatePresence>
                        <Card title={language.text + " " + language.emoji} text={translation ? translation.translated : "Waiting..."} isPlaceholder={translation === null} />
                    </AnimatePresence>
                </div>
            </div>
            <div className="emoji-container">
                {emotes.map((emoji, index) => (
                    <motion.p
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.5, duration: 0.5 }}
                    >
                        {emoji}
                    </motion.p>
                ))}
            </div>
            <div className="ws-status">{wsStatus}</div>
        </div>

    );
}

export default App;