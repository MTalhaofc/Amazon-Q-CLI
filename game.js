// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');
const playerForm = document.getElementById('playerForm');
const playerNameInput = document.getElementById('playerName');
const submitNameButton = document.getElementById('submitName');
const currentPlayerDisplay = document.getElementById('currentPlayer');
const highScoresList = document.getElementById('scoresList');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const playAgainButton = document.getElementById('playAgainButton');
const newPlayerButton = document.getElementById('newPlayerButton');
const gameOverScoresList = document.getElementById('gameOverScoresList');

// Game settings
const GAME_SPEED = 5;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const OBSTACLE_FREQUENCY = 0.02;
const POWER_UP_FREQUENCY = 0.005;
const MAX_HIGH_SCORES = 10;
const PROJECTILE_SPEED = 15;
const FIRE_COOLDOWN = 20; // frames between shots

// Game state
let gameRunning = false;
let score = 0;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let currentPlayer = "Guest";
let player;
let obstacles = [];
let powerUps = [];
let particles = [];
let projectiles = [];
let backgroundStars = [];
let gameSpeed = GAME_SPEED;
let fireCooldown = 0;

// Player class
class Player {
    constructor() {
        this.size = 30;
        this.x = 100;
        this.y = canvas.height - this.size - 50;
        this.velocityY = 0;
        this.isJumping = false;
        this.color = '#0ff';
        this.trailTimer = 0;
    }

    update() {
        // Apply gravity
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Floor collision
        if (this.y > canvas.height - this.size - 50) {
            this.y = canvas.height - this.size - 50;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Ceiling collision
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }

        // Create trail effect
        this.trailTimer++;
        if (this.trailTimer > 2) {
            this.trailTimer = 0;
            particles.push(new Particle(
                this.x + this.size / 2,
                this.y + this.size / 2,
                Math.random() * 5 + 2,
                this.color,
                { x: -2, y: (Math.random() - 0.5) * 2 }
            ));
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = JUMP_FORCE;
            this.isJumping = true;
            createJumpEffect();
        }
    }

    fire() {
        if (fireCooldown <= 0) {
            projectiles.push(new Projectile(
                this.x + this.size,
                this.y + this.size / 2,
                10,
                '#0ff'
            ));
            fireCooldown = FIRE_COOLDOWN;
            createFireEffect();
        }
    }
}

// Projectile class
class Projectile {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = PROJECTILE_SPEED;
    }

    update() {
        this.x += this.speed;
        
        // Create trail effect
        if (Math.random() > 0.5) {
            particles.push(new Particle(
                this.x,
                this.y,
                Math.random() * 3 + 1,
                this.color,
                { x: -3, y: (Math.random() - 0.5) * 2 }
            ));
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Obstacle class
class Obstacle {
    constructor() {
        this.size = Math.random() * 50 + 20;
        this.x = canvas.width;
        this.y = canvas.height - this.size - 50;
        this.color = '#f55';
        this.counted = false;
        this.health = 1; // Simple obstacles take 1 hit
    }

    update() {
        this.x -= gameSpeed;
        
        // Create trail effect
        if (Math.random() > 0.7) {
            particles.push(new Particle(
                this.x + this.size / 2,
                this.y + this.size / 2,
                Math.random() * 5 + 2,
                this.color,
                { x: -1, y: (Math.random() - 0.5) * 2 }
            ));
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
    }

    hit() {
        this.health--;
        createExplosion(this.x + this.size/2, this.y + this.size/2, this.color);
        return this.health <= 0;
    }
}

// Power-up class
class PowerUp {
    constructor() {
        this.size = 20;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 150) + 50;
        this.color = '#ff0';
        this.rotation = 0;
    }

    update() {
        this.x -= gameSpeed;
        this.rotation += 0.05;
        
        // Create sparkle effect
        if (Math.random() > 0.7) {
            particles.push(new Particle(
                this.x + this.size / 2,
                this.y + this.size / 2,
                Math.random() * 3 + 1,
                this.color,
                { 
                    x: (Math.random() - 0.5) * 2, 
                    y: (Math.random() - 0.5) * 2 
                }
            ));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, size, color, velocity) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += this.gravity * 0.2;
        this.alpha -= 0.02;
        this.size -= 0.1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Star class for background
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.x -= this.speed;
        if (this.x < 0) {
            this.x = canvas.width;
            this.y = Math.random() * canvas.height;
        }
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create jump effect
function createJumpEffect() {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(
            player.x + player.size / 2,
            player.y + player.size,
            Math.random() * 5 + 2,
            '#0ff',
            { 
                x: (Math.random() - 0.5) * 6, 
                y: Math.random() * 4 + 2 
            }
        ));
    }
}

// Create fire effect
function createFireEffect() {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            player.x + player.size,
            player.y + player.size / 2,
            Math.random() * 4 + 1,
            '#0ff',
            { 
                x: Math.random() * 5 + 3, 
                y: (Math.random() - 0.5) * 4
            }
        ));
    }
}

// Create explosion effect
function createExplosion(x, y, color) {
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
            x,
            y,
            Math.random() * 5 + 3,
            color,
            { 
                x: (Math.random() - 0.5) * 8, 
                y: (Math.random() - 0.5) * 8 
            }
        ));
    }
}

// Initialize background
function initBackground() {
    for (let i = 0; i < 100; i++) {
        backgroundStars.push(new Star());
    }
}

// Initialize game
function init() {
    player = new Player();
    obstacles = [];
    powerUps = [];
    particles = [];
    projectiles = [];
    score = 0;
    gameSpeed = GAME_SPEED;
    fireCooldown = 0;
    updateScore();
    initBackground();
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

// Update high scores list
function updateHighScoresList(targetList = highScoresList) {
    targetList.innerHTML = '';
    
    highScores.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        targetList.appendChild(listItem);
    });
}

