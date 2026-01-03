import * as THREE from 'three';
import { getFortuneByNumber } from './data.js';

console.log('Omikuji script loading...');
console.log('THREE version:', THREE.REVISION);

// Language system
let currentLanguage = 'en'; // Default to English

const translations = {
    jp: {
        title: 'おみくじ',
        shakeLabel: '回',
        bottomTextInitial: '容器を振って！',
        bottomTextShake: '振り出す',
        getOmikujiBtn: 'おみくじを引く',
        checkFortuneBtn: '運勢を見る',
        startOver: 'やり直す',
        saveImage: '画像として保存'
    },
    en: {
        title: 'Omikuji',
        shakeLabel: 'shakes',
        bottomTextInitial: 'Shake the container!',
        bottomTextShake: 'Shake it out',
        getOmikujiBtn: 'Get omikuji',
        checkFortuneBtn: 'Check your fortune',
        startOver: 'Start over',
        saveImage: 'Save as image'
    },
    ko: {
        title: '오미쿠지',
        shakeLabel: '번',
        bottomTextInitial: '용기를 흔들어!',
        bottomTextShake: '흔들어 빼내세요',
        getOmikujiBtn: '오미쿠지 뽑기',
        checkFortuneBtn: '운세 확인',
        startOver: '다시 시작',
        saveImage: '이미지로 저장'
    }
};

function updateLanguage(lang) {
    currentLanguage = lang;
    document.body.classList.toggle('no-tooltips', lang === 'jp');
    const t = translations[lang];

    // Update UI elements
    const title = document.getElementById('title');
    const shakeLabel = document.getElementById('shake-label');
    const bottomText = document.getElementById('bottom-text');
    const takeOmikujiBtn = document.getElementById('take-omikuji-btn');
    const readFortuneBtn = document.getElementById('read-fortune-btn');
    const startOverLink = document.getElementById('start-over-link');
    const saveFortuneBtn = document.getElementById('save-fortune-btn');
    const languageToggle = document.getElementById('language-toggle');

    if (title) title.textContent = t.title;
    if (shakeLabel) shakeLabel.textContent = t.shakeLabel;
    if (takeOmikujiBtn) takeOmikujiBtn.textContent = t.getOmikujiBtn;
    if (readFortuneBtn) readFortuneBtn.textContent = t.checkFortuneBtn;
    if (startOverLink) startOverLink.textContent = t.startOver;
    if (saveFortuneBtn) saveFortuneBtn.textContent = t.saveImage;

    // Update bottom text based on current state
    if (bottomText && bottomText.style.display !== 'none') {
        if (currentState === State.IDLE) {
            bottomText.textContent = t.bottomTextInitial;
        } else if (currentState === State.SHAKING || currentState === State.FLIPPING) {
            bottomText.textContent = t.bottomTextShake;
        }
    }

    // Update language toggle button to show current language
    if (languageToggle) {
        if (lang === 'jp') {
            languageToggle.textContent = 'JP';
        } else if (lang === 'en') {
            languageToggle.textContent = 'EN';
        } else if (lang === 'ko') {
            languageToggle.textContent = 'KO';
        }
    }

    console.log('Language updated to:', lang);
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.getElementById('canvas-container');
if (!container) {
    console.error('Canvas container not found!');
} else {
    container.appendChild(renderer.domElement);
    console.log('Renderer added to DOM');
}

// Lighting - setup for cell shading with harsh shadows
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

console.log('Lights added');

// Create toon gradient for cell shading
function createToonGradient() {
    const colors = new Uint8Array(4);
    colors[0] = 0;      // Dark
    colors[1] = 128;    // Mid-dark
    colors[2] = 200;    // Mid-light
    colors[3] = 255;    // Light

    const gradientMap = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;
    return gradientMap;
}

// Create hexagonal cylinder (omikuji container)
function createHexagonalCylinder() {
    const group = new THREE.Group();

    const radius = 1.2;
    const height = 4;
    const segments = 6;

    // Wood material - pale wood with toon shading for cell-shaded effect
    const woodMaterial = new THREE.MeshToonMaterial({
        color: 0xD2B48C,
        gradientMap: createToonGradient()
    });

    // Create hexagonal cylinder using CylinderGeometry
    const geometry = new THREE.CylinderGeometry(radius, radius, height, segments, 1);
    const cylinder = new THREE.Mesh(geometry, woodMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    // Rotate so a flat face is perpendicular to Z-axis (not a vertex)
    cylinder.rotation.y = Math.PI / 6;
    group.add(cylinder);

    // Create hexagonal shape for caps
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
            hexShape.moveTo(x, y);
        } else {
            hexShape.lineTo(x, y);
        }
    }
    hexShape.closePath();

    // Top cap (hexagon with hole cutout)
    const holeRadius = 0.15;

    // Create a copy of hexShape with a hole
    const hexShapeWithHole = hexShape.clone();

    // Create circular hole in the center
    const holePath = new THREE.Path();
    for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const x = holeRadius * Math.cos(angle);
        const y = holeRadius * Math.sin(angle);
        if (i === 0) {
            holePath.moveTo(x, y);
        } else {
            holePath.lineTo(x, y);
        }
    }
    holePath.closePath();
    hexShapeWithHole.holes.push(holePath);

    const topCapGeometry = new THREE.ShapeGeometry(hexShapeWithHole);
    const topCap = new THREE.Mesh(topCapGeometry, woodMaterial);
    topCap.rotation.x = -Math.PI / 2;
    topCap.rotation.z = Math.PI / 6; // Match cylinder rotation
    topCap.position.y = height / 2;
    group.add(topCap);

    // Bottom cap uses the original shape without hole
    const capGeometry = new THREE.ShapeGeometry(hexShape);

    // Bottom cap (hexagon)
    const bottomCap = new THREE.Mesh(capGeometry, woodMaterial);
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.rotation.z = Math.PI / 6; // Match cylinder rotation
    bottomCap.position.y = -height / 2;
    group.add(bottomCap);

    // Create hole on top (recessed into the cap, perfectly dark)
    // holeRadius already defined above for the cap cutout
    const holeDepth = 0.2;

    // Create perfectly black material with no lighting interaction
    const holeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000, // Pure black
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true
    });

    // Create the hole cylinder (walls)
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 32);
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.y = height / 2 - holeDepth / 2;
    group.add(hole);

    // Add a solid black cap at the bottom of the hole to block any light/artifacts
    const holeCapGeometry = new THREE.CircleGeometry(holeRadius, 32);
    const holeCap = new THREE.Mesh(holeCapGeometry, holeMaterial);
    holeCap.rotation.x = -Math.PI / 2; // Face upward
    holeCap.position.y = height / 2 - holeDepth;
    group.add(holeCap);

    // Add another cap at the top entrance to ensure complete coverage
    const holeTopCap = new THREE.Mesh(
        new THREE.RingGeometry(holeRadius, holeRadius + 0.001, 32),
        holeMaterial
    );
    holeTopCap.rotation.x = -Math.PI / 2;
    holeTopCap.position.y = height / 2;
    group.add(holeTopCap);

    // Add engraved text
    addEngravedText(group, radius);

    console.log('Hexagonal cylinder created');
    return group;
}

