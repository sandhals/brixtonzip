import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ThemeToggle from './ThemeToggle'
import Zippy from './Zippy'

// An asterisk: six points as three crossed strokes at 60 degrees, not a filled
// polygon. At 1em a star outline's points come out narrower than the line
// drawing them and fill back in solid, and this is the weight of line Zippy
// himself is drawn with anyway.
const Star = ({ colour }: { colour?: string }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g stroke={colour || 'currentColor'} strokeWidth="5.5" strokeLinecap="round">
      <line x1="50" y1="18" x2="50" y2="82" />
      <line x1="22.3" y1="34" x2="77.7" y2="66" />
      <line x1="77.7" y1="34" x2="22.3" y2="66" />
    </g>
  </svg>
)

// One shape, drawn twice per reward. paintOrder="stroke" lays the stroke down
// first, so a fat stroke in the strip's own colour becomes a halo around the
// heart rather than eating into it -- which is what keeps it legible as it
// drifts across the marquee text.
const Heart = ({ trailing }: { trailing?: boolean }) => (
  <svg className={`marquee-heart${trailing ? ' is-trailing' : ''}`} viewBox="0 0 100 100">
    <path d="M50 84 C 20 62, 8 42, 20 28 C 30 16, 46 20, 50 32 C 54 20, 70 16, 80 28 C 92 42, 80 62, 50 84 Z"
          fill="#ff8a8a" paintOrder="stroke" strokeLinejoin="round"
          stroke="var(--marquee-bg, var(--black))" strokeWidth="30" />
  </svg>
)

interface HeaderProps {
  variant?: 'home' | 'article'
}

