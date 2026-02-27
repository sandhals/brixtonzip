import { useState } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

const bios = [
  {
    words:15,
    content: (
      <p>Brixton is a Canadian writer, bodybuilder, avid language learner, and webmaster living in Seoul.</p>
    ),
  },
  {
    words: 50,
    content: (
      <p>Brixton was raised in a small town in Canada, moved to the Japanese countryside when he was 20, and has been living in Seoul, Korea for the past five years. He works there as a writer, but also enjoys studying languages, working out, and building websites in his free time.</p>
    ),
  },
  {
    words: 80,
    content: (
      <>
        <p>Brixton was born in Vancouver, Canada on August 23, 1994 and was raised in a small town in the Great Bear Rainforest some 700 kilometres north of it. He studied literature, philosophy, and mathematics before moving to the Japanese countryside when he was 20, and has now been living in Seoul, Korea for the past five years. He works there as a writer, but also enjoys studying languages, working out, and building websites in his free time.</p>
      </>
    ),
  },
  {
    words: 120,
    content: (
      <>
        <p>Brixton was born in Vancouver, Canada on August 23, 1994. He was raised in a small town in the Great Bear Rainforest some 700 kilometres north of it with his five siblings. Most of his hobbies today, including writing, coding, language learning, and bodybuilding, trace their origins to his early childhood, and have steadily evolved with him throughout his life. After pursuing a degree in literature, philosophy, and mathematics, he moved to the Japanese countryside when he was 20 and stayed there for five years before relocating to Seoul in 2021. There, he works as a writer, but also enjoys studying foreign languages, working out, and building websites like this one in his free time.</p>
      </>
    ),
  },
  {
    words: 200,
    content: (
      <>
        <p>Brixton was born  under the sign of Virgo in Vancouver, Canada on August 23, 1994, with Venus directly on his ascendant in Libra, and his moon in Pisces (for those who find these things interesting or important). Shortly after his birth, his mother returned home with him to a small town in the Great Bear Rainforest, just a few kilometres outside of Alaska. He grew up there with his five siblings, expressing an interest in languages and writing from a very early age. He also would build his first site in HTML there, but wouldn't return to it until years later while he was living in Japan. He'd eventually go on to pursue a degree in English literature, focusing on Modernist studies and Virginia Woolf, with minors in philosophy and mathematics. A few months after graduating, at age 20 he moved to a fishing port town in Shiga, Japan to work as an English teacher for five years. Today he works as a writer in Seoul, Korea, and spends his free time studying foreign languages, bodybuilding, and building websites like the one you're visiting now.</p>
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
