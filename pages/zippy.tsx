import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';
import Zippy from '@/components/Zippy';

// Each tile is the real behaviour, not a diorama of it: where a state is set
// off by pointing or clicking, the tile is set off the same way. `data-pose` is
// read by the [data-pose] rules in components/Header.tsx, which is where all of
// Zippy's state CSS lives.
export default function ZippyPage() {
  const [zipped, setZipped] = useState(false);
  const [sleep, setSleep] = useState<'asleep' | 'woken' | 'dozing'>('asleep');
  const doze = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (doze.current) clearTimeout(doze.current); }, []);

  const wake = () => {
    if (doze.current) { clearTimeout(doze.current); doze.current = null; }
    setSleep('woken');
  };

  // Same shape as the real one in public/script.js: leaving starts a three
  // second nod-off, and coming back interrupts it.
  const nodOff = () => {
    setSleep('dozing');
    doze.current = setTimeout(() => setSleep('asleep'), 3000);
  };

  return (
    <Layout variant="home" title="👋 zippy">
      <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Meet Zippy!</h1>
        <p>Zippy is my very own tamagotchi/virtual-pet/mascot-character/tribute-to-Clippy. He's here to keep you company while you browse my site. He doesn't do much, but everything he does do, I've recorded here on this page. He's always happy to receive guests at brixton.zip, and he's even more happy to see you're interested in getting to know him a little better!</p>
        <div className="zippy-grid">

          <div className="zippy-card">
            <div className="zippy-chip" data-pose="demo-hover" aria-hidden="true">
              <Zippy />
            </div>
            <div className="zippy-text">
              <h3>idle and attentive</h3>
              <p>Zippy spends most of his time reciting Brixton's daily schedule. His SVG mouthflaps cycle between a square, circle, and diamond to represent his speech. If you interrupt him by hovering over him, he'll freeze, shocked, in the circle position.</p>
            </div>
          </div>

          <div className="zippy-card">
            <div className="zippy-chip" data-pose="reading" aria-hidden="true">
              <Zippy />
            </div>
            <div className="zippy-text">
              <h3>reading</h3>
              <p>If you open the source code or highlight any text on the website, Zippy, being farsighted, will whip out his glasses so he can read along with you.</p>
            </div>
          </div>

          {/* A working copy of the control from the corner of the real pages.
              The <label> wraps the whole chip, so a click anywhere on the black
              square ticks the box. */}
          <div className="zippy-card">
            <label className="zippy-chip zippy-zip" data-pose={zipped ? 'unzipped' : 'demo-zip'}>
              <Zippy />
              <span className="zippy-zip-label" aria-hidden="true">{zipped ? 'ZIP?' : 'UNZIP?'}</span>
              <input
                type="checkbox"
                checked={zipped}
                onChange={(e) => setZipped(e.target.checked)}
                aria-label="Unzip Zippy"
              />
            </label>
            <div className="zippy-text">
              <h3>flustered, and unzipped</h3>
              <p>If you hover over the "UNZIP" checkbox, Zippy will get a little nervous. Click it and reveal the menu lying under the hood, he gets really embarrassed. Wouldn't you?</p>
            </div>
          </div>

          <div
            className="zippy-card"
            onMouseEnter={wake}
            onMouseLeave={nodOff}
          >
            <div className="zippy-chip" data-pose={sleep} aria-hidden="true">
              <Zippy />
            </div>
            <div className="zippy-text">
              <h3>asleep, woken, dozing off</h3>
              <p>Even virtual pets need sleep! Zippy gets his eight hours of rest from 11:00 to 7:00, KST (Fridays and Saturdays, he sleeps and wakes a little later though). You can try waking him by hovering your mouse over his eyes, but he'll doze off again once you leave him.</p>
            </div>
          </div>

        </div>
        <br />
      </div>
    </Layout>
  );
}