// Create engraved text
async function addEngravedText(group, radius) {
    // Wait for Japanese fonts to load
    await document.fonts.ready;

    // Create canvas for text texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw black text with serif font for Japanese
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 70px "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw each character vertically
    const text = 'おみくじ';
    const chars = text.split('');
    const startY = 100;
    const spacing = 100;

    chars.forEach((char, i) => {
        ctx.fillText(char, canvas.width / 2, startY + i * spacing);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create plane with text - black text on transparent background
    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.FrontSide
    });

    const textPlane = new THREE.PlaneGeometry(1.2, 2.4);

    // Position text on one of the flat hexagonal faces
    // For a hexagon with 6 sides, we want the center of a face
    // The distance from center to a flat face is radius * cos(30°)
    const distanceToFace = radius * Math.cos(Math.PI / 6);

    // Add text to front face
    const textMeshFront = new THREE.Mesh(textPlane, textMaterial);
    textMeshFront.position.set(0, 0, distanceToFace + 0.05);
    group.add(textMeshFront);

    // Add text to back face (opposite side)
    const textMeshBack = new THREE.Mesh(textPlane, textMaterial.clone());
    textMeshBack.position.set(0, 0, -(distanceToFace + 0.05));
    textMeshBack.rotation.y = Math.PI; // Rotate 180° so text faces outward
    group.add(textMeshBack);

    console.log('Text added to container');
}

// Helper function to convert number to Japanese kanji
function numberToKanji(num) {
    const ones = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const tens = ['', '十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十'];

    if (num === 100) return '百';
    if (num < 10) return ones[num];

    const tenDigit = Math.floor(num / 10);
    const oneDigit = num % 10;

    return tens[tenDigit] + ones[oneDigit];
}

// Create fortune stick
function createFortuneStick() {
    const stickGroup = new THREE.Group();

    // Stick body (wood colored) - flat rectangular shape, wider for text
    const stickWidth = 0.15;
    const stickDepth = 0.03;
    const stickLength = 3;
    const stickGeometry = new THREE.BoxGeometry(stickWidth, stickLength, stickDepth);
    const stickMaterial = new THREE.MeshToonMaterial({
        color: 0xF5DEB3,
        gradientMap: createToonGradient()
    });
    const stick = new THREE.Mesh(stickGeometry, stickMaterial);
    stick.castShadow = true;
    stickGroup.add(stick);

    // Red tip at the TOP (the end that emerges first when upside down)
    const tipHeight = 0.3;
    const tipGeometry = new THREE.BoxGeometry(stickWidth, tipHeight, stickDepth);
    const tipMaterial = new THREE.MeshToonMaterial({
        color: 0xCC0000,
        gradientMap: createToonGradient()
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    // Position at the top of the stick (positive Y)
    tip.position.y = (stickLength / 2) + (tipHeight / 2);
    stickGroup.add(tip);

    // Create glow effect as outline - wraps around entire stick
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide, // Only render back faces to create outline
        depthWrite: false
    });
    // Glow should cover the entire stick (stick body + red tip)
    // Stick body: 3 units tall, centered at 0 (from -1.5 to 1.5)
    // Red tip: 0.3 units tall, at y = 1.65 (from 1.5 to 1.8)
    // Total height: from -1.5 to 1.8 = 3.3 units
    // Center point: (-1.5 + 1.8) / 2 = 0.15
    const totalGlowHeight = stickLength + tipHeight; // 3.0 + 0.3 = 3.3
    const glowGeometry = new THREE.BoxGeometry(stickWidth * 1.4, totalGlowHeight, stickDepth * 1.4);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.y = tipHeight / 2; // Center the glow to cover entire stick
    glowMesh.visible = false; // Hidden by default
    glowMesh.name = 'stickGlow';
    glowMesh.renderOrder = -1; // Render behind stick
    stickGroup.add(glowMesh);

    // Start HIDDEN inside the container
    // Position it completely inside so it's not visible when flipped
    stickGroup.position.set(0, 0, 0);
    stickGroup.visible = false;

    return stickGroup;
}

