// Game Logic for Voice-Controlled Pacman

// Game constants
const CELL_SIZE = 20;
const GRID_SIZE = 20;
const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;

// Game state
let canvas, ctx;
let gameRunning = false;
let score = 0;
let direction = null;
let nextDirection = null;
let pacman = { x: 1, y: 1 };
let ghosts = [];
let dots = [];
let powerPellets = [];
let animationId = null;
let lastMoveTime = 0;
let moveInterval = 150; // ms between moves
let ghostMoveInterval = 200;
let lastGhostMoveTime = 0;
let pacmanMouthOpen = true;
let mouthAnimationTime = 0;

// Maze definition (0 = path, 1 = wall)
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Ghost colors
const ghostColors = ['#ff0000', '#00ffff', '#ffb8ff', '#ffb852'];

// Initialize the game
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Set up event listeners
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.getElementById('win-restart-button').addEventListener('click', restartGame);

    // Set up speech recognition callback
    setCommandCallback(handleVoiceCommand);

    // Draw initial state
    drawMaze();
}

// Start the game
function startGame() {
    document.getElementById('game-overlay').classList.add('hidden');
    document.getElementById('game-overlay').classList.remove('visible');

    resetGameState();

    if (startListening()) {
        gameRunning = true;
        lastMoveTime = performance.now();
        lastGhostMoveTime = performance.now();
        gameLoop();
    }
}

// Restart the game
function restartGame() {
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('win-overlay').classList.add('hidden');

    resetGameState();

    if (startListening()) {
        gameRunning = true;
        lastMoveTime = performance.now();
        lastGhostMoveTime = performance.now();
        gameLoop();
    }
}

// Reset game state
function resetGameState() {
    score = 0;
    direction = null;
    nextDirection = null;
    pacman = { x: 1, y: 1 };

    // Initialize ghosts
    ghosts = [
        { x: 9, y: 9, color: ghostColors[0], direction: 'up' },
        { x: 10, y: 9, color: ghostColors[1], direction: 'up' },
        { x: 9, y: 10, color: ghostColors[2], direction: 'down' },
        { x: 10, y: 10, color: ghostColors[3], direction: 'down' }
    ];

    // Initialize dots
    dots = [];
    powerPellets = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (maze[y][x] === 0) {
                // Don't place dots on pacman's starting position or ghost house
                if (!(x === 1 && y === 1) && !(x >= 8 && x <= 11 && y >= 9 && y <= 10)) {
                    // Power pellets in corners
                    if ((x === 1 && y === 1) || (x === 18 && y === 1) ||
                        (x === 1 && y === 18) || (x === 18 && y === 18)) {
                        powerPellets.push({ x, y });
                    } else {
                        dots.push({ x, y });
                    }
                }
            }
        }
    }

    // Add power pellets at corners (on valid paths)
    powerPellets = [
        { x: 1, y: 4 },
        { x: 18, y: 4 },
        { x: 1, y: 16 },
        { x: 18, y: 16 }
    ];

    updateScoreDisplay();
}

// Handle voice commands
function handleVoiceCommand(command) {
    if (!gameRunning) return;

    if (command === 'stop') {
        direction = null;
        nextDirection = null;
    } else {
        nextDirection = command;
    }
}

// Set direction (also called from speech.js)
function setDirection(dir) {
    if (dir === 'stop' || dir === null) {
        direction = null;
        nextDirection = null;
    } else {
        nextDirection = dir;
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    const now = timestamp || performance.now();

    // Update pacman position
    if (now - lastMoveTime >= moveInterval) {
        movePacman();
        lastMoveTime = now;
    }

    // Update ghost positions
    if (now - lastGhostMoveTime >= ghostMoveInterval) {
        moveGhosts();
        lastGhostMoveTime = now;
    }

    // Animate pacman mouth
    if (now - mouthAnimationTime >= 100) {
        pacmanMouthOpen = !pacmanMouthOpen;
        mouthAnimationTime = now;
    }

    // Check collisions
    if (checkGhostCollision()) {
        gameOver();
        return;
    }

    // Check win condition
    if (dots.length === 0) {
        winGame();
        return;
    }

    // Render
    render();

    animationId = requestAnimationFrame(gameLoop);
}

// Move pacman
function movePacman() {
    // Try to change to next direction if set
    if (nextDirection) {
        const nextPos = getNextPosition(pacman, nextDirection);
        if (!isWall(nextPos.x, nextPos.y)) {
            direction = nextDirection;
        }
    }

    if (!direction) return;

    const next = getNextPosition(pacman, direction);

    // Handle tunnel wrap-around
    if (next.x < 0) next.x = GRID_SIZE - 1;
    if (next.x >= GRID_SIZE) next.x = 0;

    if (!isWall(next.x, next.y)) {
        pacman = next;
        checkDotEaten();
        checkPowerPelletEaten();
    }
}

// Get next position based on direction
function getNextPosition(pos, dir) {
    const next = { x: pos.x, y: pos.y };
    switch (dir) {
        case 'up': next.y--; break;
        case 'down': next.y++; break;
        case 'left': next.x--; break;
        case 'right': next.x++; break;
    }
    return next;
}

// Check if position is a wall
function isWall(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        // Allow horizontal tunnel
        if (y === 10 && (x < 0 || x >= GRID_SIZE)) {
            return false;
        }
        return true;
    }
    return maze[y][x] === 1;
}

