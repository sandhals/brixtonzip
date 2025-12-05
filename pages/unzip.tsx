import Head from 'next/head';
import { useEffect, useState, useMemo } from 'react';

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  url: string;
}

interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: TreeNode[];
}

// Utility: Check if file is an index file
function isIndexFile(name: string): boolean {
  return ['index.tsx', 'index.ts', 'index.jsx', 'index.js'].includes(name);
}

// Utility: Generate local URL from file path
function generateLocalUrl(path: string): string {
  if (path.startsWith('pages/')) {
    const pagePath = path.substring(6).replace(/\.(tsx?|jsx?)$/, '');
    if (pagePath === 'index') return '/';
    if (pagePath.endsWith('/index')) return `/${pagePath.replace(/\/index$/, '')}`;
    return `/${pagePath}`;
  } else if (path.startsWith('public/garden/')) {
    return `/${path.substring(7)}`;
  }
  return '';
}

// Utility: Sort tree nodes (index files first, then dirs, then files alphabetically)
function sortTreeNodes(nodes: TreeNode[], prioritizeIndex = true): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (prioritizeIndex) {
      const aIsIndex = isIndexFile(a.name);
      const bIsIndex = isIndexFile(b.name);
      if (aIsIndex && !bIsIndex) return -1;
      if (!aIsIndex && bIsIndex) return 1;
    }
    if (a.type === 'dir' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name);
  });
}

interface UnzipPageProps {
  initialTreeData: TreeNode | null;
  error: string | null;
}

