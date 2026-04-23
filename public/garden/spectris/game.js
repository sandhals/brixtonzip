const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;

function getColorsFromCSS() {
    const computedStyle = getComputedStyle(document.body);

    return [
        computedStyle.getPropertyValue('--block-red').trim(),
        computedStyle.getPropertyValue('--block-yellow').trim(),
        computedStyle.getPropertyValue('--block-cyan').trim(),
        computedStyle.getPropertyValue('--block-green').trim(),
        computedStyle.getPropertyValue('--block-purple').trim()
    ];
}

const COLOR_PALETTES = {
    dungeon: getColorsFromCSS,
    pudding: getColorsFromCSS  // Both use same CSS vars, which change based on body class
};

let settings = {
    ghostMode: 'easy',  // 'easy' shows colors, 'hard' shows gray
    colorMode: 'hard',   // 'easy' = 3 colors, 'medium' = 4 colors, 'hard' = 5 colors
    palette: 'dungeon'  // 'dungeon' or 'pudding'
};

function loadSettings() {
    const saved = localStorage.getItem('tetraSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
}

function saveSettings() {
    localStorage.setItem('tetraSettings', JSON.stringify(settings));
}

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

let COLORS = getActiveColors();

const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]] // L
];

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

let lockDelayActive = false;
let lockDelayTimer = 0;
const LOCK_DELAY_TIME = 500; // 500ms grace period
let lockDelayMoves = 0;
const MAX_LOCK_DELAY_MOVES = 15; // Maximum moves during lock delay

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

function initBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = null;
        }
    }
}

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

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

function getGhostY() {
    let ghostY = currentY;
    while (isValidPosition(currentPiece, currentX, ghostY + 1)) {
        ghostY++;
    }
    return ghostY;
}

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

