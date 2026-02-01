# 🔥💧 Voice-Controlled Fireboy & Watergirl

A cooperative platformer where one player uses **keyboard** controls (Fireboy) while another uses **voice commands** (Watergirl) via Google Cloud Speech-to-Text.

![Game Screenshot](docs/screenshot.png)

## 🎮 How to Play

**Fireboy (Keyboard Player):**
- `W` / `↑` - Jump
- `A` / `←` - Move left
- `D` / `→` - Move right

**Watergirl (Voice Player):**
- Say **"up"** or **"jump"** - Jump
- Say **"left"** - Move left
- Say **"right"** - Move right  
- Say **"stop"** - Stop moving

## 🛠️ Tech Stack

- **Frontend:** Vanilla JS, HTML5 Canvas
- **Speech Recognition:** Google Cloud Speech-to-Text API
- **Backend:** Node.js/Express (for GCP API proxy)

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Google Cloud account with Speech-to-Text API enabled
- GCP Service Account credentials

### 1. Configure GCP Credentials

```bash
# Set your GCP credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"
```

### 2. Start the Backend Server

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:3001`

### 3. Open the Game

Open `index.html` in your browser, or serve it:

```bash
# From project root
npx serve .
```

### 4. Allow Microphone Access

Click "Start Game" and allow microphone permissions when prompted.

## 📁 Project Structure

```
Voice to Game/
├── index.html      # Main game page
├── game.js         # Game engine (physics, rendering, levels)
├── speech.js       # Voice recognition integration
├── style.css       # Game styling
├── server/         # Backend for GCP Speech-to-Text
│   ├── server.js   # Express API server
│   └── package.json
└── docs/           # Documentation
```

## 🎯 Features

- **Real-time voice recognition** with GCP Speech-to-Text
- **Split control scheme** - keyboard + voice cooperation
- **Multiple levels** with increasing difficulty
- **Visual feedback** for recognized commands
- **Low latency** voice processing

## 🔧 Configuration

Edit `speech.js` to adjust:
- Recognition sensitivity
- Command word variations
- API endpoint URL

Edit `server/server.js` to adjust:
- Port number
- GCP project settings
- CORS configuration

## 📝 License

MIT

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss changes.
