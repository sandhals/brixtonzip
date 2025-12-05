import Head from 'next/head';
import { useEffect, useState } from 'react';

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

export default function UnzipPage() {
  const [treeStructure, setTreeStructure] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    // Get current path from parent window or current window
    if (typeof window !== 'undefined') {
      try {
        // Check if we're in an iframe
        if (window.self !== window.top && window.parent) {
          const parentPath = window.parent.location.pathname;
          console.log('[UNZIP] In iframe, parent path:', parentPath);
          setCurrentPath(parentPath);
        } else {
          // Not in iframe, use current path
          console.log('[UNZIP] Not in iframe, current path:', window.location.pathname);
          setCurrentPath(window.location.pathname);
        }
      } catch (e) {
        // Cross-origin access might be blocked, use current path
        console.log('[UNZIP] Error accessing parent, using current path:', window.location.pathname);
        setCurrentPath(window.location.pathname);
      }
    }

    // Update on navigation
    const handleLocationChange = () => {
      try {
        if (window.self !== window.top && window.parent) {
          const newPath = window.parent.location.pathname;
          console.log('[UNZIP] Navigation detected, new parent path:', newPath);
          setCurrentPath(newPath);
        } else {
          const newPath = window.location.pathname;
          console.log('[UNZIP] Navigation detected, new path:', newPath);
          setCurrentPath(newPath);
        }
      } catch (e) {
        setCurrentPath(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    async function fetchRepoStructure() {
      console.log('[UNZIP] Building tree with currentPath:', currentPath);
      try {
        const response = await fetch(
          'https://api.github.com/repos/sandhals/brixtonzip/git/trees/main?recursive=1'
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const tree: GitHubTreeItem[] = data.tree;

        // Filter to only include items from 'pages' and 'public/garden'
        // Exclude specific files/folders from pages
        const excludeFromPages = ['api', '_document', 'unzip', 'sitemap', '_app', 'garden'];

        const filteredTree = tree.filter((item) => {
          // Include all items from public/garden
          if (item.path.startsWith('public/garden/')) {
            return true;
          }

          // For pages directory, exclude specific items
          if (item.path.startsWith('pages/')) {
            const pathAfterPages = item.path.substring(6); // Remove 'pages/' prefix
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
                children: isLast && item.type === 'blob' ? undefined : [],
              };
              current.children.push(newNode);
              current = newNode;
            }
          });
        });

        // Generate ASCII tree with full hierarchy
        let ascii = '';
        if (root.children) {
          const pagesNode = root.children.find((child) => child.name === 'pages');
          const publicNode = root.children.find((child) => child.name === 'public');

          // Add pages section
          if (pagesNode && pagesNode.children) {
            ascii += 'pages/\n';
            const sortedPages = [...pagesNode.children].sort((a, b) => {
              const aIsIndex = a.name === 'index.tsx' || a.name === 'index.ts' || a.name === 'index.jsx' || a.name === 'index.js';
              const bIsIndex = b.name === 'index.tsx' || b.name === 'index.ts' || b.name === 'index.jsx' || b.name === 'index.js';
              if (aIsIndex && !bIsIndex) return -1;
              if (!aIsIndex && bIsIndex) return 1;
              if (a.type === 'dir' && b.type === 'file') return -1;
              if (a.type === 'file' && b.type === 'dir') return 1;
              return a.name.localeCompare(b.name);
            });

            sortedPages.forEach((child, index) => {
              const isLast = index === sortedPages.length - 1;
              const connector = isLast ? '├──' : '├──';
              const childPrefix = isLast ? '│   ' : '│   ';

              let localUrl = '';
              if (child.path.startsWith('pages/')) {
                const pagePath = child.path.substring(6).replace(/\.(tsx?|jsx?)$/, '');
                if (pagePath.endsWith('/index') || pagePath === 'index') {
                  localUrl = `/${pagePath.replace(/\/index$/, '') || ''}`;
                } else {
                  localUrl = `/${pagePath}`;
                }
              }

              const displayName = child.type === 'dir' ? `${child.name}/` : child.name;

              // Check if this page is current
              let isMatch = false;
              if (displayName === 'index.tsx') {
                // For index.tsx, match when at root path '/' or empty
                isMatch = (currentPath === '/' || currentPath === '');
                console.log('[UNZIP] INDEX CHECK:', {
                  displayName,
                  currentPath,
                  localUrl,
                  isMatch
                });
              } else {
                // For other pages, direct path match
                isMatch = (localUrl === currentPath);
              }

              const currentIndicator = isMatch ? ' <span class="arrow">←</span>' : '';
              ascii += `${connector}<a href="${localUrl || '/'}" class="tree-link" target="_top">${displayName}</a>${currentIndicator}\n`;

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
              const sortedGarden = [...gardenNode.children].sort((a, b) => {
                if (a.type === 'dir' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
              });

              sortedGarden.forEach((child, index) => {
                const isLast = index === sortedGarden.length - 1;
                const connector = isLast ? '    └──' : '    ├──';

                let localUrl = '';
                if (child.path.startsWith('public/garden/')) {
                  localUrl = `/${child.path.substring(7)}`;
                }

                const displayName = child.type === 'dir' ? `${child.name}/` : child.name;
                const isCurrentPage = currentPath.startsWith(localUrl) && localUrl !== '/garden';
                const currentIndicator = isCurrentPage ? ' <span class="arrow">←</span>' : '';
                ascii += `${connector}<a href="${localUrl}" class="tree-link" target="_top">${displayName}</a>${currentIndicator}\n`;

                // Don't show children of garden subfolders
              });
            }
          }
        }
        setTreeStructure(ascii);
      } catch (err) {
        console.error('Error fetching repo structure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repository structure');
        setTreeStructure('Failed to load repository structure');
      }
    }

    fetchRepoStructure();
  }, [currentPath]);

  function generateAsciiTree(node: TreeNode, prefix = '', skipChildren = false): string {
    if (!node.children || node.children.length === 0) return '';

    let result = '';
    const sortedChildren = [...node.children].sort((a, b) => {
      // Index files always first
      const aIsIndex = a.name === 'index.tsx' || a.name === 'index.ts' || a.name === 'index.jsx' || a.name === 'index.js';
      const bIsIndex = b.name === 'index.tsx' || b.name === 'index.ts' || b.name === 'index.jsx' || b.name === 'index.js';

      if (aIsIndex && !bIsIndex) return -1;
      if (!aIsIndex && bIsIndex) return 1;

      // Then directories first, then files
      if (a.type === 'dir' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    sortedChildren.forEach((child, index) => {
      const isLastChild = index === sortedChildren.length - 1;
      const connector = isLastChild ? '└──' : '├──';
      const childPrefix = isLastChild ? '    ' : '│   ';

      // Generate local page URL based on path
      let localUrl = '';
      if (child.path.startsWith('pages/')) {
        // Remove 'pages/' prefix and file extension
        const pagePath = child.path.substring(6).replace(/\.(tsx?|jsx?)$/, '');
        // Handle index files
        if (pagePath.endsWith('/index') || pagePath === 'index') {
          localUrl = `/${pagePath.replace(/\/index$/, '') || ''}`;
        } else {
          localUrl = `/${pagePath}`;
        }
      } else if (child.path.startsWith('public/garden/')) {
        // Remove 'public/' prefix for garden items
        localUrl = `/${child.path.substring(7)}`;
      }

      const displayName = child.type === 'dir' ? `${child.name}/` : child.name;

      result += `${prefix}${connector}<a href="${localUrl}" class="tree-link" target="_top">${displayName}</a>\n`;

      // Check if this is a garden subfolder (direct child of public/garden/)
      const isGardenSubfolder = child.path.startsWith('public/garden/') &&
                                child.path.split('/').length === 3 &&
                                child.type === 'dir';

      // Only recurse if we have children and we're not skipping children (for garden subfolders)
      if (child.children && child.children.length > 0 && !skipChildren && !isGardenSubfolder) {
        result += generateAsciiTree(child, prefix + childPrefix, false);
      }
    });

    return result;
  }

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