import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function AboutPage() {
  return (
    <Layout variant="home" title="🙋🏻‍♂️ about">
      <HeaderImage src="/images/me.png" alt="me" />
      <div className="box">
        <h1>About</h1>
        <p>Hi, I'm Brixton! I was born in Canada, relocated to the Japanese countryside in 2016, and since 2021 have been living in Korea. I spend most of my free time learning languages, working out, <a href="/garden">building websites</a>, reading, writing, and <a href="sketchbook">sketching</a>. Welcome to my online zip folder.</p>

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
