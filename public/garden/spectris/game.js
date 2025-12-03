// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;

// Get colors from CSS variables
function getColorsFromCSS() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    return [
        computedStyle.getPropertyValue('--block-red').trim(),
        computedStyle.getPropertyValue('--block-yellow').trim(),
        computedStyle.getPropertyValue('--block-cyan').trim(),
        computedStyle.getPropertyValue('--block-green').trim(),
        computedStyle.getPropertyValue('--block-purple').trim()
    ];
}

// Color palettes - now read from CSS
const COLOR_PALETTES = {
    dungeon: getColorsFromCSS,
    pudding: getColorsFromCSS  // Both use same CSS vars, which change based on body class
};

// Settings state
let settings = {
    ghostMode: 'easy',  // 'easy' shows colors, 'hard' shows gray
    colorMode: 'hard',   // 'easy' = 3 colors, 'medium' = 4 colors, 'hard' = 5 colors
    palette: 'dungeon'  // 'dungeon' or 'pudding'
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('tetraSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('tetraSettings', JSON.stringify(settings));
}

// Get active colors based on difficulty and palette
function getActiveColors() {
    const paletteFunc = COLOR_PALETTES[settings.palette] || COLOR_PALETTES.dungeon;
    const palette = paletteFunc();  // Call function to get colors from CSS

    switch(settings.colorMode) {
        case 'easy':
            return palette.slice(0, 3);  // First 3 colors
        case 'medium':
            return palette.slice(0, 4);  // First 4 colors
        case 'hard':
        default:
            return palette;  // All 5 colors
    }
}

// Active colors for current game
let COLORS = getActiveColors();

// Tetris shapes (using standard tetromino patterns)
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]] // L
];

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let currentX = 0;
let currentY = 0;
let score = 0;
let level = 1;
let clearedGroups = 0;
let gameOver = false;
let isPaused = false;
let dropInterval = 1000;
let lastDropTime = 0;
let isAnimating = false;
let animationBlocks = [];
let particleEffects = [];

// Lock delay mechanics
let lockDelayActive = false;
let lockDelayTimer = 0;
const LOCK_DELAY_TIME = 500; // 500ms grace period
let lockDelayMoves = 0;
const MAX_LOCK_DELAY_MOVES = 15; // Maximum moves during lock delay

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Initialize board
function initBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = null;
        }
    }
}

// Generate random color
function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Create a new piece with random colors for each block
function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    const coloredShape = [];

    for (let row = 0; row < shape.length; row++) {
        coloredShape[row] = [];
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                coloredShape[row][col] = randomColor();
            } else {
                coloredShape[row][col] = null;
            }
        }
    }

    return coloredShape;
}

// Check if position is valid
function isValidPosition(piece, x, y) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const newX = x + col;
                const newY = y + row;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Rotate piece
function rotatePiece(piece) {
    const rows = piece.length;
    const cols = piece[0].length;
    const rotated = [];

    for (let col = 0; col < cols; col++) {
        rotated[col] = [];
        for (let row = rows - 1; row >= 0; row--) {
            rotated[col][rows - 1 - row] = piece[row][col];
        }
    }

    return rotated;
}

// Calculate ghost piece position (where it will land)
function getGhostY() {
    let ghostY = currentY;
    while (isValidPosition(currentPiece, currentX, ghostY + 1)) {
        ghostY++;
    }
    return ghostY;
}

// Merge piece into board
function mergePiece() {
    for (let row = 0; row < currentPiece.length; row++) {
        for (let col = 0; col < currentPiece[row].length; col++) {
            if (currentPiece[row][col]) {
                const boardY = currentY + row;
                const boardX = currentX + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece[row][col];
                }
            }
        }
    }
}

// Create particle effect
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particleEffects.push({
            x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
            y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 6 + 2,
            color: color,
            alpha: 1,
            life: 30
        });
    }
}

// Update particles
function updateParticles() {
    particleEffects = particleEffects.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // gravity
        particle.life--;
        particle.alpha = particle.life / 30;
        return particle.life > 0;
    });
}

