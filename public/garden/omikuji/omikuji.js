import * as THREE from 'three';
import { getFortuneByNumber } from './data.js';

console.log('Omikuji script loading...');
console.log('THREE version:', THREE.REVISION);

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
        saveImage: '画像として保存',
        numberLabel: '番号:',
        viewBtn: '表示',
        closeBtn: '閉じる',
        instructionText: 'セクションをタップして翻訳を表示',
        instructionBtn: 'OK',
        pickerTitle: '番号を選択',
        namePrompt: '印鑑に入れる名前を入力してください（任意、最大12文字）:',
        stampForScreenshotBtn: '名前入り印鑑を追加してシェア'
    },
    en: {
        title: 'Omikuji',
        shakeLabel: 'shakes',
        bottomTextInitial: 'Shake the container!',
        bottomTextShake: 'Shake it out',
        getOmikujiBtn: 'Get omikuji',
        checkFortuneBtn: 'Check your fortune',
        startOver: 'Start over',
        saveImage: 'Save as image',
        numberLabel: 'Fortune #:',
        viewBtn: 'View',
        closeBtn: 'Close',
        instructionText: 'Tap any section to see translation',
        instructionBtn: 'OK',
        pickerTitle: 'Select Fortune Number',
        namePrompt: 'Enter your name for the seal (optional, max 12 characters):',
        stampForScreenshotBtn: 'Add stamp with your name to share'
    },
    ko: {
        title: '오미쿠지',
        shakeLabel: '번',
        bottomTextInitial: '용기를 흔들어!',
        bottomTextShake: '흔들어 빼내세요',
        getOmikujiBtn: '오미쿠지 뽑기',
        checkFortuneBtn: '운세 확인',
        startOver: '다시 시작',
        saveImage: '이미지로 저장',
        numberLabel: '번호:',
        viewBtn: '보기',
        closeBtn: '닫기',
        instructionText: '섹션을 탭하여 번역 보기',
        instructionBtn: 'OK',
        pickerTitle: '번호 선택',
        namePrompt: '도장에 넣을 이름을 입력하세요 (선택사항, 최대 12자):',
        stampForScreenshotBtn: '이름이 들어간 도장을 추가하여 공유'
    }
};

function updateLanguage(lang) {
    currentLanguage = lang;
    document.body.classList.toggle('no-tooltips', lang === 'jp');
    const t = translations[lang];

    const title = document.getElementById('title');
    const shakeLabel = document.getElementById('shake-label');
    const bottomText = document.getElementById('bottom-text');
    const takeOmikujiBtn = document.getElementById('take-omikuji-btn');
    const readFortuneBtn = document.getElementById('read-fortune-btn');
    const startOverLink = document.getElementById('start-over-link');
    const saveFortuneBtn = document.getElementById('save-fortune-btn');
    const languageToggle = document.getElementById('language-toggle');
    const viewBtnText = document.getElementById('view-btn-text');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const instructionText = document.getElementById('instruction-text');
    const instructionCloseBtn = document.getElementById('instruction-close-btn');
    const pickerTitle = document.getElementById('picker-title');

    if (title) title.textContent = t.title;
    if (shakeLabel) shakeLabel.textContent = t.shakeLabel;
    if (takeOmikujiBtn) takeOmikujiBtn.textContent = t.getOmikujiBtn;
    if (readFortuneBtn) readFortuneBtn.textContent = t.checkFortuneBtn;
    if (startOverLink) startOverLink.textContent = t.startOver;
    if (saveFortuneBtn) {
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        saveFortuneBtn.textContent = isMobileDevice
            ? t.stampForScreenshotBtn
            : t.saveImage;
    }
    if (viewBtnText) viewBtnText.textContent = t.viewBtn;
    if (closeModalBtn) closeModalBtn.textContent = t.closeBtn;
    if (instructionText) instructionText.textContent = t.instructionText;
    if (instructionCloseBtn) instructionCloseBtn.textContent = t.instructionBtn;
    if (pickerTitle) pickerTitle.textContent = t.pickerTitle;

    if (bottomText && bottomText.style.display !== 'none') {
        if (currentState === State.IDLE) {
            bottomText.textContent = t.bottomTextInitial;
        } else if (currentState === State.SHAKING || currentState === State.FLIPPING) {
            bottomText.textContent = t.bottomTextShake;
        }
    }

    if (languageToggle) {
        const svg = languageToggle.querySelector('svg');
        const langText = lang === 'jp' ? 'JP' : lang === 'en' ? 'EN' : 'KO';

        if (svg) {
            languageToggle.innerHTML = '';
            languageToggle.appendChild(svg);
            languageToggle.appendChild(document.createTextNode(langText));
        } else {
            languageToggle.textContent = langText;
        }
    }

    console.log('Language updated to:', lang);
}

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

