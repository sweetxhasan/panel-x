const express = require('express');
const path = require('path');
const cors = require('cors');
const bypassRouter = require('./api/bypass');
const proxyRouter = require('./api/proxy');

const app = express();

// Vercel এ WebSocket চালু না করাই ভালো (কারণ এটি সমর্থন করে না)
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  // শুধু Termux/লোকাল এ WebSocket চালু হবে
  const expressWs = require('express-ws')(app);
  app.ws('/browser-stream', (ws, req) => {
    console.log('Browser stream connected (local only)');
    ws.on('message', (msg) => {
      // হ্যান্ডেল ব্রাউজার কমান্ড
    });
  });
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/bypass', bypassRouter);
app.use('/api/proxy', proxyRouter);

// সকল রিকোয়েস্ট frontend এ পাঠাও
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PANEL X running on port ${PORT} (${isVercel ? 'Vercel' : 'Local/Termux'})`);
});