// Draw particles
function drawParticles() {
    particleEffects.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
        ctx.restore();
    });
}

// Flood fill to find connected blocks of the same color
function floodFill(row, col, color, visited) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return [];
    if (visited[row][col]) return [];
    if (board[row][col] !== color) return [];

    visited[row][col] = true;
    let connected = [[row, col]];

    // Check all 4 orthogonal directions
    connected = connected.concat(floodFill(row - 1, col, color, visited));
    connected = connected.concat(floodFill(row + 1, col, color, visited));
    connected = connected.concat(floodFill(row, col - 1, color, visited));
    connected = connected.concat(floodFill(row, col + 1, color, visited));

    return connected;
}

// Find and clear groups of 4+ same-colored blocks with animation
async function clearColorGroups() {
    const visited = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
    let totalCleared = 0;

    do {
        let anyCleared = false;
        visited.forEach(row => row.fill(false));
        let groupsToClear = [];

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (board[row][col] && !visited[row][col]) {
                    const group = floodFill(row, col, board[row][col], visited);

                    if (group.length >= 4) {
                        groupsToClear.push(group);
                        totalCleared += group.length;
                        anyCleared = true;
                    }
                }
            }
        }

        if (anyCleared) {
            // Animate clearing
            await animateClearBlocks(groupsToClear);

            // Actually clear the blocks
            groupsToClear.forEach(group => {
                group.forEach(([r, c]) => {
                    createParticles(c, r, board[r][c]);
                    board[r][c] = null;
                });
            });

            // Animate gravity
            await animateGravity();

            // Update level based on cleared groups (slower progression)
            clearedGroups++;
            if (clearedGroups >= level * 8) {
                level++;
                // Slower speed increase: reduce by 50ms per level instead of 100ms
                dropInterval = Math.max(200, 1000 - (level - 1) * 50);
                document.getElementById('level').textContent = level;
            }
        } else {
            break;
        }
    } while (true);

    if (totalCleared > 0) {
        score += totalCleared * 10 * level;
        updateScore();
    }
}

