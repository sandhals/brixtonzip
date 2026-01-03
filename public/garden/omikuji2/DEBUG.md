# Omikuji Fortune Number Debug Guide

## Current Problem
The fortune number is not visible on the stick after switching to 3D TextGeometry.

## Previous Problems We Solved

### 1. **Text appearing on wrong end of stick**
- **Issue**: Text and red tip were at bottom (negative Y) but stick emerges from top (positive Y) when upside down
- **Solution**: Moved red tip to `tip.position.y = (stickLength / 2) + (tipHeight / 2)` (positive Y at 1.65)

### 2. **Text upside down**
- **Issue**: Text was right-side-up in local space, but appeared upside down when container was inverted
- **Solution**: Added `textMesh.rotation.z = Math.PI` to flip text 180° so it's readable when container is upside down

### 3. **White background box appearing**
- **Issue**: Canvas had white fill making an ugly box around text
- **Solution**: Used `ctx.clearRect()` for transparent background and `transparent: true` material

### 4. **Text too stretched/hard to read**
- **Issue**: Text aspect ratio was wrong, characters looked squished
- **Solution**: Made stick wider (0.15), adjusted text plane dimensions, used larger font with white outline

### 5. **Text appearing as image not text**
- **Issue**: Using canvas texture rendered as 2D image
- **Solution**: Switched to 3D TextGeometry for actual text rendering

## Current Code - TextGeometry Implementation

```javascript
// Add fortune number text to stick (called after stick emerges)
async function addFortuneNumberToStick(stickGroup, number) {
    // Convert number to kanji
    const kanji = numberToKanji(number);
    const chars = kanji.split('');

    console.log('Adding fortune number:', number, 'as kanji:', kanji);

    // Load font and create 3D text
    const loader = new FontLoader();

    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        (font) => {
            const textGroup = new THREE.Group();
            textGroup.name = 'fortuneNumber';

            // Create each character as 3D text, stacked vertically
            chars.forEach((char, i) => {
                const textGeometry = new TextGeometry(char, {
                    font: font,
                    size: 0.12,
                    height: 0.01,
                    curveSegments: 12,
                    bevelEnabled: false
                });

                textGeometry.center();

                const textMaterial = new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    roughness: 0.5,
                    metalness: 0.1
                });

                const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                // Position characters vertically
                textMesh.position.y = 1.0 - (i * 0.18);
                textMesh.position.z = 0.02;

                textGroup.add(textMesh);
            });

            // Rotate 180 degrees around Z axis so text is right-side-up when container is upside down
            textGroup.rotation.z = Math.PI;

            stickGroup.add(textGroup);
            console.log('3D text added to stick');
        },
        undefined,
        (error) => {
            console.error('Error loading font:', error);
        }
    );
}
```

## Stick Geometry Context

```javascript
// Stick body (wood colored) - flat rectangular shape, wider for text
const stickWidth = 0.15;
const stickDepth = 0.03;
const stickLength = 3;
const stickGeometry = new THREE.BoxGeometry(stickWidth, stickLength, stickDepth);

// Stick body goes from Y=-1.5 to Y=1.5
// Red tip at Y = (stickLength / 2) + (tipHeight / 2) = 1.5 + 0.15 = 1.65
```

## Potential Issues with Current TextGeometry

### Issue 1: Font doesn't support Japanese characters
**Problem**: `helvetiker_bold.typeface.json` is a Latin font and won't render kanji characters (一, 二, 三, etc.)
**Evidence**: Console will show text being added but nothing renders because the font has no glyphs for these characters

### Issue 2: Text positioned outside stick bounds
**Problem**: Text at Y=1.0 might be too high on stick or not in visible area
**Current positioning**:
- First character: Y=1.0
- Second character: Y=0.82 (1.0 - 0.18)
- Third character: Y=0.64 (if 3 digits)

### Issue 3: Text needs proper lighting
**Problem**: Using `MeshStandardMaterial` requires lights in scene
**Current lights**:
```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
```

### Issue 4: Z-position might be clipping through stick
**Current**: `textMesh.position.z = 0.02`
**Stick depth**: 0.03 (so stick goes from -0.015 to +0.015 in Z)
**Problem**: 0.02 is beyond stick surface, might be too far or causing z-fighting

## Recommended Fixes

### Fix 1: Go back to canvas texture approach but keep it simple
Since TextGeometry doesn't support Japanese fonts, we should return to canvas rendering but fix the visibility issues.

```javascript
async function addFortuneNumberToStick(stickGroup, number) {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Large, bold black text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 200px "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const kanji = numberToKanji(number);
    const chars = kanji.split('');

    // Draw characters vertically
    chars.forEach((char, i) => {
        ctx.fillText(char, 256, 150 + (i * 180));
    });

    const texture = new THREE.CanvasTexture(canvas);

    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false
    });

    const textPlane = new THREE.PlaneGeometry(0.15, 1.4);
    const textMesh = new THREE.Mesh(textPlane, textMaterial);

    textMesh.position.set(0, 0.8, 0.02);
    textMesh.rotation.z = Math.PI;
    textMesh.renderOrder = 1000;
    textMesh.name = 'fortuneNumber';

    stickGroup.add(textMesh);
}
```

### Fix 2: Use Japanese-compatible font for TextGeometry
Load a custom Japanese font JSON (would need to convert a Japanese font to Three.js format)

### Fix 3: Debug current TextGeometry
Add more logging to see what's happening:

```javascript
chars.forEach((char, i) => {
    console.log(`Creating text for character: "${char}" at index ${i}`);
    const textGeometry = new TextGeometry(char, {
        font: font,
        size: 0.12,
        height: 0.01,
        curveSegments: 12,
        bevelEnabled: false
    });

    console.log('Geometry created:', textGeometry);
    console.log('Bounding box:', textGeometry.boundingBox);

    // ... rest of code
});
```

## Most Likely Solution

**Return to canvas texture approach** (Fix 1) because:
1. Japanese fonts work with canvas 2D context
2. MeshBasicMaterial doesn't require complex lighting
3. We already solved the positioning/rotation issues before
4. The "rendered as image" concern is cosmetic - canvas textures are standard for text in Three.js

The key is to:
- Keep transparent background
- Use proper Z-offset (0.02 or 0.025)
- Maintain the 180° rotation for upside-down container
- Position at Y=0.8 (below red tip at Y=1.65)
- Use `depthTest: false` and `renderOrder: 1000` to ensure visibility
