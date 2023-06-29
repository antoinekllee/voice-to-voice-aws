import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { motion } from 'framer-motion';

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
    icelandic: "🇮🇸",
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

function splitEmojis(text) {
    const split = text.split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/);
    return split.filter((emoji) => emoji !== "");
}

function App() {
    const [translation, setTranslation] = useState(null);
    const [language, setLanguage] = useState({ text: "English", emoji: "🇬🇧" });
    const [emotes, setEmotes] = useState([]);
    
    const ws = useRef(null);
    const [wsStatus, setWsStatus] = useState('DISCONNECTED');

    const [isAnimating, setIsAnimating] = useState(false);
    
    const logoVariants = {
        idle: { scale: 1, rotate: 0, y: 0 },
        animating: { scale: 1.2, rotate: 360, y: -20 }
    };

    useEffect(() => {
        function connectWebSocket() 
        {
            ws.current = new WebSocket("ws://translator-speaker-server-env.eba-sahpi3it.us-east-1.elasticbeanstalk.com");
            ws.current.onopen = () => setWsStatus('CONNECTED');
            ws.current.onclose = () => {
                setWsStatus('DISCONNECTED');
                setTimeout(connectWebSocket, 1000);  // try reconnect after 1 sec
            };
            ws.current.onmessage = async(event) => {
                const message = JSON.parse(event.data);

                if (message.type === "language") {
                    const newLanguage = {
                        text: message.language.charAt(0).toUpperCase() + message.language.slice(1),
                        emoji: languageEmojis[message.language]
                    };
                    setLanguage(newLanguage);
                }
                else if (message.type === "translation") {
                    setIsAnimating(true); 
                    setTimeout(() => setIsAnimating(false), 1000); 

                    const newTranslation = {
                        original: message.original,
                        translated: message.translated
                    };
                    setTranslation(newTranslation);

                    setEmotes([]);

                    const response = await fetch("http://translator-speaker-server-env.eba-sahpi3it.us-east-1.elasticbeanstalk.com/emotes", {
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
                        setEmotes(splitEmojis(data.emojis));
                    }
                }
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
                    <Card title={"English " + languageEmojis["english"]} text={translation ? translation.original : "Waiting..."} isPlaceholder={translation === null} />
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
                    <Card title={language.text + " " + language.emoji} text={translation ? translation.translated : "Waiting..."} isPlaceholder={translation === null} />
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