// Animate clearing blocks
function animateClearBlocks(groupsToClear) {
    return new Promise(resolve => {
        isAnimating = true;
        animationBlocks = [];

        groupsToClear.forEach(group => {
            group.forEach(([row, col]) => {
                animationBlocks.push({
                    row, col,
                    color: board[row][col],
                    scale: 1,
                    alpha: 1,
                    glow: 0,
                    type: 'clear'
                });
            });
        });

        const startTime = performance.now();
        const duration = 400;

        function animate(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            animationBlocks.forEach(block => {
                if (block.type === 'clear') {
                    block.scale = 1 + progress * 0.5;
                    block.alpha = 1 - progress;
                    block.glow = progress * 20;
                }
            });

            drawBoard();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                animationBlocks = [];
                isAnimating = false;
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}

// Animate gravity
function animateGravity() {
    return new Promise(resolve => {
        isAnimating = true;
        const fallMap = [];

        // Calculate how far each block needs to fall
        for (let col = 0; col < COLS; col++) {
            let emptySpaces = 0;
            for (let row = ROWS - 1; row >= 0; row--) {
                if (board[row][col] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    fallMap.push({
                        fromRow: row,
                        toRow: row + emptySpaces,
                        col: col,
                        color: board[row][col]
                    });
                }
            }
        }

        if (fallMap.length === 0) {
            isAnimating = false;
            resolve();
            return;
        }

        animationBlocks = fallMap.map(item => ({
            row: item.fromRow,
            col: item.col,
            color: item.color,
            targetRow: item.toRow,
            progress: 0,
            type: 'fall'
        }));

        // Clear blocks that will fall
        fallMap.forEach(item => {
            board[item.fromRow][item.col] = null;
        });

        const startTime = performance.now();
        const duration = 300;

        function animate(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function for more realistic fall
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            animationBlocks.forEach(block => {
                if (block.type === 'fall') {
                    block.progress = easeProgress;
                }
            });

            drawBoard();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Apply final positions
                animationBlocks.forEach(block => {
                    if (block.type === 'fall') {
                        board[block.targetRow][block.col] = block.color;
                    }
                });
                animationBlocks = [];
                isAnimating = false;
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}

// Apply gravity to make blocks fall
function applyGravity() {
    for (let col = 0; col < COLS; col++) {
        let writePos = ROWS - 1;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col]) {
                if (row !== writePos) {
                    board[writePos][col] = board[row][col];
                    board[row][col] = null;
                }
                writePos--;
            }
        }
    }
}

// Spawn new piece
function spawnPiece() {
    if (!nextPiece) {
        nextPiece = createPiece();
    }

    currentPiece = nextPiece;
    nextPiece = createPiece();
    currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    canHold = true;
    
    // Reset lock delay
    lockDelayActive = false;
    lockDelayMoves = 0;

    if (!isValidPosition(currentPiece, currentX, currentY)) {
        gameOver = true;
        showGameOver();
    }

    drawPreview();
}

// Hold current piece
function holdCurrentPiece() {
    if (gameOver || isPaused || isAnimating || !canHold) return;

    // Reset lock delay when holding
    lockDelayActive = false;
    lockDelayMoves = 0;

    if (holdPiece === null) {
        // First time holding
        holdPiece = currentPiece;
        spawnPiece();
    } else {
        // Swap with held piece
        const temp = currentPiece;
        currentPiece = holdPiece;
        holdPiece = temp;

        // Reset position
        currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
        currentY = 0;

        if (!isValidPosition(currentPiece, currentX, currentY)) {
            gameOver = true;
            showGameOver();
        }
    }

    canHold = false;
    drawHold();
}

// Move piece
function movePiece(dx, dy) {
    if (gameOver || isPaused) return false;

    if (isValidPosition(currentPiece, currentX + dx, currentY + dy)) {
        currentX += dx;
        currentY += dy;
        
        // If we're in lock delay and moved horizontally (not vertically)
        if (lockDelayActive && dx !== 0) {
            lockDelayMoves++;
            // Reset the lock delay timer on successful horizontal move
            lockDelayTimer = Date.now();
            
            // If we moved off the ground, cancel lock delay
            if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                lockDelayActive = false;
                lockDelayMoves = 0;
            }
            
            // If we've exceeded maximum moves, force lock
            if (lockDelayMoves >= MAX_LOCK_DELAY_MOVES) {
                lockDelayActive = false;
                lockDelayMoves = 0;
                mergePiece();
                clearColorGroups().then(() => {
                    spawnPiece();
                    lastDropTime = performance.now();
                });
            }
        }
        
        return true;
    }
    return false;
}

// Drop piece
async function dropPiece() {
    if (gameOver || isPaused || isAnimating) return;

    // Check if piece can drop further
    if (!isValidPosition(currentPiece, currentX, currentY + 1)) {
        // If lock delay hasn't started yet, start it
        if (!lockDelayActive) {
            lockDelayActive = true;
            lockDelayTimer = Date.now();
            lockDelayMoves = 0;
            return; // Don't lock immediately, wait for grace period
        }
        
        // If we reach here in lock delay, it means time expired
        // This is handled by the game loop
    } else {
        // Piece can still fall
        currentY++;
        lockDelayActive = false;
        lockDelayMoves = 0;
    }
}

// Hard drop
async function hardDrop() {
    if (gameOver || isPaused || isAnimating) return;

    // Move piece to bottom
    while (isValidPosition(currentPiece, currentX, currentY + 1)) {
        currentY++;
    }
    
    // Immediately lock without delay
    lockDelayActive = false;
    lockDelayMoves = 0;
    mergePiece();
    await clearColorGroups();
    spawnPiece();
    lastDropTime = performance.now(); // Reset drop timer after hard drop
}

// Rotate current piece with wall kicks
function rotate() {
    if (gameOver || isPaused) return;

    const rotated = rotatePiece(currentPiece);

    // Wall kick tests - try different positions
    // Basic SRS (Super Rotation System) wall kicks
    const wallKicks = [
        [0, 0],   // No kick (original position)
        [-1, 0],  // Left
        [1, 0],   // Right
        [-2, 0],  // Left 2
        [2, 0],   // Right 2
        [0, -1],  // Up
        [-1, -1], // Left + Up
        [1, -1],  // Right + Up
        [0, 1],   // Down (for I-piece on floor)
    ];

    let rotationSucceeded = false;

    // Try each wall kick position
    for (const [dx, dy] of wallKicks) {
        if (isValidPosition(rotated, currentX + dx, currentY + dy)) {
            currentX += dx;
            currentY += dy;
            currentPiece = rotated;
            rotationSucceeded = true;
            break;
        }
    }

    if (rotationSucceeded) {
        // Handle lock delay similar to movement
        if (lockDelayActive) {
            lockDelayMoves++;
            lockDelayTimer = Date.now();

            // If we can still drop after rotating, cancel lock delay
            if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                lockDelayActive = false;
                lockDelayMoves = 0;
            }

            // If we've exceeded maximum moves, force lock
            if (lockDelayMoves >= MAX_LOCK_DELAY_MOVES) {
                lockDelayActive = false;
                lockDelayMoves = 0;
                mergePiece();
                clearColorGroups().then(() => {
                    spawnPiece();
                    lastDropTime = performance.now();
                });
            }
        }
    }
}

// Draw a single block with enhanced pixelated visuals
function drawBlock(ctx, x, y, color, size = BLOCK_SIZE, alpha = 1, scale = 1, glow = 0, isGhost = false) {
    ctx.save();
    
    const centerX = x * size + size / 2;
    const centerY = y * size + size / 2;
    const actualSize = size * scale;
    
    // Set transparency based on whether it's a ghost block
    ctx.globalAlpha = isGhost ? 0.35 : alpha;
    
    // Glow effect
    if (glow > 0 && !isGhost) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
    }
    
    // Main block with pixel art style (same for both ghost and regular)
    const pixelSize = 2;
    
    // Main block color - use gray for ghost pieces in hard mode
    const blockColor = (isGhost && settings.ghostMode === 'hard') ? '#6a6a7a' : color;
    ctx.fillStyle = blockColor;
    ctx.fillRect(
        centerX - actualSize / 2,
        centerY - actualSize / 2,
        actualSize,
        actualSize
    );
    
    // Dark border (outer)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    // Top and left borders
    ctx.fillRect(centerX - actualSize / 2, centerY - actualSize / 2, actualSize, pixelSize);
    ctx.fillRect(centerX - actualSize / 2, centerY - actualSize / 2, pixelSize, actualSize);
    // Bottom and right borders
    ctx.fillRect(centerX - actualSize / 2, centerY + actualSize / 2 - pixelSize, actualSize, pixelSize);
    ctx.fillRect(centerX + actualSize / 2 - pixelSize, centerY - actualSize / 2, pixelSize, actualSize);
    
    // Light inner border for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(
        centerX - actualSize / 2 + pixelSize,
        centerY - actualSize / 2 + pixelSize,
        actualSize - pixelSize * 2,
        pixelSize
    );
    ctx.fillRect(
        centerX - actualSize / 2 + pixelSize,
        centerY - actualSize / 2 + pixelSize,
        pixelSize,
        actualSize - pixelSize * 2
    );
    
    // Highlight pixels (top-left corner)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(
        centerX - actualSize / 2 + pixelSize * 2,
        centerY - actualSize / 2 + pixelSize * 2,
        pixelSize * 2,
        pixelSize * 2
    );
    
    // Shadow pixels (bottom-right inner)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(
        centerX + actualSize / 2 - pixelSize * 4,
        centerY + actualSize / 2 - pixelSize * 4,
        pixelSize * 2,
        pixelSize * 2
    );
    
    // Center shine for extra cuteness (less prominent on ghost)
    ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
        centerX - pixelSize,
        centerY - pixelSize,
        pixelSize * 2,
        pixelSize * 2
    );
    
    ctx.restore();
}

