import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function LanguagePage() {
  return (
    <Layout variant="home" title="💬 language">
            <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Colophon</h1>
        <p>The main visual inspiration for my site comes from the <a href="https://briefcompany.net">receipt camera</a> photobooths that were becoming popular in Korean cafes around the time the time I registered this domain.</p>
        <p>I originally wrote this site in pure HTML, but eventually it sort of became my experimentation ground for learning TSX. Somehow, it felt like a betrayal of my indie web roots, but switching to from static to dynamic allowed me use things pre-built layouts and external APIs, such as the <a href="http://curius.app">Curius</a> reading list I have displayed on my homepage (an idea I stole from <a href="http://benneo.xyz"></a>).</p>
              

        <br />
      </div>
    </Layout>
  );
}
