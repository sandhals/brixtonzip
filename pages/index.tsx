/*
┌─────────────────────────────────────────────────────────┐
│   WELCOME TO THE SOURCE CODE! ( ˘ ³˘)ノ°ﾟº❍｡♡            │─┐
│                                                         │ │
│      Everything here was written with love and by hand  │ │
│  in a text editor! No software, no web apps, just an    │ │
|  idea and a bit of time and effort spent at cafes       | |
|  around Seoul. Although this site is written in TSX,    | |
|  if you've never made a site before and are curious to  | |
|  try making one, HTML is a great place to start! I know | |
|  it looks a bit intimidating... but looks can be        | |
|  deceiving! I encourage you to look up a tutorial       | |
|  online and to try your hand at it. You might be        | |
|  surprised at what you can create with even just a few  | |
|  minutes of study! A good place to start is my friend   | |
|  Laurel's website http://veryinteractive.net/           | |
|  You can find plenty of tutorials and ideas for first   | |
|  projects there! Happy coding and happy reading~!       | |
│                                                         │ │
└─────────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘
*/

import Layout from '@/components/Layout'
import UnzipBox from '@/components/UnzipBox'
import LinkList from '@/components/LinkList'
import { GetStaticProps } from 'next'
import nowData from '@/data/now.json'

interface StatusItem {
  label: string;
  value: string;
}

interface HomeProps {
  status: StatusItem[];
  lastUpdated: string;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
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
  return { props: { status, lastUpdated: nowData.lastUpdated }, revalidate: 3600 };
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear().toString().slice(-2);
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${dd}.${mm}.${yy} ${hh}:${min}`;
};

export default function HomePage({ status, lastUpdated }: HomeProps) {

  return (
    <Layout variant="home" title="🙋🏻‍♂️ brixton.zip">
      <UnzipBox />
      <div className="box">
        <p className="hometext">
          <a href="/about" className="pill opener">PROFILE</a>
          Hi, I'm Brixton! I was born in Canada, relocated to the Japanese countryside in 2016, and since 2021 have been living in Korea. I spend most of my free time learning languages, working out, <a href="/garden">building websites</a>, reading, writing, and <a href="sketchbook">sketching</a>. Welcome to my online zip folder.
        </p>
        
        <p className="hometext">
          <a href="/tree" className="pill opener">SOCIALS</a>
          I mostly lurk (but occasionally tweet) at <a href="http://twitter.com/brixton">@brixton</a> on Twitter, I “post physique” at <a href="http://instagram.com/ydalir">@ydalir</a> on Insta, and I collect images, <a href="http://are.na/brixton/alexandria">PDFs,</a> and other digital bric-a-brac on <a href="http://are.na/brixton">Are.na.</a> I am also <a href="https://network.urbit.org/~sattex-ballet">~sattex-ballet</a> on Urbit.
        </p>

        {/* LANGUAGE */}
        <p className="hometext">
          <span className="pill opener">LANGUAGE</span>
          Most of my life circles around language. I write for a living, study its history and structure for fun, and <a href="language">learn new ones</a> when I have the time. The two foreign languages I study most closely are Japanese and Korean, and most of the serious linguistics reading I do is on <a href="https://www.are.na/brixton/japanese-korean-hypothesis"> their contested relationship</a> with each other. Recently, I've started <a href="files/chinese-anki.pdf">dabbling</a> in Chinese, and dabble in French and <span className="norwegian-easter"><a href="/lussekatter" className="hidden-link">N</a>orwegian</span> from time to time too.
        </p>

{/* (°ロ°) ! Psst... Hey! Hey, you!! I usually only 
    tell my friends this, but go back to the site homepage 
            and click the "N" in Norwegian for a secret surprise...  
                I know it looks like there's nothing there but... 
                    Just go click it! (╭ರ_•́) */}

        {/* ARTICLES */}
        <div className="hometext">
          <a href="/archive" className="pill opener">READING</a>
          <ul>
          <LinkList limit={5} />
            <li style={{ fontStyle: 'italic', fontSize: '80%', paddingTop: '0.5em' }}>
              <a href="archive">See more</a>.
            </li>
          </ul>
          <script src="/script.js?v=4"></script>
          <link rel="stylesheet" href="archive/style.css" />
        </div>

        {/* NOW */}
        <div className="hometext">
          <a href="/now" className="pill opener">NOW</a>
          <ul className="hometext">
            {status.map((item, i) => (
              <li key={i}><span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: '0.88em', marginRight: '0.3em' }}>{item.label}</span> {item.value}</li>
            ))}
            <li><span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: '0.88em', marginRight: '0.3em' }}>last updated</span> {formatDate(lastUpdated)}</li>
          </ul>
        </div>

<div className="showsource">
  this site was handmade with love <span id="heart">🩶</span>
</div>
      </div>
    </Layout>
  )
}


























/* the end */
/* if you can see this, all that space above is just to make the source code display better on my website's "hand-made with love" toggle" */