// Add fortune number text to stick (called after stick emerges)
async function addFortuneNumberToStick(stickGroup, number) {
    await document.fonts.ready;

    // 1. High-Res Canvas (prevents "blurry/image" look)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024; // Tall for vertical text
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Kanji
    const kanji = numberToKanji(number);
    const chars = kanji.split('');

    ctx.fillStyle = '#000000';
    // Use a large font size; scaling down in 3D looks better than scaling up
    ctx.font = 'bold 160px "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';

    chars.forEach((char, i) => {
        ctx.fillText(char, canvas.width / 2, 200 + (i * 220));
    });

    // 3. Texture Optimization
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy()); // Keeps text sharp at angles

    // 4. Material (Basic ensures it's readable regardless of lighting)
    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1, // Discards transparent pixels to prevent "box" artifacts
        side: THREE.FrontSide
    });

    // 5. Geometry & Positioning
    const textPlane = new THREE.PlaneGeometry(0.12, 0.8);
    const textMesh = new THREE.Mesh(textPlane, textMaterial);

    // Z-offset: Stick depth is 0.03, so face is at 0.015.
    // Set text to 0.017 to avoid Z-fighting.
    // Position just below red tip: red tip bottom is at Y=1.5, text height is 0.8
    // So center of text should be at Y = 1.5 - 0.4 = 1.1
    textMesh.position.set(0, 1.1, 0.017);

    // Rotate 180 degrees around Z because the container is upside down
    textMesh.rotation.z = Math.PI;

    textMesh.name = 'fortuneNumber';
    stickGroup.add(textMesh);

    console.log(`Kanji "${kanji}" applied to stick face.`);
}

// Load shake sound
const shakeSound = new Audio('shakesound.wav');
let audioInitialized = false;

// Initialize audio on user interaction (for Safari)
function initializeAudio() {
    if (!audioInitialized) {
        shakeSound.load();
        // Try to play and immediately pause to unlock audio
        const playPromise = shakeSound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                shakeSound.pause();
                shakeSound.currentTime = 0;
                audioInitialized = true;
                console.log('Audio initialized');
            }).catch(e => {
                console.log('Audio initialization failed:', e);
            });
        }
    }
}

// Game state machine (must be declared before container creation)
const State = {
    IDLE: 'idle',
    FLIPPING: 'flipping',
    SHAKING: 'shaking',
    EMERGING: 'emerging',
    FINISHED: 'finished'
};

let currentState = State.IDLE;
let requiredShakes = 0;
let targetRotation = 0;
let targetYPosition = 0;
let stickProgress = 0;
let flipProgress = 0;
let fortuneNumber = 0; // Random number 1-100 for the stick

// Interaction state
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let angularVelocity = { x: 0, y: 0 };
let shakeIntensity = 0;
let shakeCount = 0;
let lastShakeTime = 0;
let hasShaken = false; // Track if user has shaken at least once

// Raycaster for hover and click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringStick = false;
let isZoomedIn = false;
let zoomProgress = 0;
const originalCameraPosition = { x: 0, y: 0, z: 8 };
// Zoom to focus on the fortune number
// When container is upside down (rotated 180°) at world Y=1.5, stick emerges downward to local Y=2.0
// In the upside-down container, the stick extends DOWNWARD (negative world Y direction)
// Text is at stick local Y=1.1 (just below red tip at 1.5)
// When the container is at world Y=1.5 and rotated 180°:
// - Stick at local Y=2.0 is actually 2.0 units BELOW the container in world space
// - Text at local Y=1.1 is at: 1.5 - 2.0 - (1.5 - 1.1) = 1.5 - 2.0 - 0.4 = -0.9
// Actually simpler: container at Y=1.5, stick goes down 2.0 = -0.5, text is 0.4 higher = -0.1
// User requested camera go even lower to better frame the stick and text
const zoomedCameraPosition = { x: 0, y: -1.2, z: 2.5 };
const zoomLookAt = { x: 0, y: -1.0, z: 0 }; // Look directly at the stick/number area

// Create the omikuji container
const omikujiContainer = createHexagonalCylinder();
scene.add(omikujiContainer);

// Create and add fortune stick
const fortuneStick = createFortuneStick();
omikujiContainer.add(fortuneStick);

console.log('Container added to scene');

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -3;
ground.receiveShadow = true;
scene.add(ground);

// Device orientation
let isUsingDeviceOrientation = false;
let lastOrientation = { beta: null, gamma: null };

// Event handlers
function onPointerDown(e) {
    // Initialize audio on first user interaction (for mobile/Safari)
    if (!audioInitialized) {
        initializeAudio();
    }
    
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousMousePosition = { x: clientX, y: clientY };
}

