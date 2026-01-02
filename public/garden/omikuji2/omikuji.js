import * as THREE from 'three';
import { fortunes } from './data.js';

// --- Scene Setup (Exact Reference logic) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); dirLight.position.set(5, 10, 7); dirLight.castShadow = true; scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.2); fillLight.position.set(-5, 5, -5); scene.add(fillLight);

function createToonGradient() {
    const colors = new Uint8Array([0, 128, 200, 255]);
    const map = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
    map.needsUpdate = true; return map;
}

function createHexagonalCylinder() {
    const group = new THREE.Group();
    const radius = 1.2, height = 4;
    const woodMat = new THREE.MeshToonMaterial({ color: 0xD2B48C, gradientMap: createToonGradient() });
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 6, 1), woodMat);
    cylinder.rotation.y = Math.PI / 6; cylinder.castShadow = true; cylinder.receiveShadow = true;
    group.add(cylinder);

    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        hexShape[i === 0 ? 'moveTo' : 'lineTo'](radius * Math.cos(angle), radius * Math.sin(angle));
    }
    hexShape.closePath();
    const capGeo = new THREE.ShapeGeometry(hexShape);
    const topCap = new THREE.Mesh(capGeo, woodMat); topCap.rotation.x = -Math.PI / 2; topCap.rotation.z = Math.PI / 6; topCap.position.y = 2; group.add(topCap);
    const bottomCap = new THREE.Mesh(capGeo, woodMat); bottomCap.rotation.x = Math.PI / 2; bottomCap.rotation.z = Math.PI / 6; bottomCap.position.y = -2; group.add(bottomCap);

    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), new THREE.MeshToonMaterial({ color: 0x2a1a0f, gradientMap: createToonGradient() }));
    hole.position.y = 1.9; group.add(hole);
    addEngravedText(group, radius);
    return group;
}

async function addEngravedText(group, radius) {
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#000000'; ctx.font = 'bold 70px "Yu Mincho", serif'; ctx.textAlign = 'center';
    'おみくじ'.split('').forEach((c, i) => ctx.fillText(c, 128, 100 + i * 100));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, alphaTest: 0.5 }));
    mesh.position.set(0, 0, (radius * Math.cos(Math.PI / 6)) + 0.05); group.add(mesh);
}

function createFortuneStick() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.03), new THREE.MeshToonMaterial({ color: 0xF5DEB3 }));
    body.castShadow = true; group.add(body);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.031), new THREE.MeshBasicMaterial({ color: 0xCC0000 }));
    tip.position.y = 1.65; group.add(tip);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.5, side: THREE.BackSide }));
    glow.name = 'stickGlow'; glow.visible = false; group.add(glow);
    group.visible = false; return group;
}

function numberToKanji(num) {
    const ones = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const tens = ['', '十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十'];
    if (num === 100) return '百'; return tens[Math.floor(num/10)] + ones[num % 10];
}

async function addFortuneNumberToStick(stickGroup, number) {
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 1024;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#000000'; ctx.font = 'bold 160px "Yu Mincho", serif'; ctx.textAlign = 'center';
    numberToKanji(number).split('').forEach((c, i) => ctx.fillText(c, 256, 200 + i * 220));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, alphaTest: 0.1 }));
    mesh.position.set(0, 0.7, 0.017); mesh.rotation.z = Math.PI; 
    stickGroup.add(mesh);
}

// --- Interaction Logic ---
const shakeSound = new Audio('shakesound.wav');
const State = { IDLE: 'idle', FLIPPING: 'flipping', SHAKING: 'shaking', EMERGING: 'emerging', FINISHED: 'finished' };
let currentState = State.IDLE, fortuneNumber = 0, selectedData = null, isDragging = false, previousMousePosition = { x: 0, y: 0 }, angularVelocity = { x: 0, y: 0 }, shakeIntensity = 0, shakeCount = 0, requiredShakes = 0, lastShakeTime = 0, hasShaken = false;
let flipProgress = 0, stickProgress = 0, isZoomedIn = false, zoomProgress = 0;

const originalCameraPosition = { x: 0, y: 0, z: 8 }, zoomedCameraPosition = { x: 0, y: -1.5, z: 3 }, zoomLookAt = { x: 0, y: -1.8, z: 0 };
const containerObj = createHexagonalCylinder(); scene.add(containerObj);
const fortuneStick = createFortuneStick(); containerObj.add(fortuneStick);
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();

