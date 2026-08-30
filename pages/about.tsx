import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';
import { diff, render, cost, type Op } from '@/lib/morph';

const bios = [
  {
    words: 15,
    text: "Brixton is a Canadian writer, bodybuilder, avid language learner, and webmaster living in Seoul.",
  },
  {
    words: 50,
    text: "Brixton was raised in a small town in Canada, moved to the Japanese countryside when he was 20, and has been living in Seoul, Korea for the past five years. He works there as a writer, but also enjoys studying languages, working out, and building websites in his free time.",
  },
  {
    words: 80,
    text: "Brixton was born in Vancouver, Canada on August 23, 1994 and was raised in a small town in the Great Bear Rainforest some 700 kilometres north of it. He studied literature, philosophy, and mathematics before moving to the Japanese countryside when he was 20, and has now been living in Seoul, Korea for the past five years. He works there as a writer, but also enjoys studying languages, working out, and building websites in his free time.",
  },
  {
    words: 120,
    text: "Brixton was born in Vancouver, Canada on August 23, 1994. He was raised in a small town in the Great Bear Rainforest some 700 kilometres north of it with his five siblings. Most of his hobbies today, including writing, coding, language learning, and bodybuilding, trace their origins to his early childhood, and have steadily evolved with him throughout his life. After pursuing a degree in literature, philosophy, and mathematics, he moved to the Japanese countryside when he was 20 and stayed there for five years before relocating to Seoul in 2021. There, he works as a writer, but also enjoys studying foreign languages, working out, and building websites like this one in his free time.",
  },
  {
    words: 200,
    text: "Brixton was born  under the sign of Virgo in Vancouver, Canada on August 23, 1994, with Venus directly on his ascendant in Libra, and his moon in Pisces (for those who find these things interesting or important). Shortly after his birth, his mother returned home with him to a small town in the Great Bear Rainforest, just a few kilometres south of Alaska. He grew up there with his five siblings, expressing an interest in languages and writing from a very early age. He also would build his first site in HTML there, but wouldn't return to it until years later while he was living in Japan. He'd eventually go on to pursue a degree in English literature, focusing on Modernist studies and Virginia Woolf, with minors in philosophy and mathematics. A few months after graduating, at age 20 he moved to a fishing port town in Shiga, Japan to work as an English teacher for five years. Today he works as a writer in Seoul, Korea, and spends his free time studying foreign languages, working out, and building websites like the one you're visiting now.",
  },
];

// Diffs are cached rather than precomputed: a morph can start from a partially
// typed string, so the "from" side is not always one of the five bios.
const cache = new Map<string, Op[]>();
const diffFor = (from: string, to: string): Op[] => {
  const key = from.length + '|' + to.length + '|' + from.slice(0, 24) + to.slice(0, 24);
  let ops = cache.get(key);
  if (!ops) { ops = diff(from, to); cache.set(key, ops); }
  return ops;
};

// The magnet. RAMP is how abruptly the thumb crosses between nodes — the whole
// crossing happens within 1/RAMP of the gap, so at 7 the thumb is pinned for
// roughly the first and last 43% of the travel. GIVE is the small amount of
// play it keeps inside a detent, so it still feels held rather than frozen.
// Characters arrive several per frame, which pops. Ramping the opacity of the
// newest few gives the edge of the text a soft leading edge instead.
const FADE = 5;

const RAMP = 7;
const GIVE = 0.12;

const detent = (v: number) => {
  const n = Math.floor(v);
  const f = v - n;
  if (f === 0) return v;
  const snap = Math.max(0, Math.min(1, (f - 0.5) * RAMP + 0.5));
  return n + GIVE * f + (1 - GIVE) * snap;
};

const clamp = (v: number) => Math.max(0, Math.min(bios.length - 1, v));

