const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

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
