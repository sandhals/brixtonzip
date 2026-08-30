import { useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import Zippy from './Zippy'

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

  useEffect(() => {
    const setMarqueeStart = () => {
      const wrapper = document.querySelector('.marquee-text-wrapper') as HTMLElement;
      if (wrapper) {
        document.documentElement.style.setProperty('--marquee-start', `${wrapper.offsetWidth}px`);
      }
    };
    setMarqueeStart();
    window.addEventListener('resize', setMarqueeStart);
    return () => window.removeEventListener('resize', setMarqueeStart);
  }, []);
  const homeCopy = `IT'S`
  const articleCopy = `IT'S CURRENTLY`

  return (
<div className="header">
  <div className="status-marquee-box">
    <div className="marquee-face" aria-hidden="true">
      <Zippy />
    </div>
    <div className="marquee-text-wrapper">
      <div className="status-marquee">
        {variant === 'home' ? homeCopy : articleCopy}
        <span id="currentWeekday" suppressHydrationWarning></span>
        <span id="currentTime" suppressHydrationWarning></span>
        {variant === 'home' ? 'IN SEOUL, SO I\'M PROBABLY' : 'IN SEOUL ON A '}
        <span id="myStatus" suppressHydrationWarning></span>
        RIGHT NOW
      </div>
    </div>
    <div className="marquee-theme-slot">
      <ThemeToggle inline />
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
    .marquee-face:hover .mouth-strip,
    [data-pose="demo-hover"]:hover .mouth-strip,
    [data-pose="attentive"] .mouth-strip,
    [data-pose="woken"] .mouth-strip {
      animation: none;
      transform: translateY(-105px);
    }
    .marquee-face:hover .eyes-open,
    [data-pose="demo-hover"]:hover .eyes-open,
    [data-pose="attentive"] .eyes-open,
    [data-pose="woken"] .eyes-open {
      animation: hover-blink 3s steps(1) infinite;
      transform: translate(0, 0);
    }
    .marquee-face:hover .eyes-half,
    [data-pose="demo-hover"]:hover .eyes-half,
    [data-pose="attentive"] .eyes-half,
    [data-pose="woken"] .eyes-half {
      animation: hover-blink-half 3s steps(1) infinite;
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
    body:has(.zip-checkbox:hover) .marquee-face .face-blush,
    [data-pose="demo-zip"]:hover .face-blush,
    [data-pose="flustered"] .face-blush,
    [data-pose="unzipped"] .face-blush {
      opacity: 1;
    }
    body:has(.zip-checkbox:hover) .marquee-face .mouth-strip,
    [data-pose="demo-zip"]:hover .mouth-strip,
    [data-pose="flustered"] .mouth-strip {
      animation: none;
      transform: translateY(-105px);
    }
    /* Checked (unzipped): dot → dash → >< */
    body:has(.zip-checkbox:checked) .marquee-face .eyes-open,
    [data-pose="unzipped"] .eyes-open {
      animation: eyes-dot 0.25s steps(1) forwards;
    }
    body:has(.zip-checkbox:checked) .marquee-face .eyes-half,
    [data-pose="unzipped"] .eyes-half {
      animation: eyes-dash 0.25s steps(1) forwards;
    }
    body:has(.zip-checkbox:checked) .marquee-face .eyes-closed,
    [data-pose="unzipped"] .eyes-closed {
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
    body:has(.zip-checkbox:checked) .marquee-face .mouth-strip,
    [data-pose="unzipped"] .mouth-strip {
      animation: none;
      transform: translateY(0);
    }
    body:has(.zip-checkbox:checked) .marquee-face .face-blush {
      opacity: 1;
    }
    /* Live triggers below are all pinned to .marquee-face. Unscoped they would
       also drive the demo tiles on /zippy, which exist to show one state each
       no matter what the real Zippy happens to be doing. */
    /* Glasses when text is selected */
    .face-glasses {
      opacity: 0;
      transition: opacity 0.1s;
    }
    body.text-selected .marquee-face .face-glasses,
    body.is-showing-source .marquee-face .face-glasses,
    [data-pose="reading"] .face-glasses {
      opacity: 1;
    }
    body.text-selected .marquee-face .eyes-open,
    body.is-showing-source .marquee-face .eyes-open,
    [data-pose="reading"] .eyes-open {
      animation: reading 3s ease-in-out infinite;
    }
    /* Sleeping state */
    body.is-sleeping .marquee-face .eyes-open,
    [data-pose="asleep"] .eyes-open {
      opacity: 0;
      animation: none;
    }
    body.is-sleeping .marquee-face .eyes-half,
    [data-pose="asleep"] .eyes-half {
      opacity: 1;
    }
    body.is-sleeping .marquee-face .mouth-strip,
    [data-pose="asleep"] .mouth-strip {
      animation: snore-breathe 4s steps(1) infinite;
    }
    @keyframes snore-breathe {
      0%   { transform: translateY(-175px); }
      40%  { transform: translateY(-105px); }
      50%  { transform: translateY(-210px); }
    }
    /* Hover wakes it up */
    body.is-sleeping .marquee-face:hover .eyes-open {
      opacity: 1;
      animation: hover-blink 3s steps(1) infinite;
      transform: translate(0, 0);
    }
    body.is-sleeping .marquee-face:hover .eyes-half {
      opacity: 0;
      animation: hover-blink-half 3s steps(1) infinite;
    }
    body.is-sleeping .marquee-face:hover .mouth-strip {
      animation: none;
      transform: translateY(-105px);
    }
    /* Falling back asleep after hover */
    [data-pose="dozing"] .eyes-open,
    body.is-sleeping .marquee-face.falling-asleep .eyes-open {
      animation: fall-asleep-eyes 3s steps(1) forwards;
    }
    [data-pose="dozing"] .eyes-half,
    body.is-sleeping .marquee-face.falling-asleep .eyes-half {
      animation: fall-asleep-half 3s steps(1) forwards;
    }
    [data-pose="dozing"] .mouth-strip,
    body.is-sleeping .marquee-face.falling-asleep .mouth-strip {
      animation: fall-asleep-mouth 3s steps(1) forwards;
    }
    @keyframes fall-asleep-eyes {
      0%   { opacity: 1; }
      20%  { opacity: 0; }
      28%  { opacity: 1; }
      48%  { opacity: 0; }
      62%  { opacity: 1; }
      72%  { opacity: 0; }
      100% { opacity: 0; }
    }
    @keyframes fall-asleep-half {
      0%   { opacity: 0; }
      20%  { opacity: 1; }
      28%  { opacity: 0; }
      48%  { opacity: 1; }
      62%  { opacity: 0; }
      72%  { opacity: 1; }
      100% { opacity: 1; }
    }
    @keyframes fall-asleep-mouth {
      0%   { transform: translateY(-105px); }
      47%  { transform: translateY(-105px); }
      48%  { transform: translateY(0); }
      100% { transform: translateY(0); }
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
