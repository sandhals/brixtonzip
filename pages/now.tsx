import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';
import { GetStaticProps } from 'next';
import nowData from '@/data/now.json';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear().toString().slice(-2);
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${dd}.${mm}.${yy} ${hh}:${min}`;
};

interface Book { title: string; author: string; }
interface StatusItem { label: string; value: string; values?: Book[]; }
interface NowProps { status: StatusItem[]; }

type AuthorFmt = 'full' | 'initials' | 'last' | 'fallback';

function shortenAuthor(author: string, fmt: AuthorFmt): string {
  if (fmt === 'full' || fmt === 'fallback') return author;
  const parts = author.trim().split(/\s+/);
  if (parts.length <= 1) return author;
  const last = parts[parts.length - 1];
  if (fmt === 'last') return last;
  const inits = parts.slice(0, -1).map(p => p.replace(/\./g, '')[0]).filter(Boolean) as string[];
  return inits.length >= 2 ? `${inits.join('')} ${last}` : `${inits[0]}. ${last}`;
}

function ReadingCycler({ books }: { books: Book[] }) {
  const [state, setState] = useState({ idx: 0, fmt: 'full' as AuthorFmt });
  const [visible, setVisible] = useState(true);
  const spanRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    setVisible(false);
    if (fadeRef.current) clearTimeout(fadeRef.current);
    fadeRef.current = setTimeout(() => {
      setState(s => ({ idx: (s.idx + 1) % books.length, fmt: 'full' }));
      setVisible(true);
    }, 180);
  };
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, 3000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (state.fmt === 'fallback') return;
    const el = spanRef.current;
    if (!el) return;
    const { height } = el.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const lineH = isNaN(lh) ? parseFloat(getComputedStyle(el).fontSize) * 1.4 : lh;
    if (height > lineH * 1.5) {
      setState(s => {
        const next: AuthorFmt = s.fmt === 'full' ? 'initials' : s.fmt === 'initials' ? 'last' : 'fallback';
        return { ...s, fmt: next };
      });
    }
  }, [state]);

  const { idx, fmt } = state;
  const book = books[idx];
  const author = book.author ? shortenAuthor(book.author, fmt) : '';

  return (
    <span ref={spanRef} onClick={() => { advance(); resetTimer(); }} style={{ cursor: 'e-resize' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '0.6em', marginRight: '0.35em' }}>({idx + 1}/{books.length})</span><span style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease' }}>{book.title}{author ? ` by ${author}` : ''}</span>
    </span>
  );
}

export const getStaticProps: GetStaticProps<NowProps> = async () => {
  const status: StatusItem[] = [];
  for (const item of nowData.status) {
    if (item.label === 'reading' && !item.value) {
      try {
        const res = await fetch('https://www.goodreads.com/review/list_rss/6432075?shelf=currently-reading');
        const xml = await res.text();
        const books = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
          const block = m[1];
          const rawTitle = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1];
          const author = block.match(/<author_name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/author_name>/)?.[1] ?? '';
          const title = rawTitle ? rawTitle.replace(/\s*:.*$/, '') : null;
          return title ? { title, author } : null;
        }).filter((b): b is Book => b !== null);
        if (books.length > 0) {
          const first = books[0];
          status.push({ label: 'reading', value: first.title + (first.author ? ` by ${first.author}` : ''), ...(books.length > 1 ? { values: books } : {}) });
        }
      } catch {}
    } else if (item.value) {
      status.push(item);
    }
  }
  return { props: { status }, revalidate: 3600 };
};

export default function NowPage({ status }: NowProps) {
  const [today, setToday] = useState(-1);

  useEffect(() => {
    const jsDay = new Date().getDay();
    setToday(jsDay === 0 ? 6 : jsDay - 1);
  }, []);

  const renderBody = (body: string) => {
    const parts = body.split(/\[([^\]]+)\]\(([^)]+)\)/);
    return parts.map((part, i) => {
      if (i % 3 === 1) return <a key={i} href={parts[i + 1]}>{part}</a>;
      if (i % 3 === 2) return null;
      return part;
    });
  };

  return (
    <Layout variant="home" title="📍 now">
      <HeaderImage src="/images/me.png" alt="me" />
      <div className="box">
        <h2>Currently</h2>
        <ul style={{ marginBottom: '1.5em', paddingLeft: 0, marginLeft: 0, marginTop: 0, listStyle: 'none' }}>
          {status.map((item, i) => (
            <li key={i} style={{ fontFamily: 'Garamond, serif', fontSize: '14pt' }}>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: '0.88em', marginRight: '0.3em' }}>{item.label}</span>{item.values && item.values.length > 1 ? <ReadingCycler books={item.values} /> : item.value}
            </li>
          ))}
        </ul>

        <h2>Workout Split</h2>
        <table style={{ borderCollapse: 'collapse', fontFamily: 'Roboto, sans-serif', fontWeight: 300, fontSize: '0.85em', marginBottom: '1.5em', width: '100%', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {DAYS.map((day, i) => (
                <td key={day} style={{ padding: '0.25em 0', fontWeight: 400, textAlign: 'center', width: `${100/7}%`, ...(i === today ? { background: 'var(--black)', color: 'var(--white)' } : {}) }}>{day}</td>
              ))}
            </tr>
            <tr>
              {nowData.split.map((focus, i) => (
                <td key={i} style={{ padding: '0.25em 0', textAlign: 'center', width: `${100/7}%`, ...(i === today ? { background: 'var(--black)', color: 'var(--white)' } : {}) }}>{focus}</td>
              ))}
            </tr>
          </tbody>
        </table>

        {nowData.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '1.5em' }}>
            <h2>{section.title}</h2>
            <p style={{ fontSize: '14pt', textIndent: '2rem', marginBottom: '1rem' }}>{renderBody(section.body)}</p>
          </div>
        ))}

        <p style={{ fontSize: '0.75em', fontStyle: 'italic', fontFamily: 'Roboto, sans-serif', fontWeight: 300, marginTop: '2em', textIndent: 0 }}>
          Updated {formatDate(nowData.lastUpdated)}. This is a <a href="https://nownownow.com/about" style={{ fontSize: 'inherit' }}>now page</a>, inspired by Derek Sivers.
        </p>
      </div>
    </Layout>
  );
}