export default function UnzipPage({ initialTreeData, error: initialError }: UnzipPageProps) {
  const [treeData] = useState<TreeNode | null>(initialTreeData);
  const [error] = useState<string | null>(initialError);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Effect: Track current path (for navigation highlighting)
  useEffect(() => {
    const getCurrentPath = () => {
      if (typeof window === 'undefined') return '';
      try {
        if (window.self !== window.top && window.parent) {
          return window.parent.location.pathname;
        }
        return window.location.pathname;
      } catch (e) {
        return window.location.pathname;
      }
    };

    setCurrentPath(getCurrentPath());

    const handleLocationChange = () => {
      setCurrentPath(getCurrentPath());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Memoized tree structure generation - only regenerates when tree data or current path changes
  const treeStructure = useMemo(() => {
    if (!treeData || !treeData.children) return 'Loading...';

    function generateAsciiTree(node: TreeNode, prefix = ''): string {
      if (!node.children || node.children.length === 0) return '';

      let result = '';
      const sortedChildren = sortTreeNodes(node.children);

      sortedChildren.forEach((child, index) => {
        const isLastChild = index === sortedChildren.length - 1;
        const connector = isLastChild ? '└──' : '├──';
        const childPrefix = isLastChild ? '    ' : '│   ';

        const localUrl = child.path ? generateLocalUrl(child.path) : '';
        const displayName = child.type === 'dir' ? `${child.name}/` : child.name;

        result += `${prefix}${connector}<a href="${localUrl}" class="tree-link" target="_top">${displayName}</a>\n`;

        const isGardenSubfolder = child.path.startsWith('public/garden/') &&
                                  child.path.split('/').length === 3 &&
                                  child.type === 'dir';

        if (child.children && child.children.length > 0 && !isGardenSubfolder) {
          result += generateAsciiTree(child, prefix + childPrefix);
        }
      });

      return result;
    }

    let ascii = '';
    const pagesNode = treeData.children.find((child) => child.name === 'pages');
    const publicNode = treeData.children.find((child) => child.name === 'public');

    // Add pages section
    if (pagesNode && pagesNode.children) {
      ascii += 'pages/\n';
      const sortedPages = sortTreeNodes(pagesNode.children);

      sortedPages.forEach((child, index) => {
        const isLast = index === sortedPages.length - 1;
        const connector = isLast ? '└──' : '├──';
        const childPrefix = isLast ? '    ' : '│   ';

        const localUrl = child.path ? generateLocalUrl(child.path) : '';
        const displayName = child.type === 'dir' ? `${child.name}/` : child.name;

        const isMatch = (localUrl === currentPath) || (localUrl === '/' && currentPath === '');
        const currentIndicator = isMatch ? ' <span class="arrow">←</span>' : '';
        ascii += `${connector}<a href="${localUrl}" class="tree-link" target="_top">${displayName}</a>${currentIndicator}\n`;

        if (child.children && child.children.length > 0) {
          ascii += generateAsciiTree(child, childPrefix);
        }
      });
    }

    // Add public section
    if (publicNode) {
      ascii += 'public/\n';
      const gardenNode = publicNode.children?.find((child) => child.name === 'garden');

      if (gardenNode && gardenNode.children) {
        const isGardenCurrent = currentPath === '/garden';
        const gardenIndicator = isGardenCurrent ? ' <span class="arrow">←</span>' : '';
        ascii += `└──<a href="/garden" class="tree-link" target="_top">garden/</a>${gardenIndicator}\n`;

        const sortedGarden = sortTreeNodes(gardenNode.children, false);

        sortedGarden.forEach((child, index) => {
          const isLast = index === sortedGarden.length - 1;
          const connector = isLast ? '    └──' : '    ├──';

          const localUrl = child.path ? generateLocalUrl(child.path) : '';
          const displayName = child.type === 'dir' ? `${child.name}/` : child.name;
          const isCurrentPage = currentPath.startsWith(localUrl) && localUrl !== '/garden';
          const currentIndicator = isCurrentPage ? ' <span class="arrow">←</span>' : '';
          ascii += `${connector}<a href="${localUrl}" class="tree-link" target="_top">${displayName}</a>${currentIndicator}\n`;
        });
      }
    }

    return ascii;
  }, [treeData, currentPath]); // Memoized - only recalculates when dependencies change

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx>{`
        .content-container, .header, .tree, .small, .sublink_small, .sublink_small:visited {
          margin: 0;
          padding: 0;
          font-size: 9pt;
          line-height: 12pt;
        }
        .header, .tree {
          font-family: monospace;
        }
        .content-container {
          max-width: 800px;
          margin-left: 1%;
          padding: 20px;
          word-wrap: break-word;
        }
        .header, .tree {
          white-space: pre;
          margin-top: 10px;
          margin-left: 1%;
        }
        .tree {
          line-height: 1.4;
        }
        :global(.tree-link),
        :global(.tree-link:link),
        :global(.tree-link:visited),
        :global(.tree-link:active) {
          color: #0000FF !important;
          text-decoration: none !important;
        }
        :global(.tree-link:hover) {
          color: #0000FF !important;
          text-decoration: underline !important;
        }
        audio {
          display: block !important;
          margin: 2em 0;
          height: 2em;
        }
        span {
          opacity: 0.5;
        }
        span.arrow {
          opacity: 1 !important;
          color: blue !important;
        }
        .error {
          color: red;
        }
      `}</style>

      <div className="content-container">
        <div className="tree">
          {error && <span className="error">Error: {error}</span>}
          <div dangerouslySetInnerHTML={{ __html: treeStructure }} />
        </div>

        <audio controls>
          <source src="files/fakingit.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </>
  );
}

export async function getStaticProps() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/sandhals/brixtonzip/git/trees/main?recursive=1'
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const tree: GitHubTreeItem[] = data.tree;

    const excludeFromPages = ['api', '_document', 'unzip', 'sitemap', '_app', 'garden'];

    const filteredTree = tree.filter((item) => {
      if (item.path.startsWith('public/garden/')) return true;
      if (item.path.startsWith('pages/')) {
        const pathAfterPages = item.path.substring(6);
        const firstPart = pathAfterPages.split('/')[0].replace(/\.(tsx?|jsx?)$/, '');
        return !excludeFromPages.includes(firstPart);
      }
      return false;
    });

    // Build tree structure
    const root: TreeNode = { name: 'brixtonzip', type: 'dir', path: '', children: [] };

    filteredTree.forEach((item) => {
      const parts = item.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        if (!current.children) current.children = [];

        const isLast = index === parts.length - 1;
        const existing = current.children.find((child) => child.name === part);

        if (existing) {
          current = existing;
        } else {
          const newNode: TreeNode = {
            name: part,
            type: isLast ? (item.type === 'tree' ? 'dir' : 'file') : 'dir',
            path: item.path,
            ...(!(isLast && item.type === 'blob') && { children: [] }),
          };
          current.children.push(newNode);
          current = newNode;
        }
      });
    });

    return {
      props: {
        initialTreeData: root,
        error: null,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (err) {
    console.error('Error fetching repo structure:', err);
    return {
      props: {
        initialTreeData: null,
        error: err instanceof Error ? err.message : 'Failed to load repository structure',
      },
      revalidate: 60,
    };
  }
}
