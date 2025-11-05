import React from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

interface SitemapTreeProps {
  structure: FileNode[];
}

const SitemapTree: React.FC<SitemapTreeProps> = ({ structure }) => {
  const renderTree = (
    nodes: FileNode[],
    prefix: string = '',
    isLast: boolean = true,
    isRoot: boolean = true
  ): React.ReactElement[] => {
    return nodes.flatMap((node, index) => {
      const isLastNode = index === nodes.length - 1;
      const connector = isRoot ? '' : isLastNode ? '└── ' : '├── ';
      const childPrefix = isRoot ? '' : prefix + (isLastNode ? '    ' : '│   ');
      
      const icon = node.type === 'folder' ? '📁 ' : '📄 ';
      const displayName = node.name;

      const elements: React.ReactElement[] = [
        <div key={node.path} className="sitemap-line">
          <span className="prefix">{prefix}</span>
          <span className="connector">{connector}</span>
          <span className="icon">{icon}</span>
          <a href={node.path} className="node-name">
            {displayName}
          </a>
        </div>
      ];

      if (node.children && node.children.length > 0) {
        elements.push(...renderTree(node.children, childPrefix, isLastNode, false));
      }

      return elements;
    });
  };

  return (
    <div className="sitemap-tree">
      <style jsx>{`
        .sitemap-tree {
          font-family: 'Courier New', Consolas, Monaco, monospace;
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 2rem;
          border-radius: 8px;
          overflow-x: auto;
          line-height: 1.6;
          font-size: 14px;
        }

        .sitemap-line {
          white-space: pre;
          transition: background 0.2s ease;
        }

        .sitemap-line:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .prefix,
        .connector {
          color: #858585;
        }

        .icon {
          margin-right: 4px;
        }

        .node-name {
          color: #4ec9b0;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .node-name:hover {
          color: #6dd9bf;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .sitemap-tree {
            font-size: 12px;
            padding: 1rem;
          }
        }
      `}</style>
      
      <div className="tree-header">
        <h2 style={{ color: '#d4d4d4', marginBottom: '1.5rem', fontFamily: 'inherit' }}>
          📂 pages/
        </h2>
      </div>
      
      {renderTree(structure)}
    </div>
  );
};

export default SitemapTree;

// Example usage with your pages structure:
// Copy this structure and modify it to match your actual pages folder

export const exampleStructure: FileNode[] = [
  {
    name: 'index.tsx',
    type: 'file',
    path: '/',
  },
  {
    name: 'about.tsx',
    type: 'file',
    path: '/about',
  },
  {
    name: 'sitemap.tsx',
    type: 'file',
    path: '/sitemap',
  },
  {
    name: 'api',
    type: 'folder',
    path: '/api',
    children: [
      {
        name: 'hello.ts',
        type: 'file',
        path: '/api/hello',
      },
      {
        name: 'data.ts',
        type: 'file',
        path: '/api/data',
      },
    ],
  },
  {
    name: 'blog',
    type: 'folder',
    path: '/blog',
    children: [
      {
        name: 'index.tsx',
        type: 'file',
        path: '/blog',
      },
      {
        name: '[slug].tsx',
        type: 'file',
        path: '/blog/[slug]',
      },
    ],
  },
  {
    name: '_app.tsx',
    type: 'file',
    path: '/_app',
  },
  {
    name: '_document.tsx',
    type: 'file',
    path: '/_document',
  },
];