function openPaperFortune() {
    const f = selectedData; const s = f.sections;
    
    let rubyHtml = "";
    if (f.id === 'daikichi') rubyHtml = `<ruby>大<rt>だい</rt></ruby><ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id === 'chukichi') rubyHtml = `<ruby>中<rt>ちゅう</rt></ruby><ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id === 'shokichi') rubyHtml = `<ruby>小<rt>しょう</rt></ruby><ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id === 'kichi') rubyHtml = `<ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id === 'hankichi') rubyHtml = `<ruby>半<rt>はん</rt></ruby><ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id === 'sue_shokichi') rubyHtml = `<ruby>末<rt>すえ</rt></ruby><ruby>小<rt>しょう</rt></ruby><ruby>吉<rt>きち</rt></ruby>`;
    else if (f.id.includes('kyo')) {
        const prefix = f.fortune_jp.replace('凶', '');
        const fPrefix = f.furigana.replace('きょう', '');
        rubyHtml = `<ruby>${prefix}<rt>${fPrefix}</rt></ruby><ruby>凶<rt>きょう</rt></ruby>`;
    } else {
        rubyHtml = `<ruby>${f.fortune_jp[0]}<rt>${f.furigana.substring(0, f.furigana.length-2)}</rt></ruby><ruby>${f.fortune_jp[1]}<rt>きち</rt></ruby>`;
    }

    document.getElementById('modal-luck').innerHTML = rubyHtml;
    document.getElementById('modal-luck').dataset.tip = `Fortune: ${f.gloss_en}`;
    document.getElementById('modal-number').textContent = `${numberToKanji(fortuneNumber)}番`;
    document.getElementById('modal-number').dataset.tip = `Number: ${fortuneNumber}`;
    
    const unseiJp = s.unsei.jp.includes('。') ? s.unsei.jp.replace(/。/g, '。<br>') : s.unsei.jp;
    document.getElementById('modal-unsei').innerHTML = `<div>${unseiJp}</div>`;
    document.getElementById('modal-unsei').dataset.tip = `Unsei: ${s.unsei.en}`;

    const tKeys = [{n:'願望', k:'ganbou'}, {n:'旅立ち', k:'tabi_dachi'}, {n:'商売', k:'shobai'}, {n:'金運', k:'kin_un'}, {n:'縁談', k:'en_dan'}];
    const bKeys = [{n:'病気', k:'byoki'}, {n:'争い事', k:'arasai_goto'}, {n:'方角', k:'hogaku'}, {n:'ＳＮＳ', k:'sns'}, {n:'助言', k:'advice'}];
    
    const fmt = (keys) => keys.map(i => `<span class="item-line tip" data-tip="${i.n}: ${s[i.k].en}"><b>${i.n}</b>　${s[i.k].jp}</span>`).join('');
    document.getElementById('items-top').innerHTML = fmt(tKeys);
    document.getElementById('items-bottom').innerHTML = fmt(bKeys);

    document.getElementById('fortune-overlay').style.display = 'flex';
    setupTooltips();
}

function setupTooltips() {
    const tt = document.getElementById('tooltip');
    document.querySelectorAll('.tip').forEach(t => {
        t.onmouseenter = () => { tt.innerHTML = t.dataset.tip; tt.style.opacity = 1; };
        t.onmousemove = (e) => { tt.style.left = (e.clientX + 20) + 'px'; tt.style.top = (e.clientY + 20) + 'px'; };
        t.onmouseleave = () => tt.style.opacity = 0;
    });
}

window.addEventListener('mousedown', e => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX/window.innerWidth)*2-1; mouse.y = -(e.clientY/window.innerHeight)*2+1;
    if (!isDragging) return;
    const dx = e.clientX - previousMousePosition.x, dy = e.clientY - previousMousePosition.y;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    angularVelocity.y += dx * 0.001; angularVelocity.x += dy * 0.001;
    const move = Math.sqrt(dx*dx + dy*dy);
    if ((currentState === State.IDLE || currentState === State.SHAKING) && move > 10) {
        shakeIntensity = Math.min(shakeIntensity + move * 0.02, 2.0);
        if (Date.now() - lastShakeTime > 250) {
            shakeSound.currentTime = 0; shakeSound.play().catch(()=>{});
            if (currentState === State.IDLE) {
                if (!hasShaken) { hasShaken = true; document.getElementById('bottom-text').style.display = 'none'; document.getElementById('take-omikuji-btn').style.display = 'inline-block'; document.getElementById('shake-count').style.display = 'block'; }
                document.getElementById('shake-value').textContent = parseInt(document.getElementById('shake-value').textContent) + 1;
            }
            if (currentState === State.SHAKING) { shakeCount++; if (shakeCount >= 3) currentState = State.EMERGING; }
            lastShakeTime = Date.now();
        }
    }
});

window.addEventListener('click', (e) => {
    if (currentState === State.FINISHED && !isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObjects(fortuneStick.children, true);
        if (hit.length > 0 || isZoomedIn) isZoomedIn = !isZoomedIn;
    }
    if (e.target.id === 'fortune-overlay') location.reload();
});

document.getElementById('take-omikuji-btn').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * fortunes.length);
    selectedData = fortunes[idx]; fortuneNumber = Math.floor(Math.random() * 100) + 1;
    addFortuneNumberToStick(fortuneStick, fortuneNumber);
    currentState = State.FLIPPING; document.getElementById('take-omikuji-btn').style.display = 'none';
    document.getElementById('bottom-text').textContent = 'Shake it out'; document.getElementById('bottom-text').style.display = 'block';
    document.getElementById('shake-count').style.display = 'none'; 
});

document.getElementById('read-fortune-btn').addEventListener('click', openPaperFortune);
document.getElementById('close-modal-btn').addEventListener('click', () => location.reload());

function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();
    switch (currentState) {
        case State.IDLE:
            omikujiContainer.rotation.x += angularVelocity.x; omikujiContainer.rotation.y += angularVelocity.y;
            omikujiContainer.rotation.x = Math.max(-Math.PI/8, Math.min(Math.PI/8, omikujiContainer.rotation.x));
            if (shakeIntensity > 0 && isDragging) { omikujiContainer.position.y = Math.sin(now * 0.1) * shakeIntensity * 0.15; } else { omikujiContainer.position.y = 0; }
            if (!isDragging) { angularVelocity.x -= omikujiContainer.rotation.x * 0.02; omikujiContainer.rotation.y += 0.005; }
            break;
        case State.FLIPPING:
            flipProgress += 0.015;
            if (flipProgress < 1.0) {
                const eased = flipProgress * flipProgress * (3 - 2 * flipProgress);
                omikujiContainer.position.y = eased * 1.5; omikujiContainer.rotation.x = eased * Math.PI;
            } else { omikujiContainer.position.y = 1.5; omikujiContainer.rotation.x = Math.PI; currentState = State.SHAKING; shakeCount = 0; }
            break;
        case State.SHAKING:
            if (shakeIntensity > 0 && isDragging) { omikujiContainer.position.y = 1.5 + Math.sin(now * 0.2) * shakeIntensity * 0.1; } else { omikujiContainer.position.y = 1.5; }
            omikujiContainer.rotation.y += angularVelocity.y;
            if (!isDragging) omikujiContainer.rotation.x -= (omikujiContainer.rotation.x - Math.PI) * 0.1;
            break;
        case State.EMERGING:
            stickProgress += 0.01; fortuneStick.position.y = stickProgress * 2.0; fortuneStick.visible = true;
            if (stickProgress >= 1.0) { currentState = State.FINISHED; document.getElementById('read-fortune-btn').style.display = 'inline-block'; }
            break;
        case State.FINISHED:
            omikujiContainer.rotation.y += angularVelocity.y; if (isDragging) omikujiContainer.rotation.x += angularVelocity.x;
            raycaster.setFromCamera(mouse, camera);
            const hit = raycaster.intersectObjects(fortuneStick.children, true);
            const glow = fortuneStick.getObjectByName('stickGlow');
            if (hit.length > 0) { renderer.domElement.style.cursor = 'pointer'; if (glow) glow.visible = true; }
            else { renderer.domElement.style.cursor = 'grab'; if (glow) glow.visible = false; }
            break;
    }
    if (isZoomedIn) { zoomProgress = Math.min(zoomProgress + 0.05, 1.0); } else { zoomProgress = Math.max(zoomProgress - 0.05, 0); }
    const eased = zoomProgress * zoomProgress * (3 - 2 * zoomProgress);
    camera.position.set(originalCameraPosition.x + (zoomedCameraPosition.x - originalCameraPosition.x) * eased, originalCameraPosition.y + (zoomedCameraPosition.y - originalCameraPosition.y) * eased, originalCameraPosition.z + (zoomedCameraPosition.z - originalCameraPosition.z) * eased);
    camera.lookAt(0, eased * -1.8, 0);
    shakeIntensity *= 0.85; angularVelocity.x *= 0.9; angularVelocity.y *= 0.9; renderer.render(scene, camera);
}
animate();