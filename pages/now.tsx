import { useState, useEffect } from 'react';
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

interface StatusItem { label: string; value: string; }
interface NowProps { status: StatusItem[]; }

export const getStaticProps: GetStaticProps<NowProps> = async () => {
  const status: StatusItem[] = [];
  for (const item of nowData.status) {
    if (item.label === 'reading' && !item.value) {
      try {
        const res = await fetch('https://www.goodreads.com/review/list_rss/6432075?shelf=currently-reading');
        const xml = await res.text();
        const titleMatch = xml.match(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
        const authorMatch = xml.match(/<item>[\s\S]*?<author_name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/author_name>/);
        if (titleMatch) {
          status.push({ label: 'reading', value: titleMatch[1] + (authorMatch ? ` by ${authorMatch[1]}` : '') });
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
              <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: '0.88em', marginRight: '0.3em' }}>{item.label}</span> {item.value}
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
          Updated {formatDate(nowData.lastUpdated)}. This is a <a href="https://nownownow.com/about">now page</a>, inspired by Derek Sivers.
        </p>
      </div>
    </Layout>
  );
}
