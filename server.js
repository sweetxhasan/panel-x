const express = require('express');
const path = require('path');
const cors = require('cors');
const expressWs = require('express-ws');
const { spawn } = require('child_process');
const bypassRouter = require('./api/bypass');
const proxyRouter = require('./api/proxy');

const app = express();
expressWs(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/bypass', bypassRouter);
app.use('/api/proxy', proxyRouter);

// WebSocket for real-time browser view
app.ws('/browser-stream', (ws, req) => {
    console.log('Browser stream connected');
    
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        // Handle browser commands
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 PANEL X running on port ${PORT}`);
});
