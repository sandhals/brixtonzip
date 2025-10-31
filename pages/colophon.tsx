import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function LanguagePage() {
  return (
    <Layout variant="home" title="💬 language">
            <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Colophon</h1>
        <p>The main visual inspiration for my site comes from the <a href="https://briefcompany.net">receipt camera</a> photobooths that were becoming popular in Korean cafes around the time the time I registered this domain. To achieve that receipt-look on the images at the top of each page, I run the files through this simple <a href="https://ditherit.com">dithering tool</a> I found online with the "Black & White" palette and "Stucki" algorithm toggled on.</p>
        <p>This whole site was originally written in pure HTML, but eventually it became my experimentation ground for learning TSX. At first, it almost felt like a betrayal of my indie web roots, but switching from static to dynamic allowed me use things layouts (which has been extremely useful) and external APIs, like the <a href="http://curius.app">Curius</a> reading list I have displayed on my homepage (an idea I stole from <a href="http://benneo.xyz">Ben Neo</a>).</p>
        
              

        <br />
      </div>
    </Layout>
  );
}