function floodFill(row, col, color, visited) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return [];
    if (visited[row][col]) return [];
    if (board[row][col] !== color) return [];

    visited[row][col] = true;
    let connected = [[row, col]];

    connected = connected.concat(floodFill(row - 1, col, color, visited));
    connected = connected.concat(floodFill(row + 1, col, color, visited));
    connected = connected.concat(floodFill(row, col - 1, color, visited));
    connected = connected.concat(floodFill(row, col + 1, color, visited));

    return connected;
}

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
            await animateClearBlocks(groupsToClear);

            groupsToClear.forEach(group => {
                group.forEach(([r, c]) => {
                    createParticles(c, r, board[r][c]);
                    board[r][c] = null;
                });
            });

            await animateGravity();

            clearedGroups++;
            if (clearedGroups >= level * 8) {
                level++;
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

function animateGravity() {
    return new Promise(resolve => {
        isAnimating = true;
        const fallMap = [];

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

        fallMap.forEach(item => {
            board[item.fromRow][item.col] = null;
        });

        const startTime = performance.now();
        const duration = 300;

        function animate(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
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

function spawnPiece() {
    if (!nextPiece) {
        nextPiece = createPiece();
    }

    currentPiece = nextPiece;
    nextPiece = createPiece();
    currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    canHold = true;
    
    lockDelayActive = false;
    lockDelayMoves = 0;

    if (!isValidPosition(currentPiece, currentX, currentY)) {
        gameOver = true;
        showGameOver();
    }

    drawPreview();
}

function holdCurrentPiece() {
    if (gameOver || isPaused || isAnimating || !canHold) return;

    lockDelayActive = false;
    lockDelayMoves = 0;

    if (holdPiece === null) {
        holdPiece = currentPiece;
        spawnPiece();
    } else {
        const temp = currentPiece;
        currentPiece = holdPiece;
        holdPiece = temp;

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

function movePiece(dx, dy) {
    if (gameOver || isPaused) return false;

    if (isValidPosition(currentPiece, currentX + dx, currentY + dy)) {
        currentX += dx;
        currentY += dy;
        
        if (lockDelayActive && dx !== 0) {
            lockDelayMoves++;
            lockDelayTimer = Date.now();
            
            if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                lockDelayActive = false;
                lockDelayMoves = 0;
            }
            
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

async function dropPiece() {
    if (gameOver || isPaused || isAnimating) return;

    if (!isValidPosition(currentPiece, currentX, currentY + 1)) {
        if (!lockDelayActive) {
            lockDelayActive = true;
            lockDelayTimer = Date.now();
            lockDelayMoves = 0;
            return; // Don't lock immediately, wait for grace period
        }
        
    } else {
        currentY++;
        lockDelayActive = false;
        lockDelayMoves = 0;
    }
}

async function hardDrop() {
    if (gameOver || isPaused || isAnimating) return;

    while (isValidPosition(currentPiece, currentX, currentY + 1)) {
        currentY++;
    }
    
    lockDelayActive = false;
    lockDelayMoves = 0;
    mergePiece();
    await clearColorGroups();
    spawnPiece();
    lastDropTime = performance.now(); // Reset drop timer after hard drop
}

function rotate() {
    if (gameOver || isPaused) return;

    const rotated = rotatePiece(currentPiece);

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
        if (lockDelayActive) {
            lockDelayMoves++;
            lockDelayTimer = Date.now();

            if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                lockDelayActive = false;
                lockDelayMoves = 0;
            }

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

function drawBlock(ctx, x, y, color, size = BLOCK_SIZE, alpha = 1, scale = 1, glow = 0, isGhost = false) {
    ctx.save();
    
    const centerX = x * size + size / 2;
    const centerY = y * size + size / 2;
    const actualSize = size * scale;
    
    ctx.globalAlpha = isGhost ? 0.35 : alpha;
    
    if (glow > 0 && !isGhost) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
    }
    
    const pixelSize = 2;
    
    const blockColor = (isGhost && settings.ghostMode === 'hard') ? '#6a6a7a' : color;
    ctx.fillStyle = blockColor;
    ctx.fillRect(
        centerX - actualSize / 2,
        centerY - actualSize / 2,
        actualSize,
        actualSize
    );
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(centerX - actualSize / 2, centerY - actualSize / 2, actualSize, pixelSize);
    ctx.fillRect(centerX - actualSize / 2, centerY - actualSize / 2, pixelSize, actualSize);
    ctx.fillRect(centerX - actualSize / 2, centerY + actualSize / 2 - pixelSize, actualSize, pixelSize);
    ctx.fillRect(centerX + actualSize / 2 - pixelSize, centerY - actualSize / 2, pixelSize, actualSize);
    
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
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(
        centerX - actualSize / 2 + pixelSize * 2,
        centerY - actualSize / 2 + pixelSize * 2,
        pixelSize * 2,
        pixelSize * 2
    );
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(
        centerX + actualSize / 2 - pixelSize * 4,
        centerY + actualSize / 2 - pixelSize * 4,
        pixelSize * 2,
        pixelSize * 2
    );
    
    ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
        centerX - pixelSize,
        centerY - pixelSize,
        pixelSize * 2,
        pixelSize * 2
    );
    
    ctx.restore();
}

function drawBoard() {
    if (settings.palette === 'pudding') {
        ctx.fillStyle = '#fffaf5';
    } else {
        ctx.fillStyle = '#000';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }

    if (currentPiece && !isAnimating) {
        const ghostY = getGhostY();
        if (ghostY !== currentY) {
            for (let row = 0; row < currentPiece.length; row++) {
                for (let col = 0; col < currentPiece[row].length; col++) {
                    if (currentPiece[row][col]) {
                        const x = currentX + col;
                        const y = ghostY + row;
                        if (y >= 0) {
                            drawBlock(ctx, x, y, currentPiece[row][col], BLOCK_SIZE, 1, 1, 0, true);
                        }
                    }
                }
            }
        }
    }

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

    if (currentPiece && !isAnimating) {
        for (let row = 0; row < currentPiece.length; row++) {
            for (let col = 0; col < currentPiece[row].length; col++) {
                if (currentPiece[row][col]) {
                    const x = currentX + col;
                    const y = currentY + row;
                    if (y >= 0) {
                        if (lockDelayActive) {
                            const elapsedTime = Date.now() - lockDelayTimer;
                            const remainingTime = LOCK_DELAY_TIME - elapsedTime;
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

    updateParticles();
    drawParticles();

    
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

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

function updateScore() {
    document.getElementById('score').textContent = score;
}

function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOver').classList.add('show');
}

document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    const settingsModal = document.getElementById('settingsModal');
    const settingsOpen = settingsModal.classList.contains('show');
    
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
                if (isValidPosition(currentPiece, currentX, currentY + 1)) {
                    currentY++;
                    lockDelayActive = false;
                    lockDelayMoves = 0;
                } else {
                    if (lockDelayActive) {
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
            document.getElementById('settingsModal').classList.add('show');
            isPaused = true;
            document.getElementById('pauseOverlay').classList.remove('show');
            document.getElementById('gameContainer').classList.remove('paused');
            updateSettingsUI();
            e.preventDefault();
            break;
        case 'Escape':
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

function gameLoop(timestamp) {
    if (!gameOver) {
        if (!isPaused && !isAnimating) {
            if (lockDelayActive && Date.now() - lockDelayTimer >= LOCK_DELAY_TIME) {
                lockDelayActive = false;
                lockDelayMoves = 0;
                mergePiece();
                clearColorGroups().then(() => {
                    spawnPiece();
                    lastDropTime = timestamp; // Reset drop timer after locking
                });
            }
            else if (!lockDelayActive && timestamp - lastDropTime > dropInterval) {
                dropPiece();
                lastDropTime = timestamp;
            }
        }

        drawBoard();
        requestAnimationFrame(gameLoop);
    }
}

function initSettingsUI() {
    const settingsBtn = document.getElementById('settingsBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const gameContainer = document.getElementById('gameContainer');

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            if (isPaused) {
                pauseOverlay.classList.add('show');
                gameContainer.classList.add('paused');
                pauseBtn.textContent = '▶';
            } else {
                pauseOverlay.classList.remove('show');
                gameContainer.classList.remove('paused');
                pauseBtn.textContent = '⏸';
            }
        });
    }

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
        updateSettingsUI();
        isPaused = true;
        pauseOverlay.classList.remove('show');
        gameContainer.classList.remove('paused');
    });
    
    closeBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
        isPaused = false;
    });
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
            isPaused = false;
        }
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const setting = btn.dataset.setting;
            const value = btn.dataset.value;

            const isChanging = settings[setting] !== value;

            settings[setting] = value;
            saveSettings();

            if (setting === 'colorMode') {
                if (isChanging) {
                    COLORS = getActiveColors();
                    updateDifficultyDisplay();
                    restartGame();
                }
            } else if (setting === 'palette') {
                if (isChanging) {
                    updateTheme();
                    setTimeout(() => {
                        COLORS = getActiveColors();
                        restartGame();
                    }, 0);
                }
            } else if (setting === 'ghostMode') {
                if (isChanging) {
                    drawBoard();
                }
            }

            updateSettingsUI();
        });
    });

    const pauseSettingsBtn = document.getElementById('pauseSettingsBtn');
    if (pauseSettingsBtn) {
        pauseSettingsBtn.addEventListener('click', () => {
            pauseOverlay.classList.remove('show');
            gameContainer.classList.remove('paused');
            settingsModal.classList.add('show');
            updateSettingsUI();
        });
    }
    
    updateSettingsUI();
    updateDifficultyDisplay();
}

function updateDifficultyDisplay() {
    const difficultyElement = document.getElementById('colorDifficulty');
    if (difficultyElement) {
        difficultyElement.textContent = settings.colorMode.toUpperCase();
    }
}

function updateTheme() {
    if (settings.palette === 'pudding') {
        document.body.classList.add('pudding-theme');
    } else {
        document.body.classList.remove('pudding-theme');
    }
}

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

function restartGame() {
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

    COLORS = getActiveColors();

    initBoard();
    spawnPiece();
    updateScore();
    document.getElementById('level').textContent = level;
    updateDifficultyDisplay();
    drawBoard();
    drawHold();
    lastDropTime = performance.now();

    document.getElementById('settingsModal').classList.remove('show');
    isPaused = false;
}

function init() {
    loadSettings();
    updateTheme(); // Apply saved theme FIRST

    COLORS = getActiveColors();

    initBoard();
    spawnPiece();
    updateScore();
    document.getElementById('level').textContent = level;
    lastDropTime = performance.now();

    initSettingsUI();

    requestAnimationFrame(gameLoop);
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isTouchHolding = false;
let softDropInterval = null;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (gameOver || isAnimating) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    touchStartTime = Date.now();
    isTouchHolding = true;

    if (isPaused) return;

    setTimeout(() => {
        if (isTouchHolding && !softDropInterval) {
            softDropInterval = setInterval(() => {
                if (isTouchHolding && isValidPosition(currentPiece, currentX, currentY + 1)) {
                    currentY++;
                    lockDelayActive = false;
                    lockDelayMoves = 0;
                    drawBoard();
                }
            }, 50); // Fast drop while holding
        }
    }, 200); // 200ms delay before soft drop starts
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    const moveDistance = Math.sqrt(
        Math.pow(currentX - touchStartX, 2) +
        Math.pow(currentY - touchStartY, 2)
    );

    if (moveDistance > 20) {
        isTouchHolding = false;
        if (softDropInterval) {
            clearInterval(softDropInterval);
            softDropInterval = null;
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (gameOver || isPaused || isAnimating) return;

    isTouchHolding = false;
    if (softDropInterval) {
        clearInterval(softDropInterval);
        softDropInterval = null;
    }

    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const touchEndX = touch.clientX - rect.left;
    const touchEndY = touch.clientY - rect.top;
    const touchDuration = Date.now() - touchStartTime;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    const swipeThreshold = 30;

    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
        if (absDeltaY > absDeltaX) {
            if (deltaY < 0) {
                holdCurrentPiece();
            } else {
                hardDrop();
            }
        } else {
            if (deltaX < 0) {
                movePiece(-1, 0);
            } else {
                movePiece(1, 0);
            }
        }
    } else if (touchDuration < 200) {
        const canvasWidth = rect.width;
        const tapX = touchEndX;

        if (tapX < canvasWidth * 0.3) {
            rotate();
            rotate();
            rotate();
        } else if (tapX > canvasWidth * 0.7) {
            rotate();
        } else {
            rotate();
        }
    }

    drawBoard();
    drawHold();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

init();