function onPointerMove(e) {
    if (!isDragging) return;

    if (e.cancelable) {
        e.preventDefault();
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousMousePosition.x;
    const deltaY = clientY - previousMousePosition.y;

    previousMousePosition = { x: clientX, y: clientY };

    // Apply rotation
    angularVelocity.y += deltaX * 0.001;
    angularVelocity.x += deltaY * 0.001;

    // Calculate movement for shake detection
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Visual shake effect for IDLE and SHAKING states - only when dragging
    if ((currentState === State.IDLE || currentState === State.SHAKING) && movement > 10) {
        shakeIntensity = Math.min(shakeIntensity + movement * 0.02, 2.0);

        const now = Date.now();
        if (now - lastShakeTime > 250) {
            // Play shake sound for both states
            shakeSound.currentTime = 0;
            shakeSound.play().catch(e => console.log('Audio play failed:', e));

            // In IDLE state, show button and shake count after first shake
            if (currentState === State.IDLE && !hasShaken) {
                hasShaken = true;
                const bottomText = document.getElementById('bottom-text');
                const takeBtn = document.getElementById('take-omikuji-btn');
                const shakeCountEl = document.getElementById('shake-count');
                const shakeValueEl = document.getElementById('shake-value');

                if (bottomText) bottomText.style.display = 'none';
                if (takeBtn) takeBtn.style.display = 'inline-block';

                // Show shake counter in IDLE state
                if (shakeCountEl && shakeValueEl) {
                    shakeCountEl.style.display = 'block';
                    shakeValueEl.textContent = '1'; // First shake
                }
            } else if (currentState === State.IDLE && hasShaken) {
                // Update shake count in IDLE state
                const shakeValueEl = document.getElementById('shake-value');
                if (shakeValueEl) {
                    const currentShakes = parseInt(shakeValueEl.textContent) + 1;
                    shakeValueEl.textContent = currentShakes;
                }
            }

            // Count shakes ONLY in SHAKING state (no UI update needed)
            if (currentState === State.SHAKING) {
                shakeCount++;
                console.log('Shake counted! Total:', shakeCount, '/', requiredShakes);

                if (shakeCount >= requiredShakes) {
                    currentState = State.EMERGING;
                    console.log('Transitioning to EMERGING state');
                }
            }

            lastShakeTime = now;
        }
    }
}

function onPointerUp() {
    isDragging = false;
}

// Mouse move for hover detection and raycasting
function onMouseMove(e) {
    // Update mouse position for raycasting
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Only check hover when stick is revealed
    if (currentState === State.FINISHED || currentState === State.EMERGING) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fortuneStick.children, true);

        // Find glow mesh
        const glowMesh = fortuneStick.children.find(child => child.name === 'stickGlow');

        if (intersects.length > 0) {
            isHoveringStick = true;
            renderer.domElement.style.cursor = 'pointer';
            if (glowMesh) glowMesh.visible = true;
        } else {
            isHoveringStick = false;
            renderer.domElement.style.cursor = 'grab';
            if (glowMesh) glowMesh.visible = false;
        }
    }
}

// Click handler for zoom
function onClick(e) {
    // Only allow zoom when stick is fully revealed and not dragging
    if (currentState === State.FINISHED && !isDragging) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fortuneStick.children, true);

        if (intersects.length > 0 || isZoomedIn) {
            // Toggle zoom
            isZoomedIn = !isZoomedIn;
            console.log('Zoom toggled:', isZoomedIn);
        }
    }
}

function handleOrientation(event) {
    if (event.beta === null || event.gamma === null) return;

    if (lastOrientation.beta !== null) {
        const deltaBeta = event.beta - lastOrientation.beta;
        const deltaGamma = event.gamma - lastOrientation.gamma;
        const movementMagnitude = Math.sqrt(deltaBeta * deltaBeta + deltaGamma * deltaGamma);

        if (movementMagnitude > 5) {
            angularVelocity.x += deltaBeta * 0.002;
            angularVelocity.y += deltaGamma * 0.002;
            shakeIntensity = Math.min(shakeIntensity + movementMagnitude * 0.02, 3);

            const now = Date.now();
            if (now - lastShakeTime > 300) {
                shakeCount++;
                lastShakeTime = now;
                updateShakeCount();
            }
        }
    }

    lastOrientation.beta = event.beta;
    lastOrientation.gamma = event.gamma;
}

function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    isUsingDeviceOrientation = true;
                }
            })
            .catch(console.error);
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
        isUsingDeviceOrientation = true;
    }
}

function updateShakeCount() {
    // This function is now only used in SHAKING state - we don't show counter in this state
    // Shake counter is only shown in IDLE state
}

// Event listeners
if (renderer.domElement) {
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('mouseleave', onPointerUp);
    renderer.domElement.addEventListener('click', onClick);

    renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: false });
    renderer.domElement.addEventListener('touchmove', onPointerMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onPointerUp);

    // Request orientation on first touch
    let firstTouch = true;
    renderer.domElement.addEventListener('touchstart', () => {
        if (firstTouch) {
            requestOrientationPermission();
            firstTouch = false;
        }
    });
}

// Add mouse move for hover detection
window.addEventListener('mousemove', onMouseMove);

// Language toggle button event listener
const languageToggle = document.getElementById('language-toggle');
if (languageToggle) {
    languageToggle.addEventListener('click', () => {
        // Cycle through languages: jp -> en -> ko -> jp
        if (currentLanguage === 'jp') {
            updateLanguage('en');
        } else if (currentLanguage === 'en') {
            updateLanguage('ko');
        } else {
            updateLanguage('jp');
        }
    });
}

