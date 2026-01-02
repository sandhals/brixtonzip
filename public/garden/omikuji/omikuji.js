import * as THREE from 'three';

console.log('Omikuji script loading...');
console.log('THREE version:', THREE.REVISION);

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

    // Top cap (hexagon)
    const capGeometry = new THREE.ShapeGeometry(hexShape);
    const topCap = new THREE.Mesh(capGeometry, woodMaterial);
    topCap.rotation.x = -Math.PI / 2;
    topCap.rotation.z = Math.PI / 6; // Match cylinder rotation
    topCap.position.y = height / 2;
    group.add(topCap);

    // Bottom cap (hexagon)
    const bottomCap = new THREE.Mesh(capGeometry, woodMaterial);
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.rotation.z = Math.PI / 6; // Match cylinder rotation
    bottomCap.position.y = -height / 2;
    group.add(bottomCap);

    // Create hole on top (recessed into the cap, darker wood)
    const holeRadius = 0.15;
    const holeDepth = 0.2;
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16);
    const holeMaterial = new THREE.MeshToonMaterial({
        color: 0x2a1a0f,
        gradientMap: createToonGradient()
    });
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    // Position it so it's recessed into the top cap
    hole.position.y = height / 2 - holeDepth / 2;
    group.add(hole);

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
    const textMesh = new THREE.Mesh(textPlane, textMaterial);

    // Position text on one of the flat hexagonal faces
    // For a hexagon with 6 sides, we want the center of a face
    // The distance from center to a flat face is radius * cos(30°)
    const distanceToFace = radius * Math.cos(Math.PI / 6);
    textMesh.position.set(0, 0, distanceToFace + 0.05);

    group.add(textMesh);

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

    // Create glow effect as outline - larger mesh with BackSide rendering
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide, // Only render back faces to create outline
        depthWrite: false
    });
    // Make it noticeably larger to create outline effect
    const glowGeometry = new THREE.BoxGeometry(stickWidth * 1.4, stickLength * 1.1, stickDepth * 1.4);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
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
    textMesh.position.set(0, 0.7, 0.017);

    // Rotate 180 degrees around Z because the container is upside down
    textMesh.rotation.z = Math.PI;

    textMesh.name = 'fortuneNumber';
    stickGroup.add(textMesh);

    console.log(`Kanji "${kanji}" applied to stick face.`);
}

// Load shake sound
const shakeSound = new Audio('shakesound.wav');

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
// Zoom to focus on the red tip and number area
// When container is upside down (rotated 180°) at Y=1.5, stick emerges downward
// Stick local Y goes from -1.5 to 1.5, red tip at local Y=1.65, number at Y=0.8
// When upside down and emerged to local Y=2.0:
// Red tip world Y = 1.5 - (2.0 + 1.65) = 1.5 - 3.65 = -2.15
// Number world Y = 1.5 - (2.0 + 0.8) = 1.5 - 2.8 = -1.3
const zoomedCameraPosition = { x: 0, y: -1.5, z: 3 };
const zoomLookAt = { x: 0, y: -1.8, z: 0 }; // Look at red tip area

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

// Button event listener
const takeOmikujiBtn = document.getElementById('take-omikuji-btn');
if (takeOmikujiBtn) {
    takeOmikujiBtn.addEventListener('click', () => {
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
                bottomText.textContent = 'Shake it out';
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
                document.getElementById('instruction').textContent = 'Fortune received!';
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

    // Camera zoom animation
    if (isZoomedIn) {
        if (zoomProgress < 1.0) {
            zoomProgress = Math.min(zoomProgress + 0.05, 1.0);
            const t = zoomProgress;
            const eased = t * t * (3 - 2 * t); // Smooth easing
            camera.position.x = originalCameraPosition.x + (zoomedCameraPosition.x - originalCameraPosition.x) * eased;
            camera.position.y = originalCameraPosition.y + (zoomedCameraPosition.y - originalCameraPosition.y) * eased;
            camera.position.z = originalCameraPosition.z + (zoomedCameraPosition.z - originalCameraPosition.z) * eased;
            camera.lookAt(zoomLookAt.x, zoomLookAt.y, zoomLookAt.z); // Look at the number area
        }
    } else {
        if (zoomProgress > 0) {
            zoomProgress = Math.max(zoomProgress - 0.05, 0);
            const t = zoomProgress;
            const eased = t * t * (3 - 2 * t);
            camera.position.x = originalCameraPosition.x + (zoomedCameraPosition.x - originalCameraPosition.x) * eased;
            camera.position.y = originalCameraPosition.y + (zoomedCameraPosition.y - originalCameraPosition.y) * eased;
            camera.position.z = originalCameraPosition.z + (zoomedCameraPosition.z - originalCameraPosition.z) * eased;
            camera.lookAt(0, 0, 0); // Look at scene center
        }
    }

    renderer.render(scene, camera);
}

console.log('Starting animation loop');
console.log('Scene children count:', scene.children.length);
console.log('Camera position:', camera.position);
animate();
