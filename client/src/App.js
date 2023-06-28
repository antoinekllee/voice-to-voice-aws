import React, { useEffect, useState, useRef } from "react";

function App() {
    const [update, setUpdate] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        // Connect to the WebSocket server
        ws.current = new WebSocket("ws://localhost:3001");

        // Listen for incoming messages
        ws.current.onmessage = event => {
            const message = JSON.parse(event.data);
            setUpdate(message);
        };

        // Clean up the effect
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="App">
            {update && (
                <div>
                    <p>Original Text: {update.original}</p>
                    <p>Translated Text: {update.translated}</p>
                </div>
            )}
        </div>
    );
}

export default App;