// Check if dot is eaten
function checkDotEaten() {
    const dotIndex = dots.findIndex(d => d.x === pacman.x && d.y === pacman.y);
    if (dotIndex !== -1) {
        dots.splice(dotIndex, 1);
        score += 10;
        updateScoreDisplay();
    }
}

// Check if power pellet is eaten
function checkPowerPelletEaten() {
    const pelletIndex = powerPellets.findIndex(p => p.x === pacman.x && p.y === pacman.y);
    if (pelletIndex !== -1) {
        powerPellets.splice(pelletIndex, 1);
        score += 50;
        updateScoreDisplay();
    }
}

// Move ghosts
function moveGhosts() {
    ghosts.forEach(ghost => {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = [];

        // Find valid directions
        directions.forEach(dir => {
            const next = getNextPosition(ghost, dir);
            if (!isWall(next.x, next.y) && next.x >= 0 && next.x < GRID_SIZE) {
                // Prefer not to reverse direction
                const opposite = getOppositeDirection(ghost.direction);
                if (dir !== opposite || validDirections.length === 0) {
                    validDirections.push(dir);
                }
            }
        });

        if (validDirections.length > 0) {
            // Simple AI: sometimes chase pacman, sometimes move randomly
            if (Math.random() < 0.3) {
                // Chase mode - pick direction that gets closer to pacman
                let bestDir = validDirections[0];
                let bestDist = Infinity;
                validDirections.forEach(dir => {
                    const next = getNextPosition(ghost, dir);
                    const dist = Math.abs(next.x - pacman.x) + Math.abs(next.y - pacman.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestDir = dir;
                    }
                });
                ghost.direction = bestDir;
            } else {
                // Random mode - but prefer continuing in same direction
                const filtered = validDirections.filter(d => d !== getOppositeDirection(ghost.direction));
                if (filtered.length > 0 && Math.random() < 0.7) {
                    ghost.direction = filtered[Math.floor(Math.random() * filtered.length)];
                } else {
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                }
            }

            const nextPos = getNextPosition(ghost, ghost.direction);
            ghost.x = nextPos.x;
            ghost.y = nextPos.y;
        }
    });
}

// Get opposite direction
function getOppositeDirection(dir) {
    switch (dir) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
        default: return null;
    }
}

// Check ghost collision
function checkGhostCollision() {
    return ghosts.some(ghost => ghost.x === pacman.x && ghost.y === pacman.y);
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('score-value').textContent = score;
}

// Render the game
function render() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawMaze();
    drawDots();
    drawPowerPellets();
    drawPacman();
    drawGhosts();
}

// Draw the maze
function drawMaze() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#1a237e';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                // Draw wall border
                ctx.strokeStyle = '#3f51b5';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            }
        }
    }
}

// Draw dots
function drawDots() {
    ctx.fillStyle = '#ffeb3b';
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(
            dot.x * CELL_SIZE + CELL_SIZE / 2,
            dot.y * CELL_SIZE + CELL_SIZE / 2,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

// Draw power pellets
function drawPowerPellets() {
    ctx.fillStyle = '#ffeb3b';
    powerPellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(
            pellet.x * CELL_SIZE + CELL_SIZE / 2,
            pellet.y * CELL_SIZE + CELL_SIZE / 2,
            6,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

// Draw pacman
function drawPacman() {
    const centerX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pacman.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();

    // Calculate mouth angle based on direction
    let startAngle = 0;
    switch (direction) {
        case 'right': startAngle = 0; break;
        case 'down': startAngle = Math.PI / 2; break;
        case 'left': startAngle = Math.PI; break;
        case 'up': startAngle = -Math.PI / 2; break;
        default: startAngle = 0;
    }

    const mouthAngle = pacmanMouthOpen ? 0.25 : 0.05;

    ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle + Math.PI * mouthAngle,
        startAngle - Math.PI * mouthAngle
    );
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();
}

// Draw ghosts
function drawGhosts() {
    ghosts.forEach(ghost => {
        const x = ghost.x * CELL_SIZE;
        const y = ghost.y * CELL_SIZE;
        const size = CELL_SIZE - 4;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        ctx.fillStyle = ghost.color;

        // Ghost body (rounded top, wavy bottom)
        ctx.beginPath();
        ctx.arc(centerX, centerY - 2, size / 2, Math.PI, 0, false);
        ctx.lineTo(centerX + size / 2, centerY + size / 2 - 2);

        // Wavy bottom
        const waveCount = 3;
        const waveWidth = size / waveCount;
        for (let i = 0; i < waveCount; i++) {
            const waveX = centerX + size / 2 - (i + 1) * waveWidth;
            ctx.quadraticCurveTo(
                waveX + waveWidth / 2,
                centerY + size / 2 + 3,
                waveX,
                centerY + size / 2 - 2
            );
        }

        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 3, centerY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Game over
function gameOver() {
    gameRunning = false;
    stopListening();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// Win game
function winGame() {
    gameRunning = false;
    stopListening();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    document.getElementById('win-score').textContent = score;
    document.getElementById('win-overlay').classList.remove('hidden');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
