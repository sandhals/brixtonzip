import Layout from '@/components/Layout';

interface LinkItem {
  title: string;
  url: string;
}

const TreePage = () => {
  const links: LinkItem[] = [
    {
      title: "Twitter",
      url: "https://twitter.com/brixton"
    },
    {
      title: "Instagram",
      url: "https://instagram.com/ydalir"
    },
    {
      title: "Are.na",
      url: "https://are.na/brixton"
    },
    {
      title: "Ko-fi",
      url: "https://ko-fi.com/brixton"
    },
    {
      title: "Amazon Wishlist",
      url: "https://www.amazon.com/hz/wishlist/ls/1ZG25EG7ZYUTS?ref_=wl_share"
    }
  ];

  return (
    <Layout variant="home" title="🌳 links - brixton.zip">
      <div className="box">
        <div className="tree-container">
          <div className="profile">
            <h1>@brixton</h1>
            <p>find me on other people's sites!</p>
          </div>

          <div className="links">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button"
              >
                {link.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.box) {
          min-height: calc(100vh - 200px);
        }

        .tree-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .profile {
          text-align: center;
          margin-bottom: 2rem;
        }

        .profile h1 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          font-weight: 500;
        }

        .profile p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .link-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.875rem 1rem;
          background: var(--white);
          border: 2px solid black;
          text-align: center;
          text-decoration: none;
          color: black;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.15s ease;
        }

        .link-button:hover {
          background: black;
          color: var(--white);
        }

        @media (max-width: 768px) {
          .tree-container {
            padding: 1.5rem 1rem;
          }

          .profile h1 {
            font-size: 1.35rem;
          }

          .link-button {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default TreePage;
