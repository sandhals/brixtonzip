import Layout from '@/components/Layout';
import LinkList from '@/components/LinkList';
import HeaderImage from '@/components/HeaderImage';

export default function ArchivePage() {
  return (
    <Layout variant="home" title="📰 reading archive">
            <HeaderImage src="/images/readingthepaper.png" alt="reading the paper" />
      <div className="box" style={{ paddingBottom: '4em' }}>
        <h1>Digital Reading Archive</h1>
        <br />
        <LinkList paginate={20} />
      </div>
    </Layout>
  );
}
