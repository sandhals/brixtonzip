import { useEffect } from 'react'

interface HeaderProps {
  variant?: 'home' | 'article'
}

export default function Header({ variant = 'article' }: HeaderProps) {
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        document.body.classList.add('text-selected');
      } else {
        document.body.classList.remove('text-selected');
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);
  const homeCopy = `IT'S`
  const articleCopy = `IT'S CURRENTLY`

  return (
<div className="header">
  <div className="status-marquee-box">
    <div className="marquee-face" aria-hidden="true">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="mouth-window">
            <rect x="20" y="55" width="60" height="35" />
          </clipPath>
        </defs>
        {/* Eyes - open (dots) */}
        <g className="eyes-open">
          <circle cx="28" cy="50" r="4" fill="var(--white)" />
          <circle cx="72" cy="50" r="4" fill="var(--white)" />
        </g>
        {/* Eyes - half closed (--) */}
        <g className="eyes-half" stroke="var(--white)" strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="22" y1="50" x2="34" y2="50" />
          <line x1="66" y1="50" x2="78" y2="50" />
        </g>
        {/* Eyes - closed (><) */}
        <g className="eyes-closed" stroke="var(--white)" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* > centered on left eye (28,50) */}
          <line x1="22" y1="44" x2="34" y2="50" />
          <line x1="34" y1="50" x2="22" y2="56" />
          {/* < centered on right eye (72,50) */}
          <line x1="78" y1="44" x2="66" y2="50" />
          <line x1="66" y1="50" x2="78" y2="56" />
        </g>
        {/* Mouth film strip */}
        <g clipPath="url(#mouth-window)">
          <g className="mouth-strip" fill="none" stroke="var(--white)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="42" y1="70" x2="58" y2="70" />
            <rect x="43" y="98" width="14" height="14" />
            <path d="M50 131 L59 140 L50 149 L41 140 Z" />
            <circle cx="50" cy="175" r="8" />
          </g>
        </g>
        {/* Glasses - shown when text is selected */}
        <g className="face-glasses" fill="none" stroke="var(--white)" strokeWidth="2">
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
    </div>
    <div className="marquee-text-wrapper">
      <div className="status-marquee">
        {variant === 'home' ? homeCopy : articleCopy}
        <span id="currentWeekday"></span>
        <span id="currentTime"></span>
        {variant === 'home' ? 'IN SEOUL, SO I\'M PROBABLY' : 'IN SEOUL ON A '}
        <span id="myStatus"></span>
        RIGHT NOW
      </div>
    </div>
  </div>

  <style jsx global>{`
    .mouth-strip {
      animation: film-strip 2.5s infinite steps(1);
    }
    @keyframes film-strip {
      0%   { transform: translateY(0); }
      8%   { transform: translateY(-35px); }
      16%  { transform: translateY(0); }
      24%  { transform: translateY(-70px); }
      32%  { transform: translateY(0); }
      40%  { transform: translateY(-105px); }
      48%  { transform: translateY(0); }
      100% { transform: translateY(0); }
    }
    .marquee-face:hover .mouth-strip {
      animation: none;
      transform: translateY(-105px);
    }
    .marquee-face:hover .eyes-open {
      animation: hover-blink 4s steps(1) infinite;
      transform: translate(0, 0);
    }
    .marquee-face:hover .eyes-half {
      animation: hover-blink-half 4s steps(1) infinite;
    }
    @keyframes hover-blink {
      0%   { opacity: 1; }
      /* wait ~3s then blink twice */
      74%  { opacity: 1; }
      75%  { opacity: 0; }
      78%  { opacity: 1; }
      80%  { opacity: 1; }
      87%  { opacity: 0; }
      90%  { opacity: 1; }
      100% { opacity: 1; }
    }
    @keyframes hover-blink-half {
      0%   { opacity: 0; }
      74%  { opacity: 0; }
      75%  { opacity: 1; }
      78%  { opacity: 0; }
      80%  { opacity: 0; }
      87%  { opacity: 1; }
      90%  { opacity: 0; }
      100% { opacity: 0; }
    }
    .face-blush {
      opacity: 0;
      transition: opacity 0.15s;
    }
    .eyes-half {
      opacity: 0;
    }
    .eyes-closed {
      opacity: 0;
    }
    /* Hover on checkbox: blush + mouth open */
    body:has(.zip-checkbox:hover) .face-blush {
      opacity: 1;
    }
    body:has(.zip-checkbox:hover) .mouth-strip {
      animation: none;
      transform: translateY(-105px);
    }
    /* Checked (unzipped): dot → dash → >< */
    body:has(.zip-checkbox:checked) .eyes-open {
      animation: eyes-dot 0.25s steps(1) forwards;
    }
    body:has(.zip-checkbox:checked) .eyes-half {
      animation: eyes-dash 0.25s steps(1) forwards;
    }
    body:has(.zip-checkbox:checked) .eyes-closed {
      animation: eyes-chevron 0.25s steps(1) forwards;
    }
    @keyframes eyes-dot {
      0%   { opacity: 1; }
      33%  { opacity: 0; }
      100% { opacity: 0; }
    }
    @keyframes eyes-dash {
      0%   { opacity: 0; }
      33%  { opacity: 1; }
      66%  { opacity: 0; }
      100% { opacity: 0; }
    }
    @keyframes eyes-chevron {
      0%   { opacity: 0; }
      66%  { opacity: 1; }
      100% { opacity: 1; }
    }
    body:has(.zip-checkbox:checked) .mouth-strip {
      animation: none;
      transform: translateY(0);
    }
    body:has(.zip-checkbox:checked) .face-blush {
      opacity: 1;
    }
    /* Glasses when text is selected */
    .face-glasses {
      opacity: 0;
      transition: opacity 0.1s;
    }
    body.text-selected .face-glasses,
    body.is-showing-source .face-glasses {
      opacity: 1;
    }
    body.text-selected .eyes-open,
    body.is-showing-source .eyes-open {
      animation: reading 3s ease-in-out infinite;
    }
    @keyframes reading {
      0%   { transform: translate(6px, 3px); }
      45%  { transform: translate(0px, 5px); }
      90%  { transform: translate(-6px, 3px); }
      95%  { transform: translate(6px, 3px); }
      100% { transform: translate(6px, 3px); }
    }
  `}</style>
</div>

  )
}
