# Sunlit Overlay Diagnostic

## Goal

Display a subtle ambient-light overlay (dappled leaf shadows, blinds, warm glow) inspired by [jackyzha0/sunlit](https://github.com/jackyzha0/sunlit) and visible at [jzhao.xyz](https://jzhao.xyz).

The overlay should be **visually present** (glow, shadows, blur visible) while leaving **all page content fully readable** (no tint, no softening of text or images).

---

## Current HTML/DOM Structure

```
<body>
  <!-- anti-FOUC inline script (sets data-theme + sunlit-hidden class) -->
  <div id="dappled-light">          <!-- position:fixed; z-index:10; pointer-events:none -->
    <div id="glow" />               <!-- opacity:0.5; filter:blur(60px); gradient from --sl-bounce -->
    <div id="glow-bounce" />        <!-- opacity:0.5; filter:blur(60px); gradient from --sl-bounce -->
    <div class="sunlit-perspective"> <!-- opacity:0.07; filter:blur(8px); matrix3d transform -->
      <div id="leaves" />           <!-- leaves.png background; billow animation -->
      <div id="blinds">
        <div class="shutters">      <!-- 23× .shutter divs -->
        <div class="vertical">      <!-- 2× .bar divs -->
      </div>
    </div>
  </div>
  <div class="container">           <!-- position:relative; z-index:1; background:var(--white) -->
    <!-- header image -->
    <div class="content">           <!-- position:relative; z-index:2; background:var(--softwhite) -->
      <!-- all page text, links, images -->
    </div>
    <footer class="footer">         <!-- position:fixed; z-index:2 -->
  </div>
</body>
```

---

## The Core Problem

`#dappled-light` is `position: fixed; z-index: 10`.

`.container` is `z-index: 1` with `background: var(--white)` (opaque).  
`.content` is `z-index: 2` with `background: var(--softwhite)` (near-opaque).

**Result**: The overlay renders in front of all content in the browser's paint order. Even at low opacity, the glow layers (0.5 opacity, blur 60px, `--sl-bounce` colour) and `.sunlit-perspective` (0.07–0.1 opacity, blur 8px) are composited *on top of* text and images. This produces:
- A colour tint across all content (the bounce colour bleeds over text)
- Subtle softening/blur of content edges
- Noticeable degradation of readability

The effect is especially visible because `.container` and `.content` have **opaque backgrounds** — there is no "see-through" quality to them, so the overlay can only ever cover them, never be seen beneath them.

---

## Five Failed Approaches

### Attempt 1: backdrop-filter on #dappled-light (z-index: 10)

```css
#dappled-light {
  backdrop-filter: blur(12px);
  z-index: 10;
}
```

**Why it failed**: `backdrop-filter` blurs the *viewport content behind* the element regardless of stacking context or `isolation`. There is no way to scope `backdrop-filter` to only blur within a compositing group. The entire page content was blurred.

---

### Attempt 2: Move #dappled-light to z-index: 0, remove container background

```css
#dappled-light { z-index: 0; }
.container { background: transparent; }
```

**Why it failed**: With the container transparent, the glow could theoretically be seen through it — but `body` background is `var(--white)` (opaque). `filter: blur(60px)` on `#glow` blurs the glow element itself against the body background, which is the same colour. The effect was invisible. Also, `.content` with `background: var(--softwhite)` still blocked most of the overlay.

---

### Attempt 3: z-index: 0, semi-transparent .content

```css
#dappled-light { z-index: 0; }
.content { background: rgba(247, 247, 247, 0.6); }
```

**Why it failed**: The body background is solid white, so the "glow" behind a semi-transparent container was just white-on-white. Barely visible, and the reduced content opacity made text harder to read. Not the ambient sunlit look — just a faded page.

---

### Attempt 4: isolation: isolate on #dappled-light

```css
#dappled-light {
  z-index: 10;
  isolation: isolate;
  backdrop-filter: blur(12px);
}
```

**Hypothesis**: `isolation: isolate` creates a compositing group; `backdrop-filter` within it would only blur contents of the group (glow/leaves), not the page behind.

**Why it failed**: `isolation: isolate` does NOT scope `backdrop-filter`. The CSS spec and all browser implementations treat `backdrop-filter` as always blurring the *viewport* area behind the element. The hypothesis was architecturally incorrect. Full page blur again.

---

### Attempt 5: filter: blur() instead of backdrop-filter (current state)

```css
#glow        { filter: blur(60px); opacity: 0.5; }
#glow-bounce { filter: blur(60px); opacity: 0.5; }
.sunlit-perspective { filter: blur(8px); opacity: 0.07; }
```

`filter: blur()` blurs the element itself (not page content behind it). This was the correct direction — it removed the "blurring content" problem. **However**, `#dappled-light` is still at `z-index: 10`, so the blurred-glow elements are still rendered *in front of* the content. The glow at 50% opacity with `--sl-bounce: #fffffc` (near white in light mode) creates a visible whitish layer over content. The `.sunlit-perspective` element (leaves + blinds) at 7% opacity with blur is still painted on top of text.

**Net result**: The approach is right (filter not backdrop-filter), but the z-index positioning still causes the overlay to visually cover content.

---

## Current CSS (Relevant Sections)

```css
/* Theme variables */
:root, [data-theme="light"] {
  --black: rgb(24, 24, 24);
  --white: rgb(247, 247, 247);
  --softwhite: rgba(247, 247, 247, 0.875);
  --white-0: rgba(247, 247, 247, 0);
  --link-color: blue;
  --img-blend: multiply;
  --sl-shadow: #1a1917;
  --sl-bounce: #fffffc;
  --sl-timing: cubic-bezier(0.455, 0.190, 0.000, 0.985);
}
[data-theme="dark"] {
  --black: rgb(210, 210, 205);
  --white: rgb(20, 20, 20);
  --softwhite: rgba(22, 22, 22, 0.97);
  --white-0: rgba(20, 20, 20, 0);
  --link-color: #6fa3ef;
  --img-blend: normal;
  --sl-shadow: #030307;
  --sl-bounce: #1b293f;
}
[data-theme="warm"] {
  --black: rgb(44, 34, 22);
  --white: rgb(245, 238, 217);
  --softwhite: rgba(245, 238, 217, 0.875);
  --white-0: rgba(245, 238, 217, 0);
  --link-color: blue;
  --img-blend: multiply;
  --sl-shadow: #2c2010;
  --sl-bounce: #fff8ec;
}

/* Overlay */
#dappled-light {
  pointer-events: none;
  position: fixed;
  top: 0; left: 0;
  height: 100%; width: 100%;
  z-index: 10;
  isolation: isolate;
  transition: opacity 1.2s ease;
}
body.sunlit-hidden #dappled-light { opacity: 0; }

#glow {
  position: absolute;
  background: linear-gradient(309deg, var(--sl-bounce), var(--sl-bounce) 20%, transparent);
  transition: background 1s var(--sl-timing);
  height: 100%; width: 100%;
  opacity: 0.5;
  filter: blur(60px);
}
#glow-bounce {
  position: absolute;
  background: linear-gradient(355deg, var(--sl-bounce) 0%, transparent 30%);
  transition: background 1s var(--sl-timing);
  opacity: 0.5;
  height: 100%; width: 100%;
  bottom: 0;
  filter: blur(60px);
}
.sunlit-perspective {
  position: absolute;
  top: -30vh; right: 0;
  width: 80vw; height: 130vh;
  opacity: 0.07;
  transform: matrix3d(0.75, -0.0625, 0, 0.0008, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  filter: blur(8px);
  mask-image: linear-gradient(to left, black 0%, transparent 70%);
  transition: transform 1.7s var(--sl-timing), opacity 4s ease;
}

/* Content */
.container {
  background: var(--white);
  max-width: 500px;
  margin: auto;
  position: relative;
  z-index: 1;
  overflow: hidden;
  min-height: 100vh;
}
.content {
  background-color: var(--softwhite);
  position: relative;
  z-index: 2;
}
```

---

## The Catch-22

| Approach | Problem |
|---|---|
| Overlay at z-index > content | Visually covers content — tints and softens text |
| Overlay at z-index < content | Invisible behind opaque container/content backgrounds |
| backdrop-filter | Always blurs viewport content — unscoped by spec |
| Semi-transparent content background | Washes out text; glow is invisible (white-on-white) |

---

## Possible Solutions to Investigate

### Option A: mix-blend-mode on #dappled-light

Keep `z-index: 10` but add `mix-blend-mode: screen` (or `overlay`, `soft-light`) to `#dappled-light`:

```css
#dappled-light {
  z-index: 10;
  mix-blend-mode: screen; /* or overlay / soft-light */
}
```

`screen` blending: final colour = `1 - (1-a)(1-b)`. For near-white glow (`#fffffc`) at 50% opacity over white content, the result is near-white — essentially invisible over white, but would brighten any darker content areas. For dark mode glow (`#1b293f`) screen-blended over dark content, it adds a subtle blue lift without blocking text.

**Risk**: May cause colour shift on images or dark text. Requires testing per theme.

---

### Option B: CSS Painting Order via negative z-index + body background trick

Place `#dappled-light` at `z-index: -1` relative to `.container` by making it a sibling of `.container` and using `z-index: 0` on body:

```css
body { position: relative; z-index: 0; isolation: isolate; }
#dappled-light { position: fixed; z-index: -1; } /* behind .container */
.container { background: transparent; }           /* see-through */
.content { background: transparent; }
/* Put the page background on body instead */
body { background: var(--white); }
```

The ambient glow would then be visible "through" the transparent container against the body. Text and images would render above the glow (which is behind the container). Blinds/shutters would be behind content too — which might actually be acceptable since the shadow effect reads correctly even when partially obscured.

**Risk**: Any element that currently relies on `.container`/`.content` background for visual separation would need to be explicitly set.

---

### Option C: Separate the glow from the blinds

Split `#dappled-light` into two elements:

1. `#sunlit-glow` (z-index: -1, behind content) — just the glow/bounce gradient layers. Uses body as the compositing surface.
2. `#sunlit-blinds` (z-index: 10, above content, pointer-events: none) — just the perspective/blinds/leaves at very low opacity (0.03–0.05). The shadow lines of blinds can read at very low opacity without degrading text.

This lets the ambient colour warmth come from behind (where it can't cover content) while the structural shadow pattern floats very subtly above.

---

### Option D: Use background-attachment: fixed on body

Instead of a fixed positioned overlay, apply the glow as a CSS gradient on `body` with `background-attachment: fixed`. Content areas use transparent backgrounds. No z-index conflict at all.

```css
body {
  background: 
    linear-gradient(309deg, var(--sl-bounce), var(--sl-bounce) 20%, transparent),
    var(--white);
  background-attachment: fixed, scroll;
}
.container, .content { background: transparent; }
```

**Risk**: Gradient is flat/static (no blur, no animation). Blinds/leaves effect would need a separate low-z-index layer anyway.

---

## Files to Modify

- `/public/style.css` — `#dappled-light`, `#glow`, `#glow-bounce`, `.sunlit-perspective`, `.container`, `.content`, `body`
- `/components/DappledLight.tsx` — component structure if splitting into two layers
- `/pages/_app.tsx` — rendering order if splitting layers

## Files to Leave Alone

- `/components/ThemeToggle.tsx` — theme switching logic is correct
- `/pages/_document.tsx` — anti-FOUC inline script is correct
- All page components — CSS variable theming is working correctly