function createHexagonalCylinder() {
    const group = new THREE.Group();

    const radius = 1.2;
    const height = 4;
    const segments = 6;

    const woodMaterial = new THREE.MeshToonMaterial({
        color: 0xD2B48C,
        gradientMap: createToonGradient()
    });

    const geometry = new THREE.CylinderGeometry(radius, radius, height, segments, 1);
    const cylinder = new THREE.Mesh(geometry, woodMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.rotation.y = Math.PI / 6;
    group.add(cylinder);

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

    const holeRadius = 0.15;

    const hexShapeWithHole = hexShape.clone();

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

    const capGeometry = new THREE.ShapeGeometry(hexShape);

    const bottomCap = new THREE.Mesh(capGeometry, woodMaterial);
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.rotation.z = Math.PI / 6; // Match cylinder rotation
    bottomCap.position.y = -height / 2;
    group.add(bottomCap);

    const holeDepth = 0.2;

    const holeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000, // Pure black
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true
    });

    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 32);
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.y = height / 2 - holeDepth / 2;
    group.add(hole);

    const holeCapGeometry = new THREE.CircleGeometry(holeRadius, 32);
    const holeCap = new THREE.Mesh(holeCapGeometry, holeMaterial);
    holeCap.rotation.x = -Math.PI / 2; // Face upward
    holeCap.position.y = height / 2 - holeDepth;
    group.add(holeCap);

    const holeTopCap = new THREE.Mesh(
        new THREE.RingGeometry(holeRadius, holeRadius + 0.001, 32),
        holeMaterial
    );
    holeTopCap.rotation.x = -Math.PI / 2;
    holeTopCap.position.y = height / 2;
    group.add(holeTopCap);

    addEngravedText(group, radius);

    console.log('Hexagonal cylinder created');
    return group;
}

async function addEngravedText(group, radius) {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 70px "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = 'おみくじ';
    const chars = text.split('');
    const startY = 100;
    const spacing = 100;

    chars.forEach((char, i) => {
        ctx.fillText(char, canvas.width / 2, startY + i * spacing);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.FrontSide
    });

    const textPlane = new THREE.PlaneGeometry(1.2, 2.4);

    const distanceToFace = radius * Math.cos(Math.PI / 6);

    const textMeshFront = new THREE.Mesh(textPlane, textMaterial);
    textMeshFront.position.set(0, 0, distanceToFace + 0.05);
    group.add(textMeshFront);

    const textMeshBack = new THREE.Mesh(textPlane, textMaterial.clone());
    textMeshBack.position.set(0, 0, -(distanceToFace + 0.05));
    textMeshBack.rotation.y = Math.PI; // Rotate 180° so text faces outward
    group.add(textMeshBack);

    console.log('Text added to container');
}

function numberToKanji(num) {
    const ones = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const tens = ['', '十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十'];

    if (num === 100) return '百';
    if (num < 10) return ones[num];

    const tenDigit = Math.floor(num / 10);
    const oneDigit = num % 10;

    return tens[tenDigit] + ones[oneDigit];
}

function createFortuneStick() {
    const stickGroup = new THREE.Group();

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

    const tipHeight = 0.3;
    const tipGeometry = new THREE.BoxGeometry(stickWidth, tipHeight, stickDepth);
    const tipMaterial = new THREE.MeshToonMaterial({
        color: 0xCC0000,
        gradientMap: createToonGradient()
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.y = (stickLength / 2) + (tipHeight / 2);
    stickGroup.add(tip);

    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide, // Only render back faces to create outline
        depthWrite: false
    });
    const totalGlowHeight = stickLength + tipHeight; // 3.0 + 0.3 = 3.3
    const glowGeometry = new THREE.BoxGeometry(stickWidth * 1.4, totalGlowHeight, stickDepth * 1.4);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.y = tipHeight / 2; // Center the glow to cover entire stick
    glowMesh.visible = false; // Hidden by default
    glowMesh.name = 'stickGlow';
    glowMesh.renderOrder = -1; // Render behind stick
    stickGroup.add(glowMesh);

    stickGroup.position.set(0, 0, 0);
    stickGroup.visible = false;

    return stickGroup;
}

async function addFortuneNumberToStick(stickGroup, number) {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024; // Tall for vertical text
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const kanji = numberToKanji(number);
    const chars = kanji.split('');

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 160px "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';

    chars.forEach((char, i) => {
        ctx.fillText(char, canvas.width / 2, 200 + (i * 220));
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy()); // Keeps text sharp at angles

    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1, // Discards transparent pixels to prevent "box" artifacts
        side: THREE.FrontSide
    });

    const textPlane = new THREE.PlaneGeometry(0.12, 0.8);
    const textMesh = new THREE.Mesh(textPlane, textMaterial);

    textMesh.position.set(0, 1.1, 0.017);

    textMesh.rotation.z = Math.PI;

    textMesh.name = 'fortuneNumber';
    stickGroup.add(textMesh);

    console.log(`Kanji "${kanji}" applied to stick face.`);
}

const shakeSound = new Audio('shakesound.wav');
let audioInitialized = false;