// Draw the game board
function drawBoard() {
    // Clear with theme-appropriate background
    if (settings.palette === 'pudding') {
        ctx.fillStyle = '#fffaf5';
    } else {
        ctx.fillStyle = '#000';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle background pattern
    if (settings.palette === 'pudding') {
        ctx.fillStyle = 'rgba(245, 215, 196, 0.08)';
    } else {
        ctx.fillStyle = 'rgba(122, 58, 170, 0.02)';
    }
    for (let i = 0; i < ROWS; i++) {
        if (i % 2 === 0) {
            ctx.fillRect(0, i * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
        }
    }

    // Draw placed blocks
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }

    // Draw ghost piece (preview of where piece will land)
    if (currentPiece && !isAnimating) {
        const ghostY = getGhostY();
        if (ghostY !== currentY) {
            for (let row = 0; row < currentPiece.length; row++) {
                for (let col = 0; col < currentPiece[row].length; col++) {
                    if (currentPiece[row][col]) {
                        const x = currentX + col;
                        const y = ghostY + row;
                        if (y >= 0) {
                            // Draw ghost block with special style
                            drawBlock(ctx, x, y, currentPiece[row][col], BLOCK_SIZE, 1, 1, 0, true);
                        }
                    }
                }
            }
        }
    }

    // Draw animation blocks
    if (isAnimating && animationBlocks.length > 0) {
        animationBlocks.forEach(block => {
            if (block.type === 'clear') {
                drawBlock(ctx, block.col, block.row, block.color, BLOCK_SIZE, block.alpha, block.scale, block.glow);
            } else if (block.type === 'fall') {
                const startRow = block.row;
                const distance = block.targetRow - block.row;
                const currentRow = startRow + (distance * block.progress);
                drawBlock(ctx, block.col, currentRow, block.color);
            }
        });
    }

    // Draw current piece
    if (currentPiece && !isAnimating) {
        for (let row = 0; row < currentPiece.length; row++) {
            for (let col = 0; col < currentPiece[row].length; col++) {
                if (currentPiece[row][col]) {
                    const x = currentX + col;
                    const y = currentY + row;
                    if (y >= 0) {
                        // Add slight pulse effect during lock delay
                        if (lockDelayActive) {
                            const elapsedTime = Date.now() - lockDelayTimer;
                            const remainingTime = LOCK_DELAY_TIME - elapsedTime;
                            // Faster pulse as time runs out
                            const pulseSpeed = remainingTime < 200 ? 0.02 : 0.01;
                            const pulseIntensity = Math.sin(elapsedTime * pulseSpeed) * 0.15 + 0.85;
                            drawBlock(ctx, x, y, currentPiece[row][col], BLOCK_SIZE, pulseIntensity);
                        } else {
                            drawBlock(ctx, x, y, currentPiece[row][col]);
                        }
                    }
                }
            }
        }
    }

    // Draw particles
    updateParticles();
    drawParticles();

    // Draw subtle grid
    if (settings.palette === 'pudding') {
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)';
    } else {
        ctx.strokeStyle = 'rgba(122, 58, 170, 0.1)';
    }
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Add pause effect overlay
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Draw preview of next piece
function drawPreview() {
    if (settings.palette === 'pudding') {
        previewCtx.fillStyle = '#fffaf5';
    } else {
        previewCtx.fillStyle = '#000';
    }
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (nextPiece) {
        const blockSize = 22;
        const offsetX = (previewCanvas.width - nextPiece[0].length * blockSize) / 2;
        const offsetY = (previewCanvas.height - nextPiece.length * blockSize) / 2;

        for (let row = 0; row < nextPiece.length; row++) {
            for (let col = 0; col < nextPiece[row].length; col++) {
                if (nextPiece[row][col]) {
                    const x = offsetX / blockSize + col;
                    const y = offsetY / blockSize + row;
                    drawBlock(previewCtx, x, y, nextPiece[row][col], blockSize);
                }
            }
        }
    }
}

// Draw hold piece
function drawHold() {
    if (settings.palette === 'pudding') {
        holdCtx.fillStyle = '#fffaf5';
    } else {
        holdCtx.fillStyle = '#000';
    }
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (holdPiece) {
        const blockSize = 22;
        const offsetX = (holdCanvas.width - holdPiece[0].length * blockSize) / 2;
        const offsetY = (holdCanvas.height - holdPiece.length * blockSize) / 2;

        for (let row = 0; row < holdPiece.length; row++) {
            for (let col = 0; col < holdPiece[row].length; col++) {
                if (holdPiece[row][col]) {
                    const x = offsetX / blockSize + col;
                    const y = offsetY / blockSize + row;
                    drawBlock(holdCtx, x, y, holdPiece[row][col], blockSize, canHold ? 1 : 0.3);
                }
            }
        }
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Show game over screen
function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOver').classList.add('show');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    // Check if settings modal is open
    const settingsModal = document.getElementById('settingsModal');
    const settingsOpen = settingsModal.classList.contains('show');
    
    // If settings are open, only handle escape to close
    if (settingsOpen) {
        if (e.key === 'Escape') {
            settingsModal.classList.remove('show');
            isPaused = false;
            e.preventDefault();
        }
        return;
    }

    switch(e.key) {
        case 'ArrowLeft':
            if (!isPaused) movePiece(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (!isPaused) movePiece(1, 0);
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (!isPaused) {
                // Soft drop
                if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                    currentY++;
                    lockDelayActive = false;
                    lockDelayMoves = 0;
                } else {
                    // At the bottom - if in lock delay, force immediate lock
                    if (lockDelayActive) {
                        lockDelayActive = false;
                        lockDelayMoves = 0;
                        mergePiece();
                        clearColorGroups().then(() => {
                            spawnPiece();
                            lastDropTime = performance.now();
                        });
                    }
                    // Otherwise let normal drop handle it
                }
            }
            e.preventDefault();
            break;
        case 'ArrowUp':
            if (!isPaused) rotate();
            e.preventDefault();
            break;
        case ' ':
            if (!isPaused) hardDrop();
            e.preventDefault();
            break;
        case 'c':
        case 'C':
            if (!isPaused) holdCurrentPiece();
            e.preventDefault();
            break;
        case 'p':
        case 'P':
            isPaused = !isPaused;
            const pauseOverlay = document.getElementById('pauseOverlay');
            const gameContainer = document.getElementById('gameContainer');
            if (isPaused) {
                pauseOverlay.classList.add('show');
                gameContainer.classList.add('paused');
            } else {
                pauseOverlay.classList.remove('show');
                gameContainer.classList.remove('paused');
            }
            e.preventDefault();
            break;
        case 's':
        case 'S':
            // Open settings
            document.getElementById('settingsModal').classList.add('show');
            isPaused = true;
            // Remove pause overlay if it was showing
            document.getElementById('pauseOverlay').classList.remove('show');
            document.getElementById('gameContainer').classList.remove('paused');
            updateSettingsUI();
            e.preventDefault();
            break;
        case 'Escape':
            // Close pause if open
            if (isPaused) {
                isPaused = false;
                document.getElementById('pauseOverlay').classList.remove('show');
                document.getElementById('gameContainer').classList.remove('paused');
            }
            e.preventDefault();
            break;
    }

    if (!isPaused) {
        drawBoard();
        drawHold();
    }
});

// Game loop
function gameLoop(timestamp) {
    if (!gameOver) {
        // Handle automatic dropping
        if (!isPaused && !isAnimating) {
            // Check lock delay timeout
            if (lockDelayActive && Date.now() - lockDelayTimer >= LOCK_DELAY_TIME) {
                lockDelayActive = false;
                lockDelayMoves = 0;
                mergePiece();
                clearColorGroups().then(() => {
                    spawnPiece();
                    lastDropTime = timestamp; // Reset drop timer after locking
                });
            }
            // Normal drop interval
            else if (!lockDelayActive && timestamp - lastDropTime > dropInterval) {
                dropPiece();
                lastDropTime = timestamp;
            }
        }

        drawBoard();
        requestAnimationFrame(gameLoop);
    }
}

// Initialize settings UI
function initSettingsUI() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const gameContainer = document.getElementById('gameContainer');
    
    // Open settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
        updateSettingsUI();
        // Pause game when settings open but don't show pause overlay
        isPaused = true;
        pauseOverlay.classList.remove('show');
        gameContainer.classList.remove('paused');
    });
    
    // Close settings
    closeBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
        // Unpause game when settings close
        isPaused = false;
    });
    
    // Close on background click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
            isPaused = false;
        }
    });
    
    // Handle toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const setting = btn.dataset.setting;
            const value = btn.dataset.value;

            // Check if this will change game-affecting settings
            const willRestartGame = (setting === 'colorMode' || setting === 'palette') &&
                                   settings[setting] !== value;

            // Update setting
            settings[setting] = value;
            saveSettings();

            // Update colors if color mode or palette changed
            if (setting === 'colorMode' || setting === 'palette') {
                COLORS = getActiveColors();
                updateDifficultyDisplay();

                // Update theme
                if (setting === 'palette') {
                    updateTheme();
                }

                // Restart the game with new settings
                if (willRestartGame) {
                    restartGame();
                }
            }

            // Update UI
            updateSettingsUI();

            // Redraw to show changes immediately
            drawBoard();
        });
    });

    // Pause settings button
    const pauseSettingsBtn = document.getElementById('pauseSettingsBtn');
    if (pauseSettingsBtn) {
        pauseSettingsBtn.addEventListener('click', () => {
            pauseOverlay.classList.remove('show');
            gameContainer.classList.remove('paused');
            settingsModal.classList.add('show');
            updateSettingsUI();
        });
    }
    
    // Initialize UI state
    updateSettingsUI();
    updateDifficultyDisplay();
}

