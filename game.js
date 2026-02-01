// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Base dimensions (used for scaling)
const BASE_WIDTH = 400;
const BASE_HEIGHT = 600;

// Resize canvas to fit screen while maintaining aspect ratio
function resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const aspectRatio = BASE_WIDTH / BASE_HEIGHT;

    let newWidth = maxWidth;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    }

    // Cap at base dimensions for larger screens
    if (newWidth > BASE_WIDTH) {
        newWidth = BASE_WIDTH;
        newHeight = BASE_HEIGHT;
    }

    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

// Initial resize and listen for orientation/resize changes
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const restartBtn = document.getElementById('restartBtn');

// Game constants
const GRAVITY = 0.5;
const FLAP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const PIPE_SPAWN_INTERVAL = 1500;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let bestScore = localStorage.getItem('flappyBestScore') || 0;
let lastPipeSpawn = 0;

// Bird object
const bird = {
    x: 80,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    rotation: 0
};

// Pipes array
let pipes = [];

// Ground
const ground = {
    y: canvas.height - 80,
    height: 80
};

// Background elements
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 200 + 50,
        width: Math.random() * 60 + 40,
        speed: Math.random() * 0.5 + 0.2
    });
}

// Initialize best score display
bestScoreEl.textContent = bestScore;

// Reset game
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    lastPipeSpawn = 0;
    scoreDisplay.textContent = '0';
}

// Flap action
function flap() {
    if (gameState === 'start') {
        gameState = 'playing';
        startScreen.classList.add('hidden');
        resetGame();
    }

    if (gameState === 'playing') {
        bird.velocity = FLAP_STRENGTH;
    }
}

// Spawn pipe
function spawnPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - ground.height - PIPE_GAP - minHeight;
    const topHeight = Math.random() * maxHeight + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        passed: false
    });
}

// Check collision
function checkCollision() {
    // Ground and ceiling collision
    if (bird.y + bird.height > ground.y || bird.y < 0) {
        return true;
    }

    // Pipe collision
    for (const pipe of pipes) {
        // Check if bird is within pipe's x range
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + PIPE_WIDTH) {
            // Check if bird hits top or bottom pipe
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
                return true;
            }
        }
    }

    return false;
}

// Update game
function update(timestamp) {
    if (gameState !== 'playing') return;

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Bird rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

    // Spawn pipes
    if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastPipeSpawn = timestamp;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Score when passing pipe
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreDisplay.textContent = score;
        }

        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    // Update clouds
    for (const cloud of clouds) {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + cloud.width;
            cloud.y = Math.random() * 200 + 50;
        }
    }

    // Check collision
    if (checkCollision()) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameState = 'gameover';

    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore);
    }

    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    gameOverScreen.classList.remove('hidden');
}

// Draw bird
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);

    // Body
    ctx.fillStyle = '#f7dc6f';
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(12, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 3);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Draw pipes
function drawPipes() {
    for (const pipe of pipes) {
        // Pipe gradient
        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        gradient.addColorStop(0, '#27ae60');
        gradient.addColorStop(0.5, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');

        ctx.fillStyle = gradient;

        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

        // Top pipe cap
        ctx.fillStyle = '#229954';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, PIPE_WIDTH + 10, 30);

        // Bottom pipe
        ctx.fillStyle = gradient;
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY - ground.height);

        // Bottom pipe cap
        ctx.fillStyle = '#229954';
        ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 30);
    }
}

// Draw background
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87ceeb');
    skyGradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (const cloud of clouds) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 4, cloud.y - 10, cloud.width / 4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 2, cloud.y, cloud.width / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw ground
function drawGround() {
    // Grass
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, ground.y, canvas.width, 20);

    // Dirt
    ctx.fillStyle = '#c4a35a';
    ctx.fillRect(0, ground.y + 20, canvas.width, ground.height - 20);

    // Grass detail
    ctx.fillStyle = '#5a9e2f';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, ground.y + 20);
        ctx.lineTo(i + 10, ground.y);
        ctx.lineTo(i + 20, ground.y + 20);
        ctx.fill();
    }
}

// Main draw function
function draw() {
    drawBackground();
    drawPipes();
    drawGround();
    drawBird();
}

// Game loop
function gameLoop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners - Mouse/Click
canvas.addEventListener('click', flap);

// Event listeners - Touch (mobile)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
}, { passive: false });

// Event listeners - Keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    }
});

// Restart button - supports both click and touch
restartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
    resetGame();
});

restartBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
    resetGame();
}, { passive: false });

// Prevent default touch behaviors on game container
document.querySelector('.game-container').addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent spacebar scrolling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// Prevent context menu on long press
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Start the game loop
requestAnimationFrame(gameLoop);