export default function Header({ variant = 'article' }: HeaderProps) {
  // The treat is offered from /zippy, which is a sibling of this component
  // rather than a child, so it arrives as a window event instead of a prop.
  const [treat, setTreat] = useState<'none' | 'offered' | 'dragging' | 'chewing'>('none')
  const [starColour, setStarColour] = useState('')
  const [sulking, setSulking] = useState(false)
  // Every third treat earns a heart. A ref rather than state: the count is
  // read at the moment of feeding and never rendered, so bumping it should not
  // cost a render of its own.
  const fed = useRef(0)
  const [heart, setHeart] = useState<number | null>(null)
  // A star thrown away rather than fed: it drops out of the page from wherever
  // it was let go. Held separately from `treat` because it outlives it -- the
  // one in the strip is gone the moment this starts.
  const [falling, setFalling] = useState<{
    id: number; x: number; y: number; size: number; colour: string
    throwX: number; toss: number; spin: number
  } | null>(null)
  // The star being dragged is portalled out of the strip as well. It has to be:
  // the strip is 1.3em of overflow:hidden, so a star still inside it is sliced
  // off the moment you pull it clear.
  const [dragStar, setDragStar] = useState<{ x: number; y: number; size: number } | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const starRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const offer = () => {
      // A different star every time. Held to the top of the lightness range so
      // it always carries over the black strip, and off full saturation so it
      // stays a pastel rather than turning neon.
      setStarColour('hsl(' + Math.floor(Math.random() * 360) + ' ' +
        (65 + Math.floor(Math.random() * 25)) + '% ' +
        (72 + Math.floor(Math.random() * 10)) + '%)')
      setTreat('offered')
    }
    window.addEventListener('zippy:treat', offer)
    return () => window.removeEventListener('zippy:treat', offer)
  }, [])

  // Every one of these states is momentary: something sets it, and a timer
  // puts him back to normal. Each effect keys off its own state and clears its
  // timer on the way out, so retriggering restarts the clock rather than
  // stacking a second timer on top of the first.
  useEffect(() => {
    if (treat !== 'chewing') return
    const done = setTimeout(() => setTreat('none'), 2000)
    return () => clearTimeout(done)
  }, [treat])

  useEffect(() => {
    if (!sulking) return
    const over = setTimeout(() => setSulking(false), 2000)
    return () => clearTimeout(over)
  }, [sulking])

  useEffect(() => {
    if (heart === null) return
    // 1.9s of flight plus the trailing heart's 0.36s head start.
    const gone = setTimeout(() => setHeart(null), 2500)
    return () => clearTimeout(gone)
  }, [heart])

  useEffect(() => {
    if (falling === null) return
    const gone = setTimeout(() => setFalling(null), 1200)
    return () => clearTimeout(gone)
  }, [falling])

  // Both ways in -- dropped on him, or activated from the keyboard.
  const feed = () => {
    fed.current += 1
    if (fed.current % 3 === 0) setHeart(Date.now())
    setSulking(false)
    setTreat('chewing')
  }

  // Drag the star onto him to feed him. Pointer events rather than HTML5 drag
  // and drop: that API has no touch support and drags a ghost image of the
  // element, which is exactly the thing we want to move.
  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = starRef.current
    const shape = el?.querySelector('svg')?.getBoundingClientRect()
    if (!el || !shape) return
    e.preventDefault()
    el.setPointerCapture(e.pointerId)

    // Where in the star the pointer took hold, so it does not jump under the
    // cursor on the first move.
    const grabX = e.clientX - (shape.left + shape.width / 2)
    const grabY = e.clientY - (shape.top + shape.height / 2)

    // The last few positions, for working out how hard it was flung.
    const trail: { x: number; y: number; t: number }[] =
      [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]

    document.body.classList.add('zippy-dragging')
    setSulking(false)
    setDragStar({ x: e.clientX - grabX, y: e.clientY - grabY, size: shape.height })
    setTreat('dragging')

    const move = (ev: PointerEvent) => {
      trail.push({ x: ev.clientX, y: ev.clientY, t: ev.timeStamp })
      if (trail.length > 6) trail.shift()
      const node = dragRef.current
      if (node) {
        node.style.left = (ev.clientX - grabX) + 'px'
        node.style.top = (ev.clientY - grabY) + 'px'
      }
    }

    const end = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
      document.body.classList.remove('zippy-dragging')
      setDragStar(null)

      const face = document.querySelector('.marquee-face')?.getBoundingClientRect()
      const pad = 10
      const onTarget = !!face &&
        ev.clientX > face.left - pad && ev.clientX < face.right + pad &&
        ev.clientY > face.top - pad && ev.clientY < face.bottom + pad

      if (onTarget) { feed(); return }

      // Missed him: he pulls a face, and the treat is thrown. Speed comes from
      // the last ~120ms of the drag rather than the whole of it, so a slow haul
      // that ends in a flick still throws hard, and letting go while stationary
      // just drops it.
      const recent = trail.filter(p => ev.timeStamp - p.t < 120)
      const from = recent[0]
      const dt = from ? ev.timeStamp - from.t : 0
      const vx = dt > 8 ? (ev.clientX - from.x) / dt : 0
      const vy = dt > 8 ? (ev.clientY - from.y) / dt : 0
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

      setFalling({
        id: Date.now(),
        x: ev.clientX - grabX,
        y: ev.clientY - grabY,
        size: shape.height,
        colour: starColour,
        throwX: clamp(vx * 750, -window.innerWidth, window.innerWidth),
        // Flicked upward and it rises before gravity takes it; flicked down and
        // it just goes sooner. The floor is much shallower than the ceiling.
        toss: clamp(vy * 140, -170, 60),
        spin: clamp(vx * 620 + 170, -760, 760),
      })
      setSulking(true)
      setTreat('none')
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  }

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
    <a
      href="/zippy"
      className={`marquee-face${treat === 'chewing' ? ' is-chewing' : ''}${treat === 'dragging' ? ' is-waiting' : ''}${sulking ? ' is-sulking' : ''}`}
      aria-label="About Zippy"
    >
      <Zippy />
    </a>
    {/* Zero-width, so a heart drifting past changes no layout. */}
    <span className="marquee-heart-slot" aria-hidden="true">
      {/* Keyed on the fragment so a fresh pair mounts each time, rather than
          React reusing the nodes and the animations never restarting. */}
      {heart !== null && (
        <Fragment key={heart}>
          <Heart />
          <Heart trailing />
        </Fragment>
      )}
    </span>
    {(treat === 'offered' || treat === 'dragging') && (
      <button
        ref={starRef}
        type="button"
        className={`marquee-treat${treat === 'dragging' ? ' is-dragging' : ''}`}
        aria-label="Drag the star onto Zippy to feed him"
        onPointerDown={startDrag}
        /* Keyboard has no drag, so a plain activation feeds him too.
           detail === 0 marks a click synthesised from Enter or Space, which is
           how this stays out of the way of the pointer path above. */
        onClick={e => { if (e.detail === 0) feed() }}
      >
        <Star colour={starColour} />
      </button>
    )}
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
    {dragStar !== null && createPortal(
      <div
        ref={dragRef}
        className="zippy-treat-flying"
        aria-hidden="true"
        style={{ left: dragStar.x, top: dragStar.y, height: dragStar.size }}
      >
        <Star colour={starColour} />
      </div>,
      document.body,
    )}
    {falling !== null && createPortal(
      <div
        key={falling.id}
        className="zippy-treat-flying is-falling"
        aria-hidden="true"
        style={{
          left: falling.x,
          top: falling.y,
          height: falling.size,
          '--throw-x': falling.throwX + 'px',
          '--toss': falling.toss + 'px',
          '--spin': falling.spin + 'deg',
        } as React.CSSProperties}
      >
        {/* Horizontal on the outer at a constant rate, vertical on the inner
            under gravity: two separate animations multiplying together is what
            makes the path a parabola instead of a straight diagonal. */}
        <span><Star colour={falling.colour} /></span>
      </div>,
      document.body,
    )}
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
    [data-pose="reading"]:hover .mouth-strip,
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
    .eyes-happy {
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
    /* Waiting for the star: mouth open in a smile, held, so the drag has an
       obvious destination. */
    /* !important throughout these two states because they are deliberate,
       momentary overrides of whatever he was doing. The competing rules are
       written as body.is-sleeping .marquee-face .mouth-strip and score a point
       higher on the element selector; without this he carries on snoring with
       a star in his face.
       (No backticks in here — this all lives inside a template literal.) */
    .marquee-face.is-waiting .mouth-strip {
      animation: none !important;
      transform: translateY(-345px) !important;
    }
    /* Eyes wide open for it — including when the star pulls him out of sleep. */
    .marquee-face.is-waiting .eyes-open   { opacity: 1 !important; animation: none !important; transform: none !important; }
    .marquee-face.is-waiting .eyes-half   { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-waiting .eyes-closed { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-waiting .eyes-happy  { opacity: 0 !important; }

    /* Thrown away rather than fed: he frowns about it for a moment. Placed
       ahead of the chewing block on purpose -- both are !important at the same
       specificity, so source order decides, and feeding him should always beat
       sulking. */
    .marquee-face.is-sulking .mouth-strip {
      animation: none !important;
      transform: translateY(-380px) !important;
    }
    .marquee-face.is-sulking .eyes-open   { opacity: 1 !important; animation: none !important; transform: none !important; }
    .marquee-face.is-sulking .eyes-half   { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-sulking .eyes-closed { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-sulking .eyes-happy  { opacity: 0 !important; }

    /* Chewing: the three sideways-T frames, mouth widening and cheek packing,
       under a pair of happy arcs. No blush — he is busy, not embarrassed. */
    .marquee-face.is-chewing .mouth-strip {
      animation: chew 0.48s steps(1) infinite !important;
    }
    @keyframes chew {
      0%    { transform: translateY(-240px); }
      33.4% { transform: translateY(-275px); }
      66.7% { transform: translateY(-310px); }
      100%  { transform: translateY(-240px); }
    }
    .marquee-face.is-chewing .eyes-open   { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-chewing .eyes-half   { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-chewing .eyes-closed { opacity: 0 !important; animation: none !important; }
    .marquee-face.is-chewing .eyes-happy  { opacity: 1 !important; }

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
