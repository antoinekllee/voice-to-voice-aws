import React, { useEffect, useState } from "react";
import io from "socket.io-client";

function App() {
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Connect to the WebSocket server
        const socket = io("http://localhost:3000");

        // Listen for incoming messages
        socket.on("message", (data) => {
            const message = JSON.parse(data);
            setMessage(message);
        });

        // Clean up the effect
        return () => socket.disconnect();
    }, []);

    return (
        <div className="App">
            {message && (
                <div>
                    <p>Original Text: {message.original}</p>
                    <p>Translated Text: {message.translated}</p>
                </div>
            )}
        </div>
    );
}

export default App;
