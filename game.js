// Game Logic for Voice-Controlled Fireboy & Watergirl

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const TILE_SIZE = 40;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;

let canvas, ctx;
let gameRunning = false;
let currentLevel = 0;
let animationId = null;

// Characters
let fireboy = null;
let watergirl = null;

// Level elements
let platforms = [];
let firePools = [];
let waterPools = [];
let fireExit = null;
let waterExit = null;

// Level definitions - very simple stages
const levels = [
    // Level 1: Simple introduction
    {
        fireStart: { x: 50, y: 320 },
        waterStart: { x: 120, y: 320 },
        fireExit: { x: 500, y: 320 },
        waterExit: { x: 500, y: 240 },
        platforms: [
            { x: 0, y: 360, w: 600, h: 40 },      // Ground
            { x: 480, y: 280, w: 120, h: 20 },    // Upper platform for water exit
            { x: 300, y: 320, w: 100, h: 20 },    // Middle step
        ],
        firePools: [
            { x: 200, y: 350, w: 60, h: 10 }      // Small fire pool
        ],
        waterPools: [
            { x: 400, y: 350, w: 60, h: 10 }      // Small water pool
        ]
    },
    // Level 2: Jumping required
    {
        fireStart: { x: 50, y: 320 },
        waterStart: { x: 50, y: 200 },
        fireExit: { x: 520, y: 320 },
        waterExit: { x: 520, y: 120 },
        platforms: [
            { x: 0, y: 360, w: 600, h: 40 },      // Ground
            { x: 0, y: 240, w: 150, h: 20 },      // Left upper platform
            { x: 200, y: 200, w: 100, h: 20 },    // Middle upper
            { x: 350, y: 160, w: 250, h: 20 },    // Right upper
            { x: 250, y: 320, w: 80, h: 20 },     // Lower step
        ],
        firePools: [
            { x: 150, y: 350, w: 80, h: 10 }
        ],
        waterPools: [
            { x: 370, y: 350, w: 80, h: 10 }
        ]
    },
    // Level 3: More complex
    {
        fireStart: { x: 50, y: 120 },
        waterStart: { x: 520, y: 120 },
        fireExit: { x: 520, y: 320 },
        waterExit: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 360, w: 600, h: 40 },      // Ground
            { x: 0, y: 160, w: 120, h: 20 },      // Top left
            { x: 480, y: 160, w: 120, h: 20 },    // Top right
            { x: 200, y: 200, w: 200, h: 20 },    // Middle platform
            { x: 100, y: 280, w: 100, h: 20 },    // Lower left
            { x: 400, y: 280, w: 100, h: 20 },    // Lower right
        ],
        firePools: [
            { x: 0, y: 350, w: 100, h: 10 },
            { x: 250, y: 350, w: 100, h: 10 }
        ],
        waterPools: [
            { x: 500, y: 350, w: 100, h: 10 },
            { x: 150, y: 350, w: 80, h: 10 }
        ]
    }
];

