import Layout from '@/components/Layout';
import LinkList from '@/components/LinkList';
import HeaderImage from '@/components/HeaderImage';

export default function ArchivePage() {
  return (
    <Layout variant="home" title="📰 reading archive">
            <HeaderImage src="/images/readingthepaper.png" alt="reading the paper" />
      <div className="box">
        <h1>Digital Reading Archive</h1>
        <br />
        <LinkList />
      </div>
    </Layout>
  );
}
