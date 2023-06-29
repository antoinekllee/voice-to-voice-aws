require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

const app = express();

const { PORT, OPENAI_KEY } = process.env;

const configuration = new Configuration({ apiKey: OPENAI_KEY });
const openai = new OpenAIApi(configuration);

app.use(cors());

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

app.get('/', (req, res) => res.send('Working'));

// Handle incoming WebSocket connections
wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('close', () => console.log('Client disconnected'));
});

// Create an HTTP server and attach WebSocket server
const port = PORT || 3001;
const server = app.listen(port, () => console.log(`Listening on port ${port}`));

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});

// Handle incoming POST requests from Lambda function
app.post('/update', express.json(), (req, res) => 
{
    const message = req.body;

    console.log(message);

    // Broadcast message to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });

    res.sendStatus(200);
});

app.post('/emotes', express.json(), async(req, res) =>
{
    try
    {
        const { text } = req.body;

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Generate a short sequence of anywhere between 3-5 emojis representative of the text. Do not output anything else." },
                { role: "user", content: "Good morning." },
                { role: "assistant", content: "🌞☀️🌅" },
                { role: "user", content: "This is my first time in this city, what places would you suggest I visit?" },
                { role: "assistant", content: "🏰🌸🍽️🌳" },
                { role: "user", content: text }
            ],
            temperature: 0.7,
            max_tokens: 100,   
        });

        const emojis = response.data.choices[0].message.content;
        res.status(200).json({ status: "OK", emojis });
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ status: "ERROR", message: "Server error" });
    }
});