function initializeAudio() {
    if (!audioInitialized) {
        shakeSound.load();
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

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let angularVelocity = { x: 0, y: 0 };
let shakeIntensity = 0;
let shakeCount = 0;
let lastShakeTime = 0;
let hasShaken = false; // Track if user has shaken at least once

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringStick = false;
let isZoomedIn = false;
let zoomProgress = 0;
const originalCameraPosition = { x: 0, y: 0, z: 8 };
const zoomedCameraPosition = { x: 0, y: -1.2, z: 2.5 };
const zoomLookAt = { x: 0, y: -1.0, z: 0 }; // Look directly at the stick/number area

const omikujiContainer = createHexagonalCylinder();
scene.add(omikujiContainer);

const fortuneStick = createFortuneStick();
omikujiContainer.add(fortuneStick);

console.log('Container added to scene');

const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -3;
ground.receiveShadow = true;
scene.add(ground);

let isUsingDeviceOrientation = false;
let lastOrientation = { beta: null, gamma: null };

function onPointerDown(e) {
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

    angularVelocity.y += deltaX * 0.001;
    angularVelocity.x += deltaY * 0.001;

    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if ((currentState === State.IDLE || currentState === State.SHAKING) && movement > 10) {
        shakeIntensity = Math.min(shakeIntensity + movement * 0.02, 2.0);

        const now = Date.now();
        if (now - lastShakeTime > 250) {
            shakeSound.currentTime = 0;
            shakeSound.play().catch(e => console.log('Audio play failed:', e));

            if (currentState === State.IDLE && !hasShaken) {
                hasShaken = true;
                const bottomText = document.getElementById('bottom-text');
                const takeBtn = document.getElementById('take-omikuji-btn');
                const shakeCountEl = document.getElementById('shake-count');
                const shakeValueEl = document.getElementById('shake-value');

                if (bottomText) bottomText.style.display = 'none';
                if (takeBtn) takeBtn.style.display = 'inline-block';

                if (shakeCountEl && shakeValueEl) {
                    shakeCountEl.style.display = 'block';
                    shakeValueEl.textContent = '1'; // First shake
                }
            } else if (currentState === State.IDLE && hasShaken) {
                const shakeValueEl = document.getElementById('shake-value');
                if (shakeValueEl) {
                    const currentShakes = parseInt(shakeValueEl.textContent) + 1;
                    shakeValueEl.textContent = currentShakes;
                }
            }

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

function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (currentState === State.FINISHED || currentState === State.EMERGING) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fortuneStick.children, true);

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

function onClick(e) {
    if (currentState === State.FINISHED && !isDragging) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fortuneStick.children, true);

        if (intersects.length > 0 || isZoomedIn) {
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
}

if (renderer.domElement) {
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('mouseleave', onPointerUp);
    renderer.domElement.addEventListener('click', onClick);

    renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: false });
    renderer.domElement.addEventListener('touchmove', onPointerMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onPointerUp);

    let firstTouch = true;
    renderer.domElement.addEventListener('touchstart', () => {
        if (firstTouch) {
            requestOrientationPermission();
            firstTouch = false;
        }
    });
}

window.addEventListener('mousemove', onMouseMove);

const languageToggle = document.getElementById('language-toggle');
if (languageToggle) {
    languageToggle.addEventListener('click', () => {
        if (currentLanguage === 'jp') {
            updateLanguage('en');
        } else if (currentLanguage === 'en') {
            updateLanguage('ko');
        } else {
            updateLanguage('jp');
        }
    });
}

const takeOmikujiBtn = document.getElementById('take-omikuji-btn');
if (takeOmikujiBtn) {
    takeOmikujiBtn.addEventListener('click', () => {
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

            fortuneStick.userData.hasText = false;
            fortuneStick.visible = true;

            const textMesh = fortuneStick.children.find(child => child.geometry?.type === 'PlaneGeometry' && child !== fortuneStick.children[0] && child !== fortuneStick.children[1]);
            if (textMesh) {
                fortuneStick.remove(textMesh);
            }

            takeOmikujiBtn.style.display = 'none';
            const bottomText = document.getElementById('bottom-text');
            const shakeCountEl = document.getElementById('shake-count');

            if (bottomText) {
                bottomText.textContent = translations[currentLanguage].bottomTextShake;
                bottomText.style.display = 'block';
            }

            if (shakeCountEl) {
                shakeCountEl.style.display = 'none';
            }
        }
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);

    const now = Date.now();

    switch (currentState) {
        case State.IDLE:
            omikujiContainer.rotation.x += angularVelocity.x;
            omikujiContainer.rotation.y += angularVelocity.y;

            const maxTilt = Math.PI / 8; // 22.5 degrees max tilt
            omikujiContainer.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, omikujiContainer.rotation.x));

            if (shakeIntensity > 0 && isDragging) {
                const shake = Math.sin(now * 0.1) * shakeIntensity * 0.15;
                omikujiContainer.position.y = shake;
                shakeIntensity *= 0.85; // Faster decay
            } else {
                omikujiContainer.position.y = 0;
                shakeIntensity = 0; // Stop immediately when not dragging
            }

            if (!isDragging) {
                const springStrength = 0.02;
                angularVelocity.x -= omikujiContainer.rotation.x * springStrength;
            }

            if (!isDragging && Math.abs(angularVelocity.y) < 0.001) {
                omikujiContainer.rotation.y += 0.005;
            }

            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.FLIPPING:
            flipProgress += 0.015; // Control speed of the lift/flip

            if (flipProgress < 1.0) {
                const t = flipProgress;
                const eased = t * t * (3 - 2 * t);

                omikujiContainer.position.y = eased * targetYPosition;
                omikujiContainer.rotation.x = eased * Math.PI;
            } else {
                omikujiContainer.position.y = targetYPosition;
                omikujiContainer.rotation.x = Math.PI;
                currentState = State.SHAKING;

                shakeCount = 0;
                document.getElementById('instruction').textContent = `Shake ${requiredShakes} time${requiredShakes > 1 ? 's' : ''} to get the stick out`;
                document.getElementById('shake-count').style.display = 'block';
                document.getElementById('shake-value').textContent = '0';
                document.getElementById('required-shakes').textContent = requiredShakes;
            }
            break;

        case State.SHAKING:
            if (shakeIntensity > 0 && isDragging) {
                const shakeOffset = Math.sin(now * 0.2) * shakeIntensity * 0.1;
                omikujiContainer.position.y = targetYPosition + shakeOffset;
                shakeIntensity *= 0.85; // Faster decay
            } else {
                omikujiContainer.position.y = targetYPosition;
                shakeIntensity = 0; // Stop immediately when not dragging
            }

            omikujiContainer.rotation.y += angularVelocity.y;

            if (!isDragging) {
                const tiltSpring = (omikujiContainer.rotation.x - Math.PI) * 0.1;
                omikujiContainer.rotation.x -= tiltSpring;
            } else {
                omikujiContainer.rotation.x += angularVelocity.x;
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.EMERGING:
            if (stickProgress < 1.0) {
                stickProgress += 0.01; // Slow emergence
                fortuneStick.position.y = stickProgress * 2.0;
                fortuneStick.visible = true;

                if (stickProgress > 0.1 && !fortuneStick.userData.hasText) {
                    addFortuneNumberToStick(fortuneStick, fortuneNumber);
                    fortuneStick.userData.hasText = true;
                }
            } else {
                currentState = State.FINISHED;

                const bottomText = document.getElementById('bottom-text');
                const readFortuneBtn = document.getElementById('read-fortune-btn');
                const startOverLink = document.getElementById('start-over-link');

                if (bottomText) bottomText.style.display = 'none';
                if (readFortuneBtn) readFortuneBtn.style.display = 'inline-block';
                if (startOverLink) startOverLink.style.display = 'block';
            }

            omikujiContainer.position.y = targetYPosition;

            omikujiContainer.rotation.y += angularVelocity.y;
            if (isDragging) {
                omikujiContainer.rotation.x += angularVelocity.x;
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;

        case State.FINISHED:
            omikujiContainer.position.y = targetYPosition;

            omikujiContainer.rotation.y += angularVelocity.y;
            if (isDragging) {
                omikujiContainer.rotation.x += angularVelocity.x;
                const maxDeviation = Math.PI / 8;
                omikujiContainer.rotation.x = Math.max(Math.PI - maxDeviation, Math.min(Math.PI + maxDeviation, omikujiContainer.rotation.x));
            }

            angularVelocity.x *= 0.9;
            angularVelocity.y *= 0.9;
            break;
    }

    if (zoomProgress > 0) {
        const t = zoomProgress;
        const eased = t * t * (3 - 2 * t); // Smooth easing
        camera.position.x = originalCameraPosition.x + (zoomedCameraPosition.x - originalCameraPosition.x) * eased;
        camera.position.y = originalCameraPosition.y + (zoomedCameraPosition.y - originalCameraPosition.y) * eased;
        camera.position.z = originalCameraPosition.z + (zoomedCameraPosition.z - originalCameraPosition.z) * eased;

        const lookAtX = 0 + (zoomLookAt.x - 0) * eased;
        const lookAtY = 0 + (zoomLookAt.y - 0) * eased;
        const lookAtZ = 0 + (zoomLookAt.z - 0) * eased;
        camera.lookAt(lookAtX, lookAtY, lookAtZ);
    } else {
        camera.lookAt(0, 0, 0);
    }

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


    const fortuneTypeEl = document.getElementById('fortune-type');
    if (fortuneTypeEl) {
        fortuneTypeEl.innerHTML = createRubyText(fortune.fortune_jp, fortune.furigana_parts);

        if (currentLanguage === 'ko') {
            fortuneTypeEl.setAttribute('data-tip', `운세:<br>${fortune.gloss_ko}`);
        } else if (currentLanguage === 'en') {
            fortuneTypeEl.setAttribute('data-tip', `Fortune:<br>${fortune.gloss_en}`);
        } else {
            fortuneTypeEl.removeAttribute('data-tip');
        }
    }

    const fortuneNumberEl = document.getElementById('fortune-number');
    if (fortuneNumberEl) {
        const kanji = numberToKanji(fortuneNumber);
        fortuneNumberEl.textContent = kanji + '番';

        if (currentLanguage === 'ko') {
            fortuneNumberEl.setAttribute('data-tip', `번호:<br>${fortuneNumber}번`);
        } else if (currentLanguage === 'en') {
            fortuneNumberEl.setAttribute('data-tip', `Number:<br>${fortuneNumber}`);
        } else {
            fortuneNumberEl.removeAttribute('data-tip');
        }
    }

    const shrineTitleEl = document.getElementById('shrine-title');
    if (shrineTitleEl) {
        if (currentLanguage === 'ko') {
            shrineTitleEl.setAttribute('data-tip', '인터넷 본궁<br>브릭 신사');
        } else if (currentLanguage === 'en') {
            shrineTitleEl.setAttribute('data-tip', 'Internet Hongu<br>Brixton Shrine Fortune');
        } else {
            shrineTitleEl.removeAttribute('data-tip');
        }
    }

    const mainFortuneEl = document.getElementById('main-fortune-content');
    if (mainFortuneEl && fortune.sections.unsei) {
        const parts = fortune.sections.unsei.jp_parts || [fortune.sections.unsei.jp];
        mainFortuneEl.innerHTML = `<div>${parts.join('<br>')}</div>`;

        if (currentLanguage === 'ko') {
            const koParts = fortune.sections.unsei.ko_parts || [fortune.sections.unsei.ko];
            mainFortuneEl.setAttribute('data-tip', `${fortune.sections.unsei.category_ko}:<br>${koParts.join(' ')}`);
        } else if (currentLanguage === 'en') {
            mainFortuneEl.setAttribute('data-tip', `${fortune.sections.unsei.category_en}:<br>${fortune.sections.unsei.en}`);
        } else {
            mainFortuneEl.removeAttribute('data-tip');
        }
    }

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

    const labels = sectionLabels.jp;

    const itemsTopEl = document.getElementById('items-top-content');
    if (itemsTopEl) {
        itemsTopEl.innerHTML = '';
        sectionOrder.slice(0, 5).forEach(sectionId => {
            const section = fortune.sections[sectionId];
            if (section) {
                const label = labels[sectionId];
                const span = document.createElement('span');
                span.className = 'item-line tip';

                span.innerHTML = `<b>${label}</b>　　${section.jp}`;

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

    const itemsBottomEl = document.getElementById('items-bottom-content');
    if (itemsBottomEl) {
        itemsBottomEl.innerHTML = '';
        sectionOrder.slice(5, 10).forEach(sectionId => {
            const section = fortune.sections[sectionId];
            if (section) {
                const label = labels[sectionId];
                const span = document.createElement('span');
                span.className = 'item-line tip';

                span.innerHTML = `<b>${label}</b>　　${section.jp}`;

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

    const overlay = document.getElementById('fortune-modal-overlay');
    if (overlay) {
        overlay.classList.remove('screenshot-mode');
    }
    const liveStamp = document.getElementById('seal-stamp-overlay');
    if (liveStamp && liveStamp.parentNode) {
        liveStamp.parentNode.removeChild(liveStamp);
    }
    const saveBtnEl = document.getElementById('save-fortune-btn');
    if (saveBtnEl) {
        saveBtnEl.style.display = 'inline-block';
    }


    initializeTooltips();

    const modalOverlay = document.getElementById('fortune-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
    }

    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    const hasSeenInstruction = sessionStorage.getItem('hasSeenTooltipInstruction');

    if (isMobile && !hasSeenInstruction && (currentLanguage === 'en' || currentLanguage === 'ko')) {
        const instructionModal = document.getElementById('mobile-instruction-modal');
        if (instructionModal) {
            instructionModal.style.display = 'flex';
            sessionStorage.setItem('hasSeenTooltipInstruction', 'true');
        }
    }
}
function initializeTooltips() {
    const tooltip = document.getElementById('tooltip');
    const tips = document.querySelectorAll('.tip');
    const isMobile = window.matchMedia("(max-width: 600px)").matches;

    tips.forEach(t => {
        const newTip = t.cloneNode(true);
        t.parentNode.replaceChild(newTip, t);
    });

    const newTips = document.querySelectorAll('.tip');

    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.classList.remove('mobile-active');
    }

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

                const isCurrentlyActive = tooltip.classList.contains('mobile-active') &&
                                         tooltip.innerHTML === tipText;

                if (isCurrentlyActive) {
                    tooltip.style.opacity = '0';
                    tooltip.classList.remove('mobile-active');
                } else {
                    tooltip.innerHTML = tipText;
                    tooltip.classList.add('mobile-active');
                    tooltip.style.opacity = '1';

                    const rect = t.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.bottom + 10) + 'px';
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (isMobile && tooltip) {
            const clickedTip = e.target.closest('.tip');
            if (!clickedTip) {
                tooltip.style.opacity = '0';
                tooltip.classList.remove('mobile-active');
            }
        }
    });
}


const readFortuneBtn = document.getElementById('read-fortune-btn');
if (readFortuneBtn) {
    readFortuneBtn.addEventListener('click', () => {
        displayFortuneModal(fortuneNumber);
    });
}

const mobileNumberPicker = document.getElementById('mobile-number-picker');
const numberPickerList = document.getElementById('number-picker-list');
const pickerClose = document.getElementById('picker-close');

if (numberPickerList) {
    for (let i = 1; i <= 100; i++) {
        const item = document.createElement('div');
        item.className = 'number-picker-item';
        item.textContent = i;
        item.dataset.number = i;
        item.addEventListener('click', () => {
            if (fortuneNumberInput) {
                fortuneNumberInput.value = i;
            }
            if (mobileNumberPicker) {
                mobileNumberPicker.classList.remove('active');
            }
            displayFortuneModal(i);
        });
        numberPickerList.appendChild(item);
    }
}

if (pickerClose && mobileNumberPicker) {
    pickerClose.addEventListener('click', () => {
        mobileNumberPicker.classList.remove('active');
    });
}

if (mobileNumberPicker) {
    mobileNumberPicker.addEventListener('click', (e) => {
        if (e.target === mobileNumberPicker) {
            mobileNumberPicker.classList.remove('active');
        }
    });
}

const viewFortuneBtn = document.getElementById('view-fortune-btn');
const fortuneNumberInput = document.getElementById('fortune-number-input');
if (viewFortuneBtn && fortuneNumberInput) {
    viewFortuneBtn.addEventListener('click', () => {
        const inputNumber = parseInt(fortuneNumberInput.value);
        if (inputNumber >= 1 && inputNumber <= 100) {
            displayFortuneModal(inputNumber);
        } else {
            alert('Please enter a number between 1 and 100');
        }
    });

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        fortuneNumberInput.addEventListener('click', (e) => {
            e.preventDefault();
            fortuneNumberInput.blur(); // Prevent keyboard
            if (mobileNumberPicker) {
                mobileNumberPicker.classList.add('active');
                const currentValue = parseInt(fortuneNumberInput.value);
                if (currentValue >= 1 && currentValue <= 100) {
                    setTimeout(() => {
                        const selectedItem = numberPickerList.querySelector(`[data-number="${currentValue}"]`);
                        if (selectedItem) {
                            selectedItem.scrollIntoView({ block: 'center' });
                            selectedItem.classList.add('selected');
                        }
                    }, 100);
                }
            }
        });

        fortuneNumberInput.setAttribute('readonly', 'readonly');
    } else {
        fortuneNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                viewFortuneBtn.click();
            }
        });
    }
}



function createSealStamp(fortuneNumber, userName = '') {
    const fortune = getFortuneByNumber(fortuneNumber);
    if (!fortune) return null;

    const luckNameMapEN = {
        daikichi: 'BEST LUCK',
        kichi: 'GOOD LUCK',
        chukichi: 'MEDIUM LUCK',
        shokichi: 'LITTLE LUCK',
        hankichi: 'HALF LUCK',
        suekichi: 'FUTURE LUCK',
        sue_shokichi: 'FUTURE LITTLE LUCK',
        kyo: 'BAD LUCK',
        shokyo: 'WORSE LUCK',
        hankyo: 'HALF BAD LUCK',
        suekyou: 'FUTURE BAD LUCK',
        daikyou: 'WORST LUCK'
    };

    let luckName;

    if (currentLanguage === 'ko') {
        luckName = fortune.fortune_ko || fortune.gloss_ko || '행운';
    } else if (currentLanguage === 'jp') {
        luckName = fortune.fortune_jp || 'おみくじ';
    } else {
        luckName = luckNameMapEN[fortune.id] || fortune.fortune_en || 'GOOD LUCK';
    }

    const canvas = document.createElement('canvas');
    const size = 220;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const red = '#b32428';
    const cx = size / 2;
    const cy = size / 2;

    ctx.strokeStyle = red;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = red;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let nameStr = (userName || 'NAME').toUpperCase().substring(0, 12);
    ctx.font = 'bold 22px sans-serif';
    while (ctx.measureText(nameStr).width > 100) {
        const parts = ctx.font.split(' ');
        const sizePart = parts[1] || '22px';
        const numeric = parseFloat(sizePart);
        const newSize = numeric - 0.5;
        ctx.font = 'bold ' + newSize + 'px sans-serif';
    }
    ctx.fillText(nameStr, cx, cy - 72);

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 48);
    ctx.lineTo(cx + 48, cy - 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy + 38);
    ctx.lineTo(cx + 48, cy + 38);
    ctx.stroke();

    const numStr = fortuneNumber.toString();
    ctx.font = (numStr.length === 3 ? '900 62px "Yu Mincho", serif' : '900 78px "Yu Mincho", serif');
    ctx.fillText(numStr, cx, cy - 5);

    const words = luckName.split(' ');
    let lines;
    if (words.length === 3) {
        lines = [words[0] + ' ' + words[1], words[2]];
    } else if (words.length === 2) {
        lines = [words[0], words[1]];
    } else {
        lines = [luckName];
    }

    if (lines.length === 2) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(lines[0], cx, cy + 54);
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(lines[1], cx, cy + 72);
    } else {
        ctx.font = 'bold 20px sans-serif';
        while (ctx.measureText(lines[0]).width > 110) {
            const parts = ctx.font.split(' ');
            const sizePart = parts[1] || '20px';
            const numeric = parseFloat(sizePart);
            const newSize = numeric - 0.5;
            ctx.font = 'bold ' + newSize + 'px sans-serif';
        }
        ctx.fillText(lines[0], cx, cy + 60);
    }

    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 90; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    const stampDiv = document.createElement('div');
    stampDiv.id = 'seal-stamp-overlay';
    stampDiv.style.cssText =
        'position:absolute; bottom:100px; right:25px; width:' +
        size +
        'px; height:' +
        size +
        'px; transform:rotate(-6deg); z-index:1000; pointer-events:none;';
    stampDiv.appendChild(canvas);
    return stampDiv;
}

function buildExportPaper(fortune, fortuneNumber) {
    const wrapper = document.createElement('div');

    const unsei = fortune.sections.unsei;
    const unseiLines = unsei ? (unsei.jp_parts || [unsei.jp]) : [''];

    const sectionOrder = [
        'ganbou',
        'tabi_dachi',
        'shobai',
        'kin_un',
        'en_dan',
        'byoki',
        'arasai_goto',
        'hogaku',
        'sns',
        'advice'
    ];

    const sectionLabels = {
        ganbou: '願望',
        tabi_dachi: '旅立ち',
        shobai: '商売',
        kin_un: '金運',
        en_dan: '縁談',
        byoki: '病気',
        arasai_goto: '争い事',
        hogaku: '方角',
        sns: 'ＳＮＳ',
        advice: '助言'
    };

    const topIds = sectionOrder.slice(0, 5);
    const bottomIds = sectionOrder.slice(5, 10);

    function buildItemsHtml(ids) {
        return ids
            .map(function (id) {
                const s = fortune.sections[id];
                if (!s) return '';
                const label = sectionLabels[id] || '';
                return '<span class="item-line"><b>' + label + '</b>　　' + s.jp + '</span>';
            })
            .join('');
    }

    const topItemsHtml = buildItemsHtml(topIds);
    const bottomItemsHtml = buildItemsHtml(bottomIds);
    const unseiHtml = unseiLines.join('<br>');

    wrapper.innerHTML =
        '<div class="omikuji-paper export-paper">' +
        '  <div class="frame">' +
        '    <div class="header-row">' +
        '      <div class="h-cell v-text center-content bold header-text">' +
        fortune.fortune_jp +
        '      </div>' +
        '      <div class="h-cell v-text center-content header-text">' +
        '        <div class="title-container">' +
        '          <ruby>電<rt>でん</rt></ruby><ruby>脳<rt>のう</rt></ruby><ruby>本<rt>ほん</rt></ruby><ruby>宮<rt>ぐう</rt></ruby><br>' +
        '          <ruby>振<rt>ぶり</rt></ruby><ruby>楠<rt>くす</rt></ruby><ruby>神<rt>じん</rt></ruby><ruby>社<rt>じゃ</rt></ruby><ruby>籤<rt>くじ</rt></ruby>' +
        '        </div>' +
        '      </div>' +
        '      <div class="h-cell v-text center-content bold header-text">' +
        numberToKanji(fortuneNumber) +
        '番' +
        '      </div>' +
        '    </div>' +
        '    <div class="body-row">' +
        '      <div class="body-left-col">' +
        '        <div class="items-stack">' +
        '          <div class="items-half items-top">' +
        '            <div class="v-text text-cell items-text">' +
        topItemsHtml +
        '            </div>' +
        '          </div>' +
        '          <div class="items-half">' +
        '            <div class="v-text text-cell items-text">' +
        bottomItemsHtml +
        '            </div>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '      <div class="body-right-col">' +
        '        <div class="v-text text-cell main-fortune-text center-content">' +
        '          <div>' +
        unseiHtml +
        '</div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="footer">' +
        '    振楠神社社務所（<a href="https://brixton.zip">brixton.zip</a>）' +
        '  </div>' +
        '</div>';

    return wrapper.firstElementChild;
}

const saveFortuneBtn = document.getElementById('save-fortune-btn')
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

if (saveFortuneBtn) {
  saveFortuneBtn.addEventListener('click', async function () {
    const userName = prompt(translations[currentLanguage].namePrompt) || ''

    

if (isMobileDevice) {
  const overlay = document.getElementById('fortune-modal-overlay')
  const paper = document.querySelector('#fortune-modal-overlay .omikuji-paper')

  if (overlay && paper) {
    const existing = document.getElementById('seal-stamp-overlay')
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing)
    }

    const stampDiv = createSealStamp(fortuneNumber, userName)
    if (stampDiv) {
      const rect = paper.getBoundingClientRect()

      const top = Math.max(rect.top - 16, 8)
      const left = Math.max(rect.left - 80, -40)

      stampDiv.style.position = 'absolute'
      stampDiv.style.top = top + 'px'
      stampDiv.style.left = left + 'px'
      stampDiv.style.bottom = 'auto'
      stampDiv.style.right = 'auto'
      stampDiv.style.transformOrigin = 'top left'
      stampDiv.style.transform = 'scale(0.8) rotate(-6deg)'
      stampDiv.style.zIndex = '99999'
      stampDiv.style.pointerEvents = 'none'

      document.body.appendChild(stampDiv)
    }
                overlay.classList.add('screenshot-mode');

                let screenshotFooter = document.getElementById('screenshot-footer');
                if (!screenshotFooter) {
                    screenshotFooter = document.createElement('div');
                    screenshotFooter.id = 'screenshot-footer';
                    screenshotFooter.textContent = 'brixton.zip';

                    screenshotFooter.style.position = 'fixed';
                    screenshotFooter.style.left = '0';
                    screenshotFooter.style.right = '0';
                    screenshotFooter.style.bottom = '0';
                    screenshotFooter.style.padding = '6px 0';
                    screenshotFooter.style.textAlign = 'center';
                    screenshotFooter.style.background = '#ffffff';
                    screenshotFooter.style.color = '#000000';
                    screenshotFooter.style.fontSize = '12px';
                    screenshotFooter.style.letterSpacing = '0.12em';
                    screenshotFooter.style.borderTop = '1px solid #000000';
                    screenshotFooter.style.zIndex = '9999';
                    screenshotFooter.style.pointerEvents = 'none';

                    overlay.appendChild(screenshotFooter);
                }

                saveFortuneBtn.style.display = 'none';
            }

            return;
        }

        try {
            saveFortuneBtn.style.display = 'none';

            const fortune = getFortuneByNumber(fortuneNumber);
            if (!fortune) {
                console.error('No fortune for number', fortuneNumber);
                return;
            }

            const sandbox = document.createElement('div');
            sandbox.style.cssText = 'position:fixed; top:0; left:-9999px; width:400px; background:white;';
            document.body.appendChild(sandbox);

            const exportPaper = buildExportPaper(fortune, fortuneNumber);
            sandbox.appendChild(exportPaper);

            const sealStamp = createSealStamp(fortuneNumber, userName);
            if (sealStamp) {
                exportPaper.appendChild(sealStamp);
            }

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
            await new Promise(function (r) {
                setTimeout(r, 150);
            });

            const scale = 2;
            const width = 400;
            const height = exportPaper.scrollHeight;

            const dataUrl = await domtoimage.toPng(exportPaper, {
                width: width * scale,
                height: height * scale,
                style: {
                    transform: 'scale(' + scale + ')',
                    transformOrigin: 'top left',
                    width: width + 'px',
                    height: height + 'px',
                    visibility: 'visible'
                }
            });

            document.body.removeChild(sandbox);

            if (navigator.share) {
                try {
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], 'omikuji.png', { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: 'My Omikuji' });
                        saveFortuneBtn.style.display = 'block';
                        return;
                    }
                } catch (err) {
                    console.log('Web Share failed, falling back to download', err);
                }
            }

            const link = document.createElement('a');
            link.download = 'omikuji-fortune-' + fortuneNumber + '.png';
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error('Export template save failed', e);
        } finally {
            saveFortuneBtn.style.display = 'block';
        }
    });
}

