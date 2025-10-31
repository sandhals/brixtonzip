import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function LanguagePage() {
  return (
    <Layout variant="home" title="💬 language">
            <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Colophon</h1>
        <p>The main visual inspiration for my site comes from the <a href="https://briefcompany.net">receipt camera</a> photobooths that were becoming popular in Korean cafes around the time the time I registered this domain. To achieve the look, I have the source code bleeding through the background, and for the images at the top of each page, I run the files through this simple <a href="https://ditherit.com">dithering tool</a> with the "Black & White" palette and "Stucki" algorithm toggled on.</p>
        <p>Originally, my whole site was written using pure HTML, but eventually it became my experimentation ground for teaching myself TSX. At first, using it sort of felt like a betrayal of my indie web roots, but switching from static to dynamic allowed me to start using things like components (which have been extremely useful and time-saving) and external APIs, like the <a href="http://curius.app">Curius</a> reading list I have displayed on my homepage (an idea I stole from <a href="http://benneo.xyz">Ben Neo</a>).</p>
        <p></p>
              

        <br />
      </div>
    </Layout>
  );
}
