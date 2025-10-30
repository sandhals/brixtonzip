import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

export default function LanguagePage() {
  return (
    <Layout variant="home" title="💬 language">
            <HeaderImage src="/images/laptop.png" alt="a cafe spread with my laptop" />
      <div className="box">
        <h1>Colophon</h1>
        <p>The main visual design inspiration for my site comes from receipt printer photobooths that were becoming popular in Seoul around the time that I started building it.</p>
              

        <br />
      </div>
    </Layout>
  );
}