// Save high score
function saveHighScore(playerName, score) {
    const newScore = { name: playerName, score: score, date: new Date().toISOString() };
    
    // Add to array and sort
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top scores
    if (highScores.length > MAX_HIGH_SCORES) {
        highScores = highScores.slice(0, MAX_HIGH_SCORES);
    }
    
    // Save to localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
    
    // Update display
    updateHighScoresList();
    updateHighScoresList(gameOverScoresList);
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.size > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.size > obj2.y
    );
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw background
    backgroundStars.forEach(star => {
        star.update();
        star.draw();
    });
    
    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Update fire cooldown
    if (fireCooldown > 0) {
        fireCooldown--;
    }
    
    // Update and draw player
    player.update();
    player.draw();
    
    // Generate obstacles
    if (Math.random() < OBSTACLE_FREQUENCY) {
        obstacles.push(new Obstacle());
    }
    
    // Generate power-ups
    if (Math.random() < POWER_UP_FREQUENCY) {
        powerUps.push(new PowerUp());
    }
    
    // Update and draw projectiles
    projectiles.forEach((projectile, pIndex) => {
        projectile.update();
        projectile.draw();
        
        // Check collision with obstacles
        obstacles.forEach((obstacle, oIndex) => {
            if (
                projectile.x - projectile.size/2 < obstacle.x + obstacle.size &&
                projectile.x + projectile.size/2 > obstacle.x &&
                projectile.y - projectile.size/2 < obstacle.y + obstacle.size &&
                projectile.y + projectile.size/2 > obstacle.y
            ) {
                // Remove projectile
                projectiles.splice(pIndex, 1);
                
                // Handle obstacle hit
                if (obstacle.hit()) {
                    // If obstacle is destroyed
                    if (!obstacle.counted) {
                        score += 2; // More points for shooting than jumping over
                        updateScore();
                    }
                    obstacles.splice(oIndex, 1);
                }
                return;
            }
        });
        
        // Remove off-screen projectiles
        if (projectile.x - projectile.size > canvas.width) {
            projectiles.splice(pIndex, 1);
        }
    });
    
    // Update and draw obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        
        // Check collision with player
        if (checkCollision(player, obstacle)) {
            gameOver();
        }
        
        // Score point when passing obstacle
        if (!obstacle.counted && obstacle.x + obstacle.size < player.x) {
            score++;
            obstacle.counted = true;
            updateScore();
            gameSpeed += 0.05;
        }
        
        // Remove off-screen obstacles
        if (obstacle.x + obstacle.size < 0) {
            obstacles.splice(index, 1);
        }
    });
    
    // Update and draw power-ups
    powerUps.forEach((powerUp, index) => {
        powerUp.update();
        powerUp.draw();
        
        // Check collision with player
        if (checkCollision(player, powerUp)) {
            // Power-up effect
            score += 10;
            updateScore();
            createExplosion(powerUp.x + powerUp.size/2, powerUp.y + powerUp.size/2, powerUp.color);
            powerUps.splice(index, 1);
        }
        
        // Remove off-screen power-ups
        if (powerUp.x + powerUp.size < 0) {
            powerUps.splice(index, 1);
        }
    });
    
    // Update and draw particles
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0 || particle.size <= 0) {
            particles.splice(index, 1);
        } else {
            particle.draw();
        }
    });
    
    // Draw controls info
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('↑ or W: Jump', 10, 20);
    ctx.fillText('Space: Fire', 10, 40);
    
    requestAnimationFrame(gameLoop);
}

// Game over function
function gameOver() {
    gameRunning = false;
    createExplosion(player.x + player.size/2, player.y + player.size/2, player.color);
    
    // Save score
    saveHighScore(currentPlayer, score);
    
    // Show game over screen
    finalScoreDisplay.textContent = `Your Score: ${score}`;
    gameOverScreen.style.display = 'block';
}

// Start game function
function startGame() {
    init();
    gameRunning = true;
    startButton.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameLoop();
}

// Submit player name
function submitPlayerName() {
    let name = playerNameInput.value.trim();
    if (name === '') {
        name = 'Guest';
    }
    
    currentPlayer = name;
    currentPlayerDisplay.textContent = name;
    
    // Hide form, show game
    playerForm.style.display = 'none';
    canvas.style.display = 'block';
    document.querySelector('.controls').style.display = 'flex';
    
    // Initialize game
    init();
}

// Show new player form
function showNewPlayerForm() {
    gameOverScreen.style.display = 'none';
    canvas.style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    playerForm.style.display = 'block';
    playerNameInput.value = '';
    playerNameInput.focus();
}

// Event listeners
startButton.addEventListener('click', startGame);
submitNameButton.addEventListener('click', submitPlayerName);
playAgainButton.addEventListener('click', startGame);
newPlayerButton.addEventListener('click', showNewPlayerForm);

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameRunning) {
            player.jump();
        } else if (canvas.style.display === 'block' && gameOverScreen.style.display !== 'block') {
            startGame();
        }
    }
    
    if (e.code === 'Space') {
        if (gameRunning) {
            player.fire();
            e.preventDefault(); // Prevent space from scrolling the page
        } else if (canvas.style.display === 'block' && gameOverScreen.style.display !== 'block') {
            startGame();
        }
    }
    
    // Submit name on Enter key
    if (e.code === 'Enter' && playerForm.style.display !== 'none') {
        submitPlayerName();
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        player.jump();
    } else if (gameOverScreen.style.display !== 'block') {
        startGame();
    }
});

// Initialize the game
window.onload = () => {
    // Load high scores
    updateHighScoresList();
    updateHighScoresList(gameOverScoresList);
};
