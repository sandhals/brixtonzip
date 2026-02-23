import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SPLIT = ['Arms', 'Chest', 'Back', 'Delts', 'Arms', 'Chest', 'Rest'];

export default function NowPage() {
  const [updated, setUpdated] = useState('');

  useEffect(() => {
    const lastUpdated = new Date('2026-02-23');
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) setUpdated('Updated today');
    else if (diff === 1) setUpdated('Updated yesterday');
    else setUpdated(`Updated ${diff} days ago`);
  }, []);

  return (
    <Layout variant="home" title="📍 now">
      <HeaderImage src="/images/me.png" alt="me" />
      <div className="box">
        <h1>Now</h1>

        <h2>Current Split</h2>
        <table style={{ borderCollapse: 'collapse', fontFamily: 'Roboto, sans-serif', fontWeight: 300, fontSize: '0.85em', marginBottom: '1.5em', width: '100%', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {DAYS.map(day => (
                <td key={day} style={{ padding: '0.25em 0', fontWeight: 400, textAlign: 'center', width: `${100/7}%` }}>{day}</td>
              ))}
            </tr>
            <tr>
              {SPLIT.map((focus, i) => (
                <td key={i} style={{ padding: '0.25em 0', textAlign: 'center', width: `${100/7}%` }}>{focus}</td>
              ))}
            </tr>
          </tbody>
        </table>

        <h2>Languages</h2>
        <p>For the first few months of the year I'm focusing on French, and maintaining my Japanese and Korean more passively.</p>

        <h2>Reading</h2>
        <p>This year I'm focusing on making reading a habit again. I'm trying to read more consistently and broadly. You can follow along on <a href="https://goodreads.com/lehtia">Goodreads</a>.</p>

        <p style={{ fontSize: '0.6em', opacity: 0.5, fontStyle: 'italic', fontFamily: 'Roboto, sans-serif', fontWeight: 300, marginTop: '2em', textIndent: 0 }}>
          {updated && `${updated}. `}This is a <a href="https://nownownow.com/about">now page</a>, inspired by Derek Sivers.
        </p>
      </div>
    </Layout>
  );
}
