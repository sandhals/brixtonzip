// Zippy — the face in the marquee strip. Shared by the header and the showcase
// page at /zippy, so his markup lives in one place.
//
// Every stroke is currentColor rather than a fixed white, so he can sit on any
// background; whatever renders him sets the colour. The blush is the one
// exception — it is an accent, not his body colour.
//
// The mouth is a "film strip": eleven shapes stacked vertically inside a clip
// window, scrolled by translateY so only one shows at a time. A frame centred
// at strip-y Y is shown by translateY(-(Y - 70)).
//   0     line (neutral)      -175  dome (snoring)
//   -35   square              -210  dot (tiny)
//   -70   diamond             -240  sideways T, cheek full   \
//   -105  circle (open)       -275  sideways T, cheek small   > the chew cycle
//                             -310  sideways T, cheek middle /
//                             -345  smile (mouth open, waiting for the treat)
//                             -380  frown (the treat was thrown away)
//
// The three chew frames are a sideways T: a long horizontal MOUTH line, always
// centred on the face at x=50, crossed near its left end by a short vertical
// CHEEK bar, standing in for one cheek packed with food. The mouth meets the
// cheek at the cheek bar's midpoint, so it reads as pressing through it.
//
//   frame   mouth (width)   cheek x   cheek height
//   -240    30-70  (40)     32        20
//   -275    34-66  (32)     36        14
//   -310    32-68  (36)     34        18
//
// Each frame is then nudged off those figures by 2 units, around a circle at
// -90 / 30 / 150 degrees, so the whole mouth orbits once per chew. Two units
// is a third of a pixel at the size he renders: you do not see it move, you
// see it not sit perfectly still.
//
// The mouth widens and narrows, the cheek packs and unpacks, and the cheek
// slides a couple of units back and forth rather than pivoting on a fixed
// point. Three frames rather than two: an even flip back and forth beats like
// a metronome, an uneven cycle does not.
//
// The cheek sits under the left eye (x=28) rather than in the middle of his
// face -- it is one cheek full, not a symmetrical expression.
//
// The states themselves are CSS, in components/Header.tsx.
export default function Zippy() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="mouth-window">
          <rect x="20" y="55" width="60" height="35" />
        </clipPath>
      </defs>
      {/* Eyes - open (dots) */}
      <g className="eyes-open">
        <circle cx="28" cy="50" r="4" fill="currentColor" />
        <circle cx="72" cy="50" r="4" fill="currentColor" />
      </g>
      {/* Eyes - half closed (--) */}
      <g className="eyes-half" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="22" y1="50" x2="34" y2="50" />
        <line x1="66" y1="50" x2="78" y2="50" />
      </g>
      {/* Eyes - closed (><) */}
      <g className="eyes-closed" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        {/* > centered on left eye (28,50) */}
        <line x1="22" y1="44" x2="34" y2="50" />
        <line x1="34" y1="50" x2="22" y2="56" />
        {/* < centered on right eye (72,50) */}
        <line x1="78" y1="44" x2="66" y2="50" />
        <line x1="66" y1="50" x2="78" y2="56" />
      </g>
      {/* Eyes - happy arcs, worn while chewing: a kaomoji's ᵔ. Cubic rather
          than quadratic, with the two control points side by side across the
          top, which is what flattens the crown -- a single control point pulls
          the curve to a peak and it reads as a caret again. */}
      <g className="eyes-happy" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M21 53 C 23 46, 33 46, 35 53" />
        <path d="M65 53 C 67 46, 77 46, 79 53" />
      </g>
      {/* Mouth film strip */}
      <g clipPath="url(#mouth-window)">
        <g className="mouth-strip" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="42" y1="70" x2="58" y2="70" />
          <rect x="43" y="98" width="14" height="14" />
          <path d="M50 131 L59 140 L50 149 L41 140 Z" />
          <circle cx="50" cy="175" r="8" />
          <path d="M37 252 L63 252 L63 245 Q63 238, 50 238 Q37 238, 37 245 Z" />
          <circle cx="50" cy="280" r="2" />
          <path d="M30 308 L70 308 M32 298 L32 318" />
          <path d="M35.7 346 L67.7 346 M37.7 339 L37.7 353" />
          <path d="M30.3 381 L66.3 381 M32.3 372 L32.3 390" />
          <path d="M37 408 L63 408 L63 415 Q63 422, 50 422 Q37 422, 37 415 Z" />
          <path d="M38 454 Q50 441, 62 454" />
        </g>
      </g>
      {/* Glasses - shown when text is selected */}
      <g className="face-glasses" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 47 Q15 39, 21 39 L35 39 Q41 39, 41 47 L41 55 Q41 63, 28 63 Q15 63, 15 55 Z" />
        <path d="M59 47 Q59 39, 65 39 L79 39 Q85 39, 85 47 L85 55 Q85 63, 72 63 Q59 63, 59 55 Z" />
        <path d="M41 48 Q50 42, 59 48" fill="none" />
      </g>
      {/* Blush marks - anime style */}
      <g className="face-blush" stroke="#ff7777" strokeWidth="2" strokeLinecap="round">
        <line x1="34" y1="60" x2="38" y2="55" />
        <line x1="43" y1="63" x2="48" y2="53" />
        <line x1="52" y1="63" x2="57" y2="53" />
        <line x1="62" y1="60" x2="66" y2="55" />
      </g>
    </svg>
  );
}
