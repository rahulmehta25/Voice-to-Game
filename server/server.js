/**
 * GCP Speech-to-Text Server for Voice to Game
 * Streams audio from browser to GCP and returns transcriptions
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const speech = require('@google-cloud/speech');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// GCP Speech client
const speechClient = new speech.SpeechClient();

// Speech recognition config
const speechConfig = {
    config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: false,
        model: 'command_and_search', // Optimized for short commands
        useEnhanced: true,
        speechContexts: [{
            phrases: [
                'up', 'jump', 'hop',
                'left', 'go left',
                'right', 'go right', 
                'stop', 'halt', 'wait'
            ],
            boost: 20.0
        }]
    },
    interimResults: true,
};

console.log('🎮 Voice to Game - GCP Speech Server');
console.log('====================================');

wss.on('connection', (ws) => {
    console.log('🔌 Client connected');
    
    let recognizeStream = null;
    
    // Start a new recognition stream
    function startStream() {
        recognizeStream = speechClient
            .streamingRecognize(speechConfig)
            .on('error', (err) => {
                console.error('❌ Speech API error:', err.message);
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ error: err.message }));
                }
                // Restart stream on error
                setTimeout(() => {
                    if (ws.readyState === ws.OPEN) {
                        startStream();
                    }
                }, 1000);
            })
            .on('data', (data) => {
                if (data.results[0]) {
                    const result = data.results[0];
                    const transcript = result.alternatives[0]?.transcript || '';
                    const isFinal = result.isFinal;
                    const confidence = result.alternatives[0]?.confidence || 0;
                    
                    console.log(`🎤 ${isFinal ? '✓' : '...'} "${transcript}" (${(confidence * 100).toFixed(0)}%)`);
                    
                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            transcript,
                            isFinal,
                            confidence
                        }));
                    }
                }
            })
            .on('end', () => {
                console.log('📴 Stream ended');
            });
            
        console.log('🎙️ Recognition stream started');
    }
    
    startStream();
    
    // Handle incoming audio data
    ws.on('message', (data) => {
        if (recognizeStream && !recognizeStream.destroyed) {
            recognizeStream.write(data);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 Client disconnected');
        if (recognizeStream) {
            recognizeStream.end();
        }
    });
    
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gcp-speech' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🎮 Open http://localhost:${PORT} to play!`);
    console.log('');
    console.log('Make sure you have run:');
    console.log('  gcloud auth application-default login');
    console.log('');
});
