# Omikuji 3D Troubleshooting

## Project Overview
We're building a 3D interactive omikuji (Japanese fortune-telling) experience using Three.js. The user can shake a virtual hexagonal wooden container to draw a fortune stick.

## Current Issues

### Issue 1: おみくじ Text Not Visible on Container
The Japanese text "おみくじ" (omikuji) should be visible on one of the flat hexagonal faces of the container, but it's not showing up.

**Relevant Code:**

```javascript
// Create engraved text
function addEngravedText(group, radius) {
    // Create canvas for text texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Clear background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw black text with serif font for Japanese
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 70px "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw each character vertically
    const text = 'おみくじ';
    const chars = text.split('');
    const startY = 80;
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
        side: THREE.DoubleSide,
        opacity: 1.0,
        depthWrite: false
    });

    const textPlane = new THREE.PlaneGeometry(1.0, 3.0);
    const textMesh = new THREE.Mesh(textPlane, textMaterial);

    // Position text on one of the flat hexagonal faces
    // For a hexagon with 6 sides, we want the center of a face
    // The distance from center to a flat face is radius * cos(30°)
    const distanceToFace = radius * Math.cos(Math.PI / 6);
    textMesh.position.set(0, 0, distanceToFace + 0.02);

    // Ensure it renders on top
    textMesh.renderOrder = 1;

    group.add(textMesh);

    console.log('Text added to container');
}
```

**Container Creation:**

```javascript
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
    group.add(cylinder);

    // ... caps and hole code ...

    // Add engraved text
    addEngravedText(group, radius);

    return group;
}
```

**What should happen:** The text "おみくじ" should be visible in black on one of the six flat faces of the hexagonal cylinder, rendered with a serif Japanese font.

**What's happening:** The text is not visible at all on the container.

**What we've tried:**
- Using `MeshBasicMaterial` instead of `MeshToonMaterial`
- Setting `depthWrite: false`
- Setting `renderOrder: 1`
- Adjusting the Z-position offset from the face (`distanceToFace + 0.02`)
- Using `THREE.DoubleSide` for the material
- Calculating the proper distance to the flat face using `radius * Math.cos(Math.PI / 6)`

## User Requirements

### Game Flow
1. User presses "Take Omikuji" button
2. Container flips upside down (180° rotation on X-axis) AND moves up in 3D space by 1.5 units
3. User must shake the container 1-3 times (randomly chosen each time)
4. After reaching required shakes, a stick gradually emerges from the hole (not all the way)
5. Display "Fortune received!" message

### Visual Requirements
- **Background:** Pure white (`#ffffff`)
- **Container:** Pale wood color (`0xD2B48C`) with cell-shaded/toon shader effect
- **Text:** Black "おみくじ" in serif font, positioned on flat hexagonal face
- **Hole:** Small dark hole on top (recessed, not protruding)
- **Stick:** Light wheat color (`0xF5DEB3`), emerges from hole when flipped upside down

### Interaction Requirements
- Gentle rotation on mouse/touch drag
- Limited tilt (max 22.5° when upright)
- Container can spin freely on Y-axis but has restricted X-axis rotation
- When flipped, stays around 180° (PI radians) with limited deviation
- Shaking causes vertical bouncing motion
- Auto-rotation when idle

### UI Layout
- **Top:** Title "おみくじ", instructions, shake counter (X / Y format)
- **Bottom:** "Take Omikuji" button (minimalist black/white design)

## Questions for Gemini

1. Why isn't the canvas-based text texture showing up on the Three.js plane? The console logs show "Text added to container" so the function is executing.

2. Is there an issue with how we're positioning the text plane relative to the hexagonal cylinder faces? We're using `radius * Math.cos(Math.PI / 6)` to get the distance to the flat face.

3. Could the `MeshToonMaterial` on the cylinder be causing z-fighting or rendering issues with the `MeshBasicMaterial` text plane?

4. Should we be using a different approach for adding text to a 3D object in Three.js? (e.g., TextGeometry, different material settings, etc.)

5. Are there any issues with the canvas rendering code for Japanese characters that might cause the texture to be invisible?

## Additional Context

**Three.js Version:** 0.160.0

**Renderer Setup:**
```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

**Camera:**
```javascript
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);
```

**Scene Background:**
```javascript
scene.background = new THREE.Color(0xffffff);
```