// Character class
class Character {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velX = 0;
        this.velY = 0;
        this.color = color;
        this.type = type; // 'fire' or 'water'
        this.onGround = false;
        this.atExit = false;
        this.movingLeft = false;
        this.movingRight = false;
    }

    update() {
        // Apply gravity
        this.velY += GRAVITY;

        // Apply horizontal movement
        if (this.movingLeft) {
            this.velX = -MOVE_SPEED;
        } else if (this.movingRight) {
            this.velX = MOVE_SPEED;
        } else {
            this.velX *= 0.8; // Friction
            if (Math.abs(this.velX) < 0.1) this.velX = 0;
        }

        // Update position
        this.x += this.velX;
        this.y += this.velY;

        // Check platform collisions
        this.onGround = false;
        platforms.forEach(plat => {
            if (this.collidesWith(plat)) {
                // Collision from above
                if (this.velY > 0 && this.y + this.height - this.velY <= plat.y) {
                    this.y = plat.y - this.height;
                    this.velY = 0;
                    this.onGround = true;
                }
                // Collision from below
                else if (this.velY < 0 && this.y - this.velY >= plat.y + plat.h) {
                    this.y = plat.y + plat.h;
                    this.velY = 0;
                }
                // Collision from sides
                else if (this.velX > 0) {
                    this.x = plat.x - this.width;
                } else if (this.velX < 0) {
                    this.x = plat.x + plat.w;
                }
            }
        });

        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            this.velY = 0;
            this.onGround = true;
        }
    }

    collidesWith(rect) {
        return this.x < rect.x + rect.w &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.h &&
               this.y + this.height > rect.y;
    }

    collidesWithPool(pool) {
        // Check if feet are in the pool
        const feetY = this.y + this.height;
        return this.x + this.width > pool.x &&
               this.x < pool.x + pool.w &&
               feetY > pool.y &&
               feetY < pool.y + pool.h + 10;
    }

    jump() {
        if (this.onGround) {
            this.velY = JUMP_FORCE;
            this.onGround = false;
        }
    }

    draw() {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6, this.y + 10, 8, 8);
        ctx.fillRect(this.x + 16, this.y + 10, 8, 8);

        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 12, 4, 4);

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 5);
        ctx.shadowBlur = 0;
    }
}

// Initialize the game
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Event listeners
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartLevel);
    document.getElementById('next-level-button').addEventListener('click', nextLevel);
    document.getElementById('play-again-button').addEventListener('click', playAgain);

    // Set up speech recognition callback
    setCommandCallback(handleVoiceCommand);

    // Draw initial state
    drawStartScreen();
}

// Draw start screen
function drawStartScreen() {
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ff6b35';
    ctx.fillText('🔥 Fireboy', 180, 180);
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('💧 Watergirl', 320, 180);
}

// Start the game
function startGame() {
    document.getElementById('game-overlay').classList.add('hidden');
    currentLevel = 0;
    loadLevel(currentLevel);

    if (startListening()) {
        gameRunning = true;
        gameLoop();
    }
}

// Load a level
function loadLevel(levelIndex) {
    const level = levels[levelIndex];

    fireboy = new Character(level.fireStart.x, level.fireStart.y, '#ff6b35', 'fire');
    watergirl = new Character(level.waterStart.x, level.waterStart.y, '#4fc3f7', 'water');

    platforms = level.platforms.map(p => ({ ...p }));
    firePools = level.firePools.map(p => ({ ...p }));
    waterPools = level.waterPools.map(p => ({ ...p }));
    fireExit = { ...level.fireExit, w: 40, h: 40 };
    waterExit = { ...level.waterExit, w: 40, h: 40 };

    document.getElementById('level-value').textContent = levelIndex + 1;
}

// Restart current level
function restartLevel() {
    document.getElementById('game-over-overlay').classList.add('hidden');
    loadLevel(currentLevel);

    if (startListening()) {
        gameRunning = true;
        gameLoop();
    }
}

// Go to next level
function nextLevel() {
    document.getElementById('win-overlay').classList.add('hidden');
    currentLevel++;

    if (currentLevel >= levels.length) {
        // Game complete!
        document.getElementById('game-complete-overlay').classList.remove('hidden');
        return;
    }

    loadLevel(currentLevel);

    if (startListening()) {
        gameRunning = true;
        gameLoop();
    }
}

// Play again from start
function playAgain() {
    document.getElementById('game-complete-overlay').classList.add('hidden');
    currentLevel = 0;
    loadLevel(currentLevel);

    if (startListening()) {
        gameRunning = true;
        gameLoop();
    }
}

