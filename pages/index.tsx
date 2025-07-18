import Layout from '@/components/Layout'
import UnzipBox from '@/components/UnzipBox'
import LinkList from '@/components/LinkList'

export default function HomePage() {
  return (
    <Layout variant="home" title="🙋🏻‍♂️ brixton.zip">
      <UnzipBox />
      {/* UNZIP BOX */}
      {/* <UnzipBox /> */}

      {/* PROFILE */}
      <div className="box">
        <p className="hometext">
          <span className="pill opener">PROFILE</span>
          Hi, I'm Brixton! I was born in Canada, relocated to the Japanese countryside in 2016, and since 2021 have been living in Korea. I spend most of my free time learning languages, working out, building websites, reading, writing, and <a href="sketchbook">sketching</a>. Welcome to my online zip folder.
        </p>

        {/* SOCIALS */}
        <p className="hometext">
          <span className="pill opener">SOCIALS</span>
          I mostly lurk (but occasionally tweet) at <a href="http://twitter.com/brixton">@brixton</a> on Twitter, I “post physique” at <a href="http://instagram.com/ydalir">@ydalir</a> on Insta, and I collect images, <a href="http://are.na/brixton/alexandria">PDFs,</a> and other digital bric-a-brac on <a href="http://are.na/brixton">Are.na.</a> I am also <a href="https://network.urbit.org/~sattex-ballet">~sattex-ballet</a> on Urbit.
        </p>

        {/* LANGUAGE */}
        <p className="hometext">
          <span className="pill opener">LANGUAGE</span>
          Most of my life circles around language. I write for a living, study its history and structure for fun, and <a href="language">learn new ones</a> when I have the time. The two foreign languages I study most closely are Japanese and Korean, and most of the serious linguistics reading I do is on <a href="https://www.are.na/brixton/japanese-korean-hypothesis">their contested relationship</a> with each other. Recently, I've started <a href="files/chinese-anki.pdf">dabbling</a> in Chinese, and dabble in French and Norwegian from time to time too.
        </p>

        {/* ARTICLES */}
        <div className="hometext">
          <span className="pill opener">ARTICLES</span>
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
          <span className="pill opener">NOW</span>
          <ul className="hometext">
            <li>
              Switched my site from static to dynamic! TSX is so powerful, I love it. Weekly workouts have slowed to about three or four a week, but it seems to be enough. 
            </li>
          </ul>
        </div>

<div className="showsource">
  this site was handmade with love <span id="heart">🩶</span>
</div>
      </div>
    </Layout>
  )
}
