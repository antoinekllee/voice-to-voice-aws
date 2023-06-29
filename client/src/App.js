import React, { useEffect, useState, useRef } from "react";
import "./App.css";
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

function App() {
    const [translation, setTranslation] = useState(null);
    const [language, setLanguage] = useState({ text: "English", emoji: "🇬🇧" });
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://translator-speaker-server-env.eba-sahpi3it.us-east-1.elasticbeanstalk.com");
        ws.current.onmessage = event => {
            const message = JSON.parse(event.data);

            if (message.type === "language") {
                const newLanguage = {
                    text: message.language.charAt(0).toUpperCase() + message.language.slice(1),
                    emoji: languageEmojis[message.language]
                };
                setLanguage(newLanguage);
            }
            else if (message.type === "translation") {
                const newTranslation = {
                    original: message.original,
                    translated: message.translated
                };
                setTranslation(newTranslation);
            }
        };
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
                    <img src={awsLogo} className={`alexa-logo`} alt="Alexa" /> 
                    <span className="logo-text">Amazon SkillsFuture 2023</span>
                </div>
                <div className="language-text">{language.text + " " + language.emoji}</div>
            </div>
            <div className="translation-container">
                <div className="card-container">
                    <Card title="English" text={translation ? translation.original : "Waiting..."} isPlaceholder={translation === null} />
                    <div className="emoji-container">
                        <p>🙂</p>
                    </div>
                </div>
                <div className="card-container">
                    <Card title={language.text} text={translation ? translation.translated : "Waiting..."} isPlaceholder={translation === null} />
                    <div className="emoji-container">
                        <p>{language.emoji}</p>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default App;