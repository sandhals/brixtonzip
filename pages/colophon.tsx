import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function LanguagePage() {
  return (
    <Layout variant="home" title="👨🏻‍💻 colophon">
            <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Colophon</h1>
        <h2>Design</h2>
        <p>The main visual inspiration for my site comes from the <a href="https://briefcompany.net">receipt camera</a> photobooths that were becoming popular in Korean cafes around the time the time I registered this domain. To achieve the look, I have the source code bleeding through the background, and for the images at the top of each page, I run the files through this simple <a href="https://ditherit.com">dithering tool</a> with the "Black & White" palette and "Stucki" algorithm toggled on. I've tried to restrict myself to a monochrome colour scheme, but as an homage to the early web, I've kept my hyperlinks a bright shade of "internet blue."</p>
        <h2>Code</h2>
        <p>Originally, my whole site was written using just HTML and CSS, but eventually it became my experimentation ground for teaching myself TSX. At first, using it sort of felt like a betrayal of my indie web roots, but switching from static to dynamic allowed me to start using things like components (which have been extremely useful and time-saving) and allow me to access external APIs, like the <a href="http://curius.app">Curius</a> reading list I have displayed on my homepage (an idea I stole from <a href="http://benneo.xyz">Ben Neo</a>).</p>
        <h2>Background</h2>
        <p>The inspiration to build a personal site goes back a bit further. I had an English teacher in elementary school who knew HTML and CSS. As an enthusiastic, young purveyor of GeoCities and AngelFire anime fansites, I was eager to learn a bit myself. And so my very first encounter with HTML was during lunch hours with her and one of my childhood friends.</p>
        <p>In the years after, I used bits of CSS to customize my deviantART journal layouts and Tumblr themes growing up, but it wasn't until years later, after I joined Are.na, that I entertained learning it again properly. Through Are.na got exposed very early on to people like <a href="https://laurel.world">Laurel Schwulst</a> and <a href="https://elliot.computer">Elliot Cost</a>, and seeing their sites and digital experimentations reignited the same curiosity I had as a young child. </p>
        <p>All this was happening right around the time of COVID, and so with a lot of spare time at my work desk in rural Japan, I started to teach myself bit by bit. I've since become a big advocate for personal websites. I've taught a bunch of my friends and family, run camps teaching elementary students how to code, and have made friends with people all over the world through the indie web community.</p>
              

        <br />
      </div>
    </Layout>
  );
}
