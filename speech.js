// GCP Speech-to-Text Module for Voice-Controlled Fireboy & Watergirl
// Uses WebSocket to stream audio to GCP via our backend server

let ws = null;
let mediaRecorder = null;
let audioStream = null;
let isListening = false;
let onCommandCallback = null;

const WS_URL = 'ws://localhost:3000';

// Initialize speech recognition via GCP
async function initSpeechRecognition() {
    console.log('🎤 Initializing GCP Speech-to-Text...');
    
    try {
        // Request microphone access
        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 48000,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        console.log('✅ Microphone access granted');
        return true;
    } catch (err) {
        console.error('❌ Microphone access denied:', err);
        alert('Microphone access denied. Please allow microphone access to use voice controls.');
        return false;
    }
}

// Connect to WebSocket server
function connectWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting to speech server...');
        
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('✅ Connected to speech server');
            resolve(true);
        };
        
        ws.onclose = () => {
            console.log('📴 Disconnected from speech server');
            if (isListening) {
                // Try to reconnect
                setTimeout(() => {
                    if (isListening) {
                        connectWebSocket().then(() => startRecording());
                    }
                }, 1000);
            }
        };
        
        ws.onerror = (err) => {
            console.error('❌ WebSocket error:', err);
            updateMicStatus(false);
            reject(err);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.error) {
                    console.error('❌ Server error:', data.error);
                    return;
                }
                
                const { transcript, isFinal, confidence } = data;
                
                // Update display
                updateRawTranscript(transcript + (isFinal ? ' ✓' : ' ...'));
                
                if (isFinal && transcript.trim()) {
                    console.log(`🎯 Final: "${transcript}" (${(confidence * 100).toFixed(0)}%)`);
                    handleCommand(transcript.trim().toLowerCase());
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };
    });
}

// Start recording and streaming
function startRecording() {
    if (!audioStream || !ws || ws.readyState !== WebSocket.OPEN) {
        console.error('Cannot start recording: not ready');
        return;
    }
    
    // Use MediaRecorder to capture audio
    mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
        }
    };
    
    // Send audio chunks every 250ms for low latency
    mediaRecorder.start(250);
    console.log('🎙️ Recording started');
}

// Handle recognized command
function handleCommand(text) {
    let action = null;

    console.log('🎯 Processing:', text);

    // Check for combo commands first (direction + jump)
    const hasJump = text.includes('jump') || text.includes('up') || text.includes('hop') || text.includes('and jump');
    const hasLeft = text.includes('left');
    const hasRight = text.includes('right') || text.includes('write');
    
    // Combo: right + jump
    if (hasRight && hasJump) {
        action = 'right-jump';
    }
    // Combo: left + jump
    else if (hasLeft && hasJump) {
        action = 'left-jump';
    }
    // Just jump
    else if (hasJump) {
        action = 'jump';
    }
    // Just left (moves fixed distance)
    else if (hasLeft) {
        action = 'left';
    }
    // Just right (moves fixed distance)
    else if (hasRight) {
        action = 'right';
    }
    // Stop
    else if (text.includes('stop') || text.includes('halt') || text.includes('wait')) {
        action = 'stop';
    }

    if (action && onCommandCallback) {
        console.log('✅ Action:', action);
        const command = { character: 'water', action };
        onCommandCallback(command);
        updateCommandDisplay(`💧 ${action.toUpperCase()}`);
    } else {
        console.log('❓ Unknown command:', text);
        updateCommandDisplay(`❓ "${text}"`);
    }
}

// Start listening for commands
async function startListening() {
    if (isListening) return true;
    
    // Initialize if needed
    if (!audioStream) {
        if (!await initSpeechRecognition()) {
            return false;
        }
    }
    
    try {
        await connectWebSocket();
        startRecording();
        isListening = true;
        updateMicStatus(true);
        return true;
    } catch (err) {
        console.error('Failed to start listening:', err);
        alert('Failed to connect to speech server. Make sure to run: cd server && npm install && npm start');
        return false;
    }
}

// Stop listening
function stopListening() {
    isListening = false;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    if (ws) {
        ws.close();
        ws = null;
    }
    
    updateMicStatus(false);
    console.log('🛑 Stopped listening');
}

// Set callback for when commands are recognized
function setCommandCallback(callback) {
    onCommandCallback = callback;
}

// Update microphone status display
function updateMicStatus(listening) {
    const micStatus = document.getElementById('mic-status');
    const micText = document.getElementById('mic-text');

    if (listening) {
        micStatus?.classList.add('listening');
        if (micText) micText.textContent = '🟢 GCP Listening...';
    } else {
        micStatus?.classList.remove('listening');
        if (micText) micText.textContent = 'Not listening';
    }
}

// Update command display
function updateCommandDisplay(command) {
    const commandValue = document.getElementById('command-value');
    if (commandValue) {
        commandValue.textContent = command || 'None';
        commandValue.classList.remove('active');
        void commandValue.offsetWidth;
        commandValue.classList.add('active');
    }
}

// Update raw transcript display
function updateRawTranscript(text) {
    const rawDisplay = document.getElementById('raw-transcript');
    if (rawDisplay) {
        rawDisplay.textContent = `"${text}"`;
    }
}

// Check if speech is supported
function isSpeechSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