// Update difficulty display
function updateDifficultyDisplay() {
    const difficultyElement = document.getElementById('colorDifficulty');
    if (difficultyElement) {
        difficultyElement.textContent = settings.colorMode.toUpperCase();
    }
}

// Update theme class on body
function updateTheme() {
    if (settings.palette === 'pudding') {
        document.body.classList.add('pudding-theme');
    } else {
        document.body.classList.remove('pudding-theme');
    }
}

// Update settings UI to reflect current settings
function updateSettingsUI() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        const setting = btn.dataset.setting;
        const value = btn.dataset.value;
        
        if (settings[setting] === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Restart game with current settings
function restartGame() {
    // Reset game state
    board = [];
    currentPiece = null;
    nextPiece = null;
    holdPiece = null;
    canHold = true;
    currentX = 0;
    currentY = 0;
    score = 0;
    level = 1;
    clearedGroups = 0;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    lastDropTime = 0;
    isAnimating = false;
    animationBlocks = [];
    particleEffects = [];
    lockDelayActive = false;
    lockDelayTimer = 0;
    lockDelayMoves = 0;

    // Update colors
    COLORS = getActiveColors();

    // Reinitialize
    initBoard();
    spawnPiece();
    updateScore();
    document.getElementById('level').textContent = level;
    updateDifficultyDisplay();
    drawBoard();
    drawHold();
    lastDropTime = performance.now();

    // Close settings modal
    document.getElementById('settingsModal').classList.remove('show');
    isPaused = false;
}

// Initialize game
function init() {
    // Load saved settings
    loadSettings();
    COLORS = getActiveColors();
    updateTheme(); // Apply saved theme

    initBoard();
    spawnPiece();
    updateScore();
    document.getElementById('level').textContent = level;
    lastDropTime = performance.now();

    // Initialize settings UI
    initSettingsUI();

    requestAnimationFrame(gameLoop);
}

// Start the game
init();