// Handle voice commands
function handleVoiceCommand(command) {
    if (!gameRunning) return;

    const { character, action } = command;

    let target = null;
    if (character === 'fire') {
        target = fireboy;
    } else if (character === 'water') {
        target = watergirl;
    }

    if (!target) return;

    switch (action) {
        case 'jump':
            target.jump();
            break;
        case 'left':
            target.movingLeft = true;
            target.movingRight = false;
            break;
        case 'right':
            target.movingRight = true;
            target.movingLeft = false;
            break;
        case 'stop':
            target.movingLeft = false;
            target.movingRight = false;
            break;
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;

    update();
    render();

    animationId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    fireboy.update();
    watergirl.update();

    // Check hazards
    // Fireboy dies in water
    for (const pool of waterPools) {
        if (fireboy.collidesWithPool(pool)) {
            gameOver('Fireboy fell in water!');
            return;
        }
    }

    // Watergirl dies in fire
    for (const pool of firePools) {
        if (watergirl.collidesWithPool(pool)) {
            gameOver('Watergirl fell in fire!');
            return;
        }
    }

    // Check exits
    fireboy.atExit = isAtExit(fireboy, fireExit);
    watergirl.atExit = isAtExit(watergirl, waterExit);

    // Win condition
    if (fireboy.atExit && watergirl.atExit) {
        levelComplete();
    }
}

// Check if character is at their exit
function isAtExit(char, exit) {
    return char.x + char.width > exit.x &&
           char.x < exit.x + exit.w &&
           char.y + char.height > exit.y &&
           char.y < exit.y + exit.h;
}

// Render the game
function render() {
    // Clear
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw exits (behind everything)
    drawExit(fireExit, '#ff6b35', '🚪');
    drawExit(waterExit, '#4fc3f7', '🚪');

    // Draw platforms
    platforms.forEach(plat => {
        ctx.fillStyle = '#5c5c7a';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = '#7a7a9a';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    });

    // Draw fire pools
    firePools.forEach(pool => {
        ctx.fillStyle = '#ff4500';
        ctx.fillRect(pool.x, pool.y, pool.w, pool.h);
        // Flame effect
        for (let i = 0; i < pool.w; i += 10) {
            const flameHeight = 5 + Math.sin(Date.now() / 100 + i) * 3;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.moveTo(pool.x + i, pool.y);
            ctx.lineTo(pool.x + i + 5, pool.y - flameHeight);
            ctx.lineTo(pool.x + i + 10, pool.y);
            ctx.fill();
        }
    });

    // Draw water pools
    waterPools.forEach(pool => {
        ctx.fillStyle = '#0077be';
        ctx.fillRect(pool.x, pool.y, pool.w, pool.h);
        // Wave effect
        ctx.fillStyle = '#4fc3f7';
        for (let i = 0; i < pool.w; i += 15) {
            const waveY = Math.sin(Date.now() / 200 + i / 10) * 2;
            ctx.beginPath();
            ctx.arc(pool.x + i + 7, pool.y + waveY, 4, 0, Math.PI, true);
            ctx.fill();
        }
    });

    // Draw characters
    fireboy.draw();
    watergirl.draw();

    // Draw exit indicators if character is at exit
    if (fireboy.atExit) {
        drawCheckmark(fireExit);
    }
    if (watergirl.atExit) {
        drawCheckmark(waterExit);
    }
}

// Draw exit door
function drawExit(exit, color, emoji) {
    ctx.fillStyle = color + '40'; // Semi-transparent
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);

    // Door icon
    ctx.font = '24px Arial';
    ctx.fillText(emoji, exit.x + 8, exit.y + 30);
}

// Draw checkmark on exit
function drawCheckmark(exit) {
    ctx.fillStyle = '#4caf50';
    ctx.font = '20px Arial';
    ctx.fillText('✓', exit.x + exit.w - 20, exit.y + 15);
}

// Game over
function gameOver(reason) {
    gameRunning = false;
    stopListening();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    document.getElementById('game-over-reason').textContent = reason;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// Level complete
function levelComplete() {
    gameRunning = false;
    stopListening();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    document.getElementById('win-overlay').classList.remove('hidden');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