// Button event listener
const takeOmikujiBtn = document.getElementById('take-omikuji-btn');
if (takeOmikujiBtn) {
    takeOmikujiBtn.addEventListener('click', () => {
        // Initialize audio on first user interaction (for Safari)
        initializeAudio();

        if (currentState === State.IDLE) {
            currentState = State.FLIPPING;
            requiredShakes = Math.floor(Math.random() * 3) + 1; // 1-3 shakes
            fortuneNumber = Math.floor(Math.random() * 100) + 1; // Random number 1-100
            shakeCount = 0;
            flipProgress = 0;
            stickProgress = 0;
            targetRotation = Math.PI; // Flip 180 degrees
            targetYPosition = 1.5; // Move container up to make room for stick

            // Reset stick state
            fortuneStick.userData.hasText = false;
            fortuneStick.visible = true;

            // Remove any existing fortune number text
            const textMesh = fortuneStick.children.find(child => child.geometry?.type === 'PlaneGeometry' && child !== fortuneStick.children[0] && child !== fortuneStick.children[1]);
            if (textMesh) {
                fortuneStick.remove(textMesh);
            }

            // Update UI - hide button and shake counter, show "Shake it out" message
            takeOmikujiBtn.style.display = 'none';
            const bottomText = document.getElementById('bottom-text');
            const shakeCountEl = document.getElementById('shake-count');

            if (bottomText) {
                bottomText.textContent = translations[currentLanguage].bottomTextShake;
                bottomText.style.display = 'block';
            }

            // Hide the IDLE shake counter
            if (shakeCountEl) {
                shakeCountEl.style.display = 'none';
            }
        }
    });
}

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const now = Date.now();

    switch (currentState) {
        case State.IDLE:
            // Apply rotation from user input
            omikujiContainer.rotation.x += angularVelocity.x;
            omikujiContainer.rotation.y += angularVelocity.y;

            // Only allow gentle tilting when in idle state
            const maxTilt = Math.PI / 8; // 22.5 degrees max tilt
            omikujiContainer.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, omikujiContainer.rotation.x));

            // Shake effect at base position (Y = 0) - only when actively shaking
            if (shakeIntensity > 0 && isDragging) {
                const shake = Math.sin(now * 0.1) * shakeIntensity * 0.15;
                omikujiContainer.position.y = shake;
                shakeIntensity *= 0.85; // Faster decay
            } else {
                omikujiContainer.position.y = 0;
                shakeIntensity = 0; // Stop immediately when not dragging
            }

            // Gentle spring back to upright position
            if (!isDragging) {
                const springStrength = 0.02;
                angularVelocity.x -= omikujiContainer.rotation.x * springStrength;
            }

            // Gentle auto-rotation when idle
            if (!isDragging && Math.abs(angularVelocity.y) < 0.001) {
                omikujiContainer.rotation.y += 0.005;
            }

            // Damping
            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.FLIPPING:
            flipProgress += 0.015; // Control speed of the lift/flip

            if (flipProgress < 1.0) {
                // Use smooth easing (cubic)
                const t = flipProgress;
                const eased = t * t * (3 - 2 * t);

                // 1) Move UP and 2) Flip 180° SIMULTANEOUSLY
                omikujiContainer.position.y = eased * targetYPosition;
                omikujiContainer.rotation.x = eased * Math.PI;
            } else {
                // LOCK to final state
                omikujiContainer.position.y = targetYPosition;
                omikujiContainer.rotation.x = Math.PI;
                currentState = State.SHAKING;

                // Update UI for Step 3
                shakeCount = 0;
                document.getElementById('instruction').textContent = `Shake ${requiredShakes} time${requiredShakes > 1 ? 's' : ''} to get the stick out`;
                document.getElementById('shake-count').style.display = 'block';
                document.getElementById('shake-value').textContent = '0';
                document.getElementById('required-shakes').textContent = requiredShakes;
            }
            break;

        case State.SHAKING:
            // Apply physical shake movement - only when actively dragging
            if (shakeIntensity > 0 && isDragging) {
                const shakeOffset = Math.sin(now * 0.2) * shakeIntensity * 0.1;
                omikujiContainer.position.y = targetYPosition + shakeOffset;
                shakeIntensity *= 0.85; // Faster decay
            } else {
                omikujiContainer.position.y = targetYPosition;
                shakeIntensity = 0; // Stop immediately when not dragging
            }

            // Apply user rotation
            omikujiContainer.rotation.y += angularVelocity.y;

            // Keep it upside down with slight user-driven tilt
            if (!isDragging) {
                const tiltSpring = (omikujiContainer.rotation.x - Math.PI) * 0.1;
                omikujiContainer.rotation.x -= tiltSpring;
            } else {
                omikujiContainer.rotation.x += angularVelocity.x;
                // Limit tilt while upside down
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            // Damping
            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.EMERGING:
            // Step 4: The stick comes out
            if (stickProgress < 1.0) {
                stickProgress += 0.01; // Slow emergence
                // Move stick from local Y=0 (hidden) to Y=2.0 (poking out)
                fortuneStick.position.y = stickProgress * 2.0;
                fortuneStick.visible = true;

                // Add fortune number text when stick starts emerging (only once)
                if (stickProgress > 0.1 && !fortuneStick.userData.hasText) {
                    addFortuneNumberToStick(fortuneStick, fortuneNumber);
                    fortuneStick.userData.hasText = true;
                }
            } else {
                currentState = State.FINISHED;

                // Show "Check your fortune" button and "Start over" link
                const bottomText = document.getElementById('bottom-text');
                const readFortuneBtn = document.getElementById('read-fortune-btn');
                const startOverLink = document.getElementById('start-over-link');

                if (bottomText) bottomText.style.display = 'none';
                if (readFortuneBtn) readFortuneBtn.style.display = 'inline-block';
                if (startOverLink) startOverLink.style.display = 'block';
            }

            // Keep container at elevated position
            omikujiContainer.position.y = targetYPosition;

            // Apply user rotation
            omikujiContainer.rotation.y += angularVelocity.y;
            if (isDragging) {
                omikujiContainer.rotation.x += angularVelocity.x;
                // Limit tilt while upside down
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            // Damping
            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.FINISHED:
            // Keep container at elevated position
            omikujiContainer.position.y = targetYPosition;

            // Apply user rotation
            omikujiContainer.rotation.y += angularVelocity.y;
            if (isDragging) {
                omikujiContainer.rotation.x += angularVelocity.x;
                // Limit tilt while upside down
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            // Damping
            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;
    }

    // Camera zoom animation - runs every frame
    if (zoomProgress > 0) {
        const t = zoomProgress;
        const eased = t * t * (3 - 2 * t); // Smooth easing
        camera.position.x = originalCameraPosition.x + (zoomedCameraPosition.x - originalCameraPosition.x) * eased;
        camera.position.y = originalCameraPosition.y + (zoomedCameraPosition.y - originalCameraPosition.y) * eased;
        camera.position.z = originalCameraPosition.z + (zoomedCameraPosition.z - originalCameraPosition.z) * eased;

        // Interpolate lookAt target
        const lookAtX = 0 + (zoomLookAt.x - 0) * eased;
        const lookAtY = 0 + (zoomLookAt.y - 0) * eased;
        const lookAtZ = 0 + (zoomLookAt.z - 0) * eased;
        camera.lookAt(lookAtX, lookAtY, lookAtZ);
    } else {
        // Default camera lookAt when not zoomed
        camera.lookAt(0, 0, 0);
    }

    // Update zoom progress
    if (isZoomedIn && zoomProgress < 1.0) {
        zoomProgress = Math.min(zoomProgress + 0.05, 1.0);
    } else if (!isZoomedIn && zoomProgress > 0) {
        zoomProgress = Math.max(zoomProgress - 0.05, 0);
    }

    renderer.render(scene, camera);
}

console.log('Starting animation loop');
console.log('Scene children count:', scene.children.length);
console.log('Camera position:', camera.position);
animate();

// ===== FORTUNE MODAL LOGIC =====

function createRubyText(jp, furigana_parts) {
    if (!furigana_parts || furigana_parts.length === 0) {
        return jp;
    }

    let result = '';
    let charIndex = 0;

    furigana_parts.forEach(part => {
        const kanji = jp[charIndex];
        result += `<ruby>${kanji}<rt>${part}</rt></ruby>`;
        charIndex++;
    });

    return result;
}

function displayFortuneModal(fortuneNumber) {
    const fortune = getFortuneByNumber(fortuneNumber);
    if (!fortune) {
        console.error('Fortune not found for number:', fortuneNumber);
        return;
    }

    console.log('Displaying fortune:', fortune);

    // Always display Japanese text in the modal
    // Only tooltips change based on language (no tooltips for Japanese)

    // Update fortune type (left header) - always Japanese with furigana
    const fortuneTypeEl = document.getElementById('fortune-type');
    if (fortuneTypeEl) {
        fortuneTypeEl.innerHTML = createRubyText(fortune.fortune_jp, fortune.furigana_parts);

        // Set tooltip based on current language (no tooltip for Japanese)
        if (currentLanguage === 'ko') {
            fortuneTypeEl.setAttribute('data-tip', `운세:<br>${fortune.gloss_ko}`);
        } else if (currentLanguage === 'en') {
            fortuneTypeEl.setAttribute('data-tip', `Fortune:<br>${fortune.gloss_en}`);
        } else {
            fortuneTypeEl.removeAttribute('data-tip');
        }
    }

    // Update fortune number (right header) - always Japanese
    const fortuneNumberEl = document.getElementById('fortune-number');
    if (fortuneNumberEl) {
        const kanji = numberToKanji(fortuneNumber);
        fortuneNumberEl.textContent = kanji + '番';

        // Set tooltip based on current language (no tooltip for Japanese)
        if (currentLanguage === 'ko') {
            fortuneNumberEl.setAttribute('data-tip', `번호:<br>${fortuneNumber}번`);
        } else if (currentLanguage === 'en') {
            fortuneNumberEl.setAttribute('data-tip', `Number:<br>${fortuneNumber}`);
        } else {
            fortuneNumberEl.removeAttribute('data-tip');
        }
    }

    // Update shrine title (center header) tooltip - text always stays Japanese
    const shrineTitleEl = document.getElementById('shrine-title');
    if (shrineTitleEl) {
        // Set tooltip based on current language (no tooltip for Japanese)
        if (currentLanguage === 'ko') {
            shrineTitleEl.setAttribute('data-tip', '인터넷 본궁<br>브릭 신사');
        } else if (currentLanguage === 'en') {
            shrineTitleEl.setAttribute('data-tip', 'Internet Hongu<br>Brixton Shrine Fortune');
        } else {
            shrineTitleEl.removeAttribute('data-tip');
        }
    }

    // Update main fortune text (right body section) - always Japanese
    const mainFortuneEl = document.getElementById('main-fortune-content');
    if (mainFortuneEl && fortune.sections.unsei) {
        const parts = fortune.sections.unsei.jp_parts || [fortune.sections.unsei.jp];
        mainFortuneEl.innerHTML = `<div>${parts.join('<br>')}</div>`;

        // Set tooltip based on current language
        if (currentLanguage === 'ko') {
            const koParts = fortune.sections.unsei.ko_parts || [fortune.sections.unsei.ko];
            mainFortuneEl.setAttribute('data-tip', `${fortune.sections.unsei.category_ko}:<br>${koParts.join(' ')}`);
        } else if (currentLanguage === 'en') {
            mainFortuneEl.setAttribute('data-tip', `${fortune.sections.unsei.category_en}:<br>${fortune.sections.unsei.en}`);
        } else {
            mainFortuneEl.removeAttribute('data-tip');
        }
    }

    // Define the order of sections for items (top 5, bottom 5)
    const sectionOrder = [
        'ganbou',      // Wishes
        'tabi_dachi',  // Travel
        'shobai',      // Business
        'kin_un',      // Money
        'en_dan',      // Love
        'byoki',       // Health
        'arasai_goto', // Conflict
        'hogaku',      // Direction
        'sns',         // Social Media
        'advice'       // Advice
    ];

    // Map section IDs to labels in all languages
    const sectionLabels = {
        jp: {
            'ganbou': '願望',
            'tabi_dachi': '旅立ち',
            'shobai': '商売',
            'kin_un': '金運',
            'en_dan': '縁談',
            'byoki': '病気',
            'arasai_goto': '争い事',
            'hogaku': '方角',
            'sns': 'ＳＮＳ',
            'advice': '助言'
        },
        en: {
            'ganbou': 'Wish',
            'tabi_dachi': 'Travel',
            'shobai': 'Business',
            'kin_un': 'Money',
            'en_dan': 'Love',
            'byoki': 'Health',
            'arasai_goto': 'Conflict',
            'hogaku': 'Direction',
            'sns': 'Social Media',
            'advice': 'Advice'
        },
        ko: {
            'ganbou': '소망',
            'tabi_dachi': '여행',
            'shobai': '사업',
            'kin_un': '금전운',
            'en_dan': '인연',
            'byoki': '건강',
            'arasai_goto': '분쟁',
            'hogaku': '방향',
            'sns': 'SNS',
            'advice': '조언'
        }
    };

    // Always use Japanese labels for display
    const labels = sectionLabels.jp;

    // Update top items (first 5) - always Japanese text
    const itemsTopEl = document.getElementById('items-top-content');
    if (itemsTopEl) {
        itemsTopEl.innerHTML = '';
        sectionOrder.slice(0, 5).forEach(sectionId => {
            const section = fortune.sections[sectionId];
            if (section) {
                const label = labels[sectionId];
                const span = document.createElement('span');
                span.className = 'item-line tip';

                // Always display Japanese text
                span.innerHTML = `<b>${label}</b>　　${section.jp}`;

                // Set tooltip based on current language
                if (currentLanguage === 'ko') {
                    span.setAttribute('data-tip', `${section.category_ko}:<br>${section.ko}`);
                } else if (currentLanguage === 'en') {
                    span.setAttribute('data-tip', `${section.category_en}:<br>${section.en}`);
                } else {
                    span.removeAttribute('data-tip');
                }

                itemsTopEl.appendChild(span);
            }
        });
    }

    // Update bottom items (last 5) - always Japanese text
    const itemsBottomEl = document.getElementById('items-bottom-content');
    if (itemsBottomEl) {
        itemsBottomEl.innerHTML = '';
        sectionOrder.slice(5, 10).forEach(sectionId => {
            const section = fortune.sections[sectionId];
            if (section) {
                const label = labels[sectionId];
                const span = document.createElement('span');
                span.className = 'item-line tip';

                // Always display Japanese text
                span.innerHTML = `<b>${label}</b>　　${section.jp}`;

                // Set tooltip based on current language
                if (currentLanguage === 'ko') {
                    span.setAttribute('data-tip', `${section.category_ko}:<br>${section.ko}`);
                } else if (currentLanguage === 'en') {
                    span.setAttribute('data-tip', `${section.category_en}:<br>${section.en}`);
                } else {
                    span.removeAttribute('data-tip');
                }

                itemsBottomEl.appendChild(span);
            }
        });
    }

    // Initialize tooltip behavior
    initializeTooltips();

    // Show modal
    const modalOverlay = document.getElementById('fortune-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
    }
}
function initializeTooltips() {
    const tooltip = document.getElementById('tooltip');
    const tips = document.querySelectorAll('.tip');
    const isMobile = window.matchMedia("(max-width: 600px)").matches;

    // Remove previous listeners by cloning and replacing
    tips.forEach(t => {
        const newTip = t.cloneNode(true);
        t.parentNode.replaceChild(newTip, t);
    });

    // Re-query after replacement
    const newTips = document.querySelectorAll('.tip');

    // Always hide tooltip immediately
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.classList.remove('mobile-active');
    }

    // If Japanese is selected, do not attach any tooltip listeners at all
    if (currentLanguage === 'jp') {
        return;
    }

    newTips.forEach(t => {
        t.addEventListener('mouseenter', () => {
            if (!isMobile && tooltip) {
                const tipText = t.getAttribute('data-tip');
                if (!tipText) return; // nothing to show
                tooltip.innerHTML = tipText;
                tooltip.style.opacity = '1';
            }
        });

        t.addEventListener('mousemove', (e) => {
            if (!isMobile && tooltip) {
                tooltip.style.left = (e.clientX + 20) + 'px';
                tooltip.style.top = (e.clientY + 20) + 'px';
            }
        });

        t.addEventListener('mouseleave', () => {
            if (!isMobile && tooltip) {
                tooltip.style.opacity = '0';
            }
        });

        t.addEventListener('click', (e) => {
            if (isMobile && tooltip) {
                const tipText = t.getAttribute('data-tip');
                if (!tipText) return; // nothing to show
                e.stopPropagation();
                e.preventDefault();

                // Check if tooltip is already visible for this element
                const isCurrentlyActive = tooltip.classList.contains('mobile-active') &&
                                         tooltip.innerHTML === tipText;

                if (isCurrentlyActive) {
                    // If clicking the same element again, hide it
                    tooltip.style.opacity = '0';
                    tooltip.classList.remove('mobile-active');
                } else {
                    // Show tooltip and keep it visible until another click
                    tooltip.innerHTML = tipText;
                    tooltip.classList.add('mobile-active');
                    tooltip.style.opacity = '1';

                    // Position the tooltip below the tapped element
                    const rect = t.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.bottom + 10) + 'px';
                }
            }
        });
    });

    // Close tooltip when clicking outside of any .tip element
    document.addEventListener('click', (e) => {
        if (isMobile && tooltip) {
            // Check if the click was on a .tip element
            const clickedTip = e.target.closest('.tip');
            if (!clickedTip) {
                tooltip.style.opacity = '0';
                tooltip.classList.remove('mobile-active');
            }
        }
    });
}