export default function AboutPage() {
  const [pos, setPos] = useState(1);
  const [reduced, setReduced] = useState(false);
  const [shown, setShown] = useState(bios[1].text);
  const [caret, setCaret] = useState<number | null>(null);
  const posRef = useRef(1);
  const shownRef = useRef(bios[1].text);
  const levelRef = useRef(1);
  const frame = useRef<number | null>(null);
  const typing = useRef<number | null>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const release = useRef<ReturnType<typeof setTimeout> | null>(null);

  const put = (v: number) => { posRef.current = v; setPos(v); };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    if (typing.current) cancelAnimationFrame(typing.current);
    if (release.current) clearTimeout(release.current);
  }, []);

  // The text is deliberately NOT tied to the slider position — it waits for the
  // thumb to snap, then types the delta in. Starting from whatever is currently
  // on screen makes it interruptible: snap again mid-type and it re-diffs from
  // the half-written paragraph rather than jumping.
  const level = Math.round(pos);
  useEffect(() => {
    if (level === levelRef.current) return;
    levelRef.current = level;

    if (typing.current) cancelAnimationFrame(typing.current);
    const to = bios[level].text;

    if (reduced) { shownRef.current = to; setShown(to); setCaret(null); return; }

    const ops = diffFor(shownRef.current, to);
    const dur = Math.max(420, Math.min(1600, 320 + cost(ops) * 1.8));

    // Claim the finished height, and let CSS slide the paragraph to it so that
    // whatever follows eases into place instead of jumping. Because this is the
    // paragraph's own height, everything after it in normal flow comes along —
    // the table today, anything added later for free.
    // min-height rather than height, so nothing can ever be clipped.
    const el = para.current;
    let toH = 0;
    if (el) {
      if (release.current) { clearTimeout(release.current); release.current = null; }
      const probe = el.cloneNode(false) as HTMLElement;   // same classes, no children
      probe.textContent = to;
      probe.style.cssText = 'position:absolute;visibility:hidden;min-height:0;height:auto;width:'
        + el.clientWidth + 'px';
      el.parentElement?.appendChild(probe);
      toH = probe.offsetHeight;
      probe.remove();

      // min-height starts out `auto`, which is not interpolable — setting a
      // pixel value straight onto it skips the transition entirely. Pin the
      // current height first and flush layout so there is a real number to
      // animate away from.
      if (!el.style.minHeight) {
        el.style.minHeight = el.offsetHeight + 'px';
        void el.offsetHeight;
      }
      // Growing, this opens the space now and the text fills it. Shrinking, the
      // taller height is held until the text has contracted — closing early
      // would crop it — and released at the end, below.
      el.style.minHeight = Math.max(el.offsetHeight, toH) + 'px';
    }

    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const out = render(ops, k);
      shownRef.current = out.text;
      setShown(out.text);
      setCaret(k < 1 ? out.caret : null);
      if (k < 1) typing.current = requestAnimationFrame(step);
      else {
        typing.current = null;
        shownRef.current = to;
        setShown(to);
        if (el) {
          el.style.minHeight = toH + 'px';     // shrink case: now slides closed
          // hand height back to the content once the slide has finished, so a
          // window resize can reflow freely
          release.current = setTimeout(() => { el.style.minHeight = ''; }, 620);
        }
      }
    };
    typing.current = requestAnimationFrame(step);
  }, [level, reduced]);

  // Easing home is also what finishes a half-typed morph, since the text is a
  // pure function of the slider position.
  const glideTo = (dest: number) => {
    if (frame.current) cancelAnimationFrame(frame.current);
    if (reduced) { put(dest); return; }
    const from = posRef.current;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 260);
      put(from + (dest - from) * (1 - (1 - k) ** 3));
      if (k < 1) frame.current = requestAnimationFrame(step);
      else { frame.current = null; put(dest); }
    };
    frame.current = requestAnimationFrame(step);
  };

  return (
    <Layout variant="home" title="🙋🏻‍♂️ about">
      <HeaderImage src="/images/me.png" alt="me" />
      <div className="box">
        <h1>About</h1>

        <div className="bio-slider">
          <input
            type="range"
            min={0}
            max={bios.length - 1}
            step={0.001}
            value={pos}
            aria-label="Bio length"
            aria-valuetext={`Under ${bios[level].words} words`}
            onPointerDown={() => {
              if (frame.current) { cancelAnimationFrame(frame.current); frame.current = null; }
            }}
            onChange={(e) => {
              // A range fires a native `change` immediately AFTER pointerup. Left
              // alone it lands mid-snap and cancels the glide a frame in, so the
              // thumb stops at whatever fraction it had reached. Dragging cancels
              // the glide on pointerdown instead.
              if (frame.current !== null) return;
              put(detent(Number(e.target.value)));
            }}
            onPointerUp={() => glideTo(Math.round(posRef.current))}
            onPointerCancel={() => glideTo(Math.round(posRef.current))}
            onBlur={() => glideTo(Math.round(posRef.current))}
            onKeyDown={(e) => {
              // at step 0.001 the native arrow keys would nudge by a thousandth
              const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1
                      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              glideTo(clamp(Math.round(posRef.current) + d));
            }}
            className="bio-range"
          />
          <span className="bio-label">Under {bios[level].words} words</span>
        </div>

        {/* The animating copy is hidden from assistive tech — a paragraph that
            rewrites itself on every pointer move is unreadable aloud. The
            settled bio is exposed separately, below. */}
        <p ref={para} className="bio-text" aria-hidden="true">
          {caret === null ? shown : (
            <>
              {shown.slice(0, Math.max(0, caret - FADE))}
              {shown.slice(Math.max(0, caret - FADE), caret).split('').map((ch, i, a) => (
                <span key={i} style={{ opacity: (i + 1) / (a.length + 1) }}>{ch}</span>
              ))}
              {shown.slice(caret)}
            </>
          )}
        </p>
        <p className="visually-hidden">{bios[level].text}</p>

        <h2>Preferred Transliterations</h2>
        <table style={{ borderCollapse: 'collapse', fontFamily: 'Roboto, sans-serif', fontWeight: 300, fontSize: '0.85em', marginBottom: '1.5em' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.25em 1.5em 0.25em 0' }}>日本語</td>
              <td style={{ padding: '0.25em 0' }}>ブリクストン</td>
            </tr>
            <tr>
              <td style={{ padding: '0.25em 1.5em 0.25em 0' }}>한국어</td>
              <td style={{ padding: '0.25em 0' }}>브릭스턴</td>
            </tr>
            <tr>
              <td style={{ padding: '0.25em 1.5em 0.25em 0' }}>中文</td>
              <td style={{ padding: '0.25em 0' }}>
                <span className="name-tooltip">
                  振楠
                  <span className="name-tooltip-text">My name can be written phonetically in Japanese as 振楠敦 (Buri-kusu-ton). I use the same first two characters for my Chinese name: Zhènnán. </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
