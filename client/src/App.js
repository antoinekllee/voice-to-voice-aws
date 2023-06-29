import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
    const [translation, setTranslation] = useState(null);
    const [language, setLanguage] = useState("English");
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://translator-speaker-server-env.eba-sahpi3it.us-east-1.elasticbeanstalk.com");
        ws.current.onmessage = event => {
            const message = JSON.parse(event.data);

            if (message.type === "language") {
                // capitalise first letter
                const newLanguage = message.language.charAt(0).toUpperCase() + message.language.slice(1);
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
            <div className="language-header">Language: {language}</div>
            <div className="translation-container">
                <div className="translation-card">
                    <label className="translation-label">Original</label>
                    { translation && <p className="translation-text">{translation.original}</p> }
                </div>
                <div className="translation-card">
                    <label className="translation-label">Translated</label>
                    { translation && <p className="translation-text">{translation.translated}</p> }
                </div>
            </div>
        </div>
    );
}

export default App;