function clearScreenshotMode() {
    const overlay = document.getElementById('fortune-modal-overlay');
    if (overlay) {
        overlay.classList.remove('screenshot-mode');
    }

    const liveStamp = document.getElementById('seal-stamp-overlay');
    if (liveStamp && liveStamp.parentNode) {
        liveStamp.parentNode.removeChild(liveStamp);
    }

    const footer = document.getElementById('screenshot-footer');
    if (footer && footer.parentNode) {
        footer.parentNode.removeChild(footer);
    }

    const saveBtnEl = document.getElementById('save-fortune-btn');
    if (saveBtnEl) {
        saveBtnEl.style.display = 'inline-block';
    }
}







const modalOverlay = document.getElementById('fortune-modal-overlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
            clearScreenshotMode();
        }
    });
}

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function () {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
        clearScreenshotMode();
    });
}

const instructionCloseBtn = document.getElementById('instruction-close-btn');
const instructionModal = document.getElementById('mobile-instruction-modal');
if (instructionCloseBtn && instructionModal) {
    instructionCloseBtn.addEventListener('click', function () {
        instructionModal.style.display = 'none';
    });
}

const startOverLink = document.getElementById('start-over-link');
if (startOverLink) {
    startOverLink.addEventListener('click', function () {
        currentState = State.IDLE;
        hasShaken = false;
        shakeCount = 0;
        requiredShakes = 0;
        flipProgress = 0;
        stickProgress = 0;
        fortuneNumber = 0;
        isZoomedIn = false;
        zoomProgress = 0;

        omikujiContainer.position.y = 0;
        omikujiContainer.rotation.x = 0;
        omikujiContainer.rotation.y = 0;

        fortuneStick.visible = false;
        fortuneStick.position.y = 0;
        fortuneStick.userData.hasText = false;

        const textMesh = fortuneStick.children.find(function (child) {
            return child.name === 'fortuneNumber';
        });
        if (textMesh) {
            fortuneStick.remove(textMesh);
        }

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

        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
        clearScreenshotMode();

        console.log('Reset to initial state');
    });

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                if (currentLanguage === 'jp') {
                    document.body.classList.add('no-tooltips');
                }
            });
        } else {
            if (currentLanguage === 'jp') {
                document.body.classList.add('no-tooltips');
            }
        }
    }
}
