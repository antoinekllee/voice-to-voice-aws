import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
    const [update, setUpdate] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://translator-speaker-server-env.eba-sahpi3it.us-east-1.elasticbeanstalk.com");
        ws.current.onmessage = event => {
            const message = JSON.parse(event.data);
            setUpdate(message);
        };
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="App">
            <div className="language-header">Language: English</div>
            <div className="translation-container">
                {update && (
                    <>
                        <div className="translation-card">
                            <label className="translation-label">Original</label>
                            <p className="translation-text">{update.original}</p>
                        </div>
                        <div className="translation-card">
                            <label className="translation-label">Translated</label>
                            <p className="translation-text">{update.translated}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
