// Zippy — the face in the marquee strip. Shared by the header and the showcase
// page at /zippy, so his markup lives in one place.
//
// Every stroke is currentColor rather than a fixed white, so he can sit on any
// background; whatever renders him sets the colour. The blush is the one
// exception — it is an accent, not his body colour.
//
// The mouth is a "film strip": six shapes stacked vertically inside a clip
// window, scrolled by translateY so only one shows at a time.
//   0     line (neutral)      -105  circle (open)
//   -35   square              -175  dome (snoring)
//   -70   diamond             -210  dot (tiny)
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
      {/* Mouth film strip */}
      <g clipPath="url(#mouth-window)">
        <g className="mouth-strip" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="42" y1="70" x2="58" y2="70" />
          <rect x="43" y="98" width="14" height="14" />
          <path d="M50 131 L59 140 L50 149 L41 140 Z" />
          <circle cx="50" cy="175" r="8" />
          <path d="M37 252 L63 252 L63 245 Q63 238, 50 238 Q37 238, 37 245 Z" />
          <circle cx="50" cy="280" r="2" />
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
