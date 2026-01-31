// Speech Recognition Module for Voice-Controlled Fireboy & Watergirl

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let onCommandCallback = null;

// Initialize speech recognition
function initSpeechRecognition() {
    if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isListening = true;
        updateMicStatus(true);
        console.log('Speech recognition started');
    };

    recognition.onend = function() {
        console.log('Speech recognition ended');
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.log('Recognition restart error:', e);
            }
        } else {
            updateMicStatus(false);
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to use voice controls.');
            stopListening();
        } else if (event.error === 'no-speech') {
            console.log('No speech detected, continuing...');
        }
    };

    recognition.onresult = function(event) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.trim().toLowerCase();
            console.log('Heard:', transcript);
            handleCommand(transcript);
        }
    };

    return true;
}

// Handle recognized command
function handleCommand(text) {
    let character = null;
    let action = null;

    // Detect character
    if (text.includes('fire') || text.includes('red') || text.includes('boy')) {
        character = 'fire';
    } else if (text.includes('water') || text.includes('blue') || text.includes('girl')) {
        character = 'water';
    }

    // Detect action
    if (text.includes('up') || text.includes('jump') || text.includes('hop')) {
        action = 'jump';
    } else if (text.includes('left')) {
        action = 'left';
    } else if (text.includes('right') || text.includes('write')) {
        action = 'right';
    } else if (text.includes('stop') || text.includes('halt')) {
        action = 'stop';
    }

    if (character && action && onCommandCallback) {
        const command = { character, action };
        onCommandCallback(command);
        updateCommandDisplay(`${character} ${action}`);
    }
}

// Start listening for commands
function startListening() {
    if (!recognition) {
        if (!initSpeechRecognition()) {
            return false;
        }
    }

    try {
        isListening = true;
        recognition.start();
        return true;
    } catch (e) {
        console.error('Error starting recognition:', e);
        return false;
    }
}

// Stop listening
function stopListening() {
    isListening = false;
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.log('Error stopping recognition:', e);
        }
    }
    updateMicStatus(false);
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
        micStatus.classList.add('listening');
        micText.textContent = 'Listening...';
    } else {
        micStatus.classList.remove('listening');
        micText.textContent = 'Not listening';
    }
}

// Update command display
function updateCommandDisplay(command) {
    const commandValue = document.getElementById('command-value');
    commandValue.textContent = command || 'None';

    commandValue.classList.remove('active');
    void commandValue.offsetWidth;
    commandValue.classList.add('active');
}

// Check if speech recognition is supported
function isSpeechSupported() {
    return !!SpeechRecognition;
}
