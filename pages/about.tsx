import { useState } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

const bios = [
  {
    words:15,
    content: (
      <p>Brixton is a Canadian an avid language learner, writer, bodybuilder, and webmaster living in Seoul.</p>
    ),
  },
  {
    words: 50,
    content: (
      <p>Brixton was raised in a small town in Canada, moved to the Japanese countryside when he was 20, and has been living in Seoul, Korea for the past five years. He works as a writer, but also enjoys studying languages, working out, and building websites in his free time.</p>
    ),
  },
  {
    words: 100,
    content: (
      <>
        <p>Brixton was born in Vancouver on August 23, 1994 and raised in a small town in the Great Bear Rainforest some 700 kilometres north of it. He studied literature, philosophy, and mathematics before moving to the Japanese countryside when he was 20, and has been living in Seoul, Korea for the past five years since. He works there as a writer, but also enjoys studying languages, working out, and building websites in his free time. He is interested in language and the body as two forms of one aesthetic experience.</p>
      </>
    ),
  },
  {
    words: 150,
    content: (
      <>
        <p>Hi, I'm Brixton! I was born in Canada, relocated to the Japanese countryside in 2016, and since 2021 have been living in Korea.</p>
        <p>Languages have been the throughline of my adult life. I moved to rural Japan straight out of university to teach English and study Japanese, living in a small town where I was often the only foreigner around. After five years I'd built a life there, but the pull of something new led me to South Korea, where I've been learning Korean and more recently Mandarin.</p>
        <p>Outside of languages, I spend my time working out, <a href="/garden">building websites</a>, reading, writing, and <a href="/sketchbook">sketching</a>. Welcome to my online zip folder.</p>
      </>
    ),
  },
  {
    words: 250,
    content: (
      <>
        <p>Hi, I'm Brixton! I was born in Canada, relocated to the Japanese countryside in 2016, and since 2021 have been living in Korea.</p>
        <p>Languages have been the throughline of my adult life. I moved to rural Japan straight out of university to teach English and study Japanese, living in a small town where I was often the only foreigner around. After five years I'd built a life there, but the pull of something new led me to South Korea, where I've been learning Korean and more recently Mandarin.</p>
        <p>Outside of languages, I spend my time working out, <a href="/garden">building websites</a>, reading, writing, and <a href="/sketchbook">sketching</a>. I'm interested in how design, language, and technology intersect — and this site is a home for those interests. Part portfolio, part notebook, part archive. Welcome to my online zip folder.</p>
        <p>This site has gone through many iterations over the years. It started as a simple blog, grew into a portfolio, and has since become something closer to a personal archive — a place to collect the things I make, learn, and think about. If you're here, feel free to look around.</p>
      </>
    ),
  },
];

export default function AboutPage() {
  const [level, setLevel] = useState(1);

  return (
    <Layout variant="home" title="🙋🏻‍♂️ about">
      <HeaderImage src="/images/me.png" alt="me" />
      <div className="box">
        <h1>About</h1>

        <div className="bio-slider">
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="bio-range"
          />
          <span className="bio-label">Under {bios[level].words} words</span>
        </div>

        {bios[level].content}

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
                  <span className="name-tooltip-text">Derived from a kanji reading of my name in Japanese, where 振 is read as "buri" and 楠 as "kusu." In Mandarin these characters are read as zhènnán, which happens to work as a plausible-sounding Chinese given name.</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