// "Read your fortune" button event listener
const readFortuneBtn = document.getElementById('read-fortune-btn');
if (readFortuneBtn) {
    readFortuneBtn.addEventListener('click', () => {
        displayFortuneModal(fortuneNumber);
    });
}

// "Save as image" button event listener
const saveFortuneBtn = document.getElementById('save-fortune-btn');
if (saveFortuneBtn) {
    saveFortuneBtn.addEventListener('click', async () => {
        const paper = document.querySelector('.omikuji-paper');
        if (!paper) return;

        try {
            // Temporarily hide the save button while capturing
            saveFortuneBtn.style.display = 'none';

            // Use dom-to-image for better CSS support (including vertical text)
            // Capture at 2x scale for higher quality
            const scale = 2;
            const dataUrl = await domtoimage.toPng(paper, {
                quality: 1.0,
                bgcolor: '#ffffff',
                width: paper.offsetWidth * scale,
                height: paper.offsetHeight * scale,
                style: {
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: paper.offsetWidth + 'px',
                    height: paper.offsetHeight + 'px'
                }
            });

            // Show the button again
            saveFortuneBtn.style.display = 'block';

            // Download the image
            const link = document.createElement('a');
            link.download = `omikuji-fortune-${fortuneNumber}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error saving fortune:', error);
            saveFortuneBtn.style.display = 'block';
        }
    });
}

// Close modal on overlay click
const modalOverlay = document.getElementById('fortune-modal-overlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });
}

// Close modal button (mobile)
const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });
}

// "Start over" link event listener
const startOverLink = document.getElementById('start-over-link');
if (startOverLink) {
    startOverLink.addEventListener('click', () => {
        // Reset to IDLE state
        currentState = State.IDLE;
        hasShaken = false;
        shakeCount = 0;
        requiredShakes = 0;
        flipProgress = 0;
        stickProgress = 0;
        fortuneNumber = 0;
        isZoomedIn = false;
        zoomProgress = 0;

        // Reset container position and rotation
        omikujiContainer.position.y = 0;
        omikujiContainer.rotation.x = 0;
        omikujiContainer.rotation.y = 0;

        // Hide stick
        fortuneStick.visible = false;
        fortuneStick.position.y = 0;
        fortuneStick.userData.hasText = false;

        // Remove fortune number text if it exists
        const textMesh = fortuneStick.children.find(child => child.name === 'fortuneNumber');
        if (textMesh) {
            fortuneStick.remove(textMesh);
        }

        // Reset UI with current language
        const bottomText = document.getElementById('bottom-text');
        const takeBtn = document.getElementById('take-omikuji-btn');
        const readBtn = document.getElementById('read-fortune-btn');
        const shakeCountEl = document.getElementById('shake-count');
        const shakeValueEl = document.getElementById('shake-value');

        if (bottomText) {
            bottomText.textContent = translations[currentLanguage].bottomTextInitial;
            bottomText.style.display = 'block';
        }
        if (takeBtn) takeBtn.style.display = 'none';
        if (readBtn) readBtn.style.display = 'none';
        if (startOverLink) startOverLink.style.display = 'none';
        if (shakeCountEl) shakeCountEl.style.display = 'none';
        if (shakeValueEl) shakeValueEl.textContent = '0';

        // Close modal if open
        const modalOverlay = document.getElementById('fortune-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }

        console.log('Reset to initial state');
    });

    // Initialize no-tooltips class on page load if language is Japanese
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (currentLanguage === 'jp') {
                    document.body.classList.add('no-tooltips');
                }
            });
        } else {
            // DOM is already ready
            if (currentLanguage === 'jp') {
                document.body.classList.add('no-tooltips');
            }
        }
    }
}
