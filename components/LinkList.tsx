// components/LinkList.tsx

import { useEffect, useState } from 'react';

export interface LinkData {
  title: string;
  link: string;
  createdDate: string;
}

interface LinkListProps {
  limit?: number;
  showHeader?: boolean;
}

function renderDate(createdDate: string): string {
  const date = new Date(createdDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks >= 3) {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return `on ${date.toLocaleDateString('en-US', options)}${now.getFullYear() !== date.getFullYear() ? ` ${date.getFullYear()}` : ''}`;
  } else if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  else if (hours >= 1) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  else if (minutes >= 1) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  else return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
}

export default function LinkList({ limit, showHeader = false }: LinkListProps) {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch('/api/curius');
        const data = await res.json();
        if (Array.isArray(data.links)) {
          setLinks(limit ? data.links.slice(0, limit) : data.links);
        } else {
          console.error('Unexpected API response', data);
        }
      } catch (err) {
        console.error('Failed to fetch links', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLinks();
  }, [limit]);

  return (
    <div className="recentcurius" id="links-container">
      {loading ? (
        <p>Loading...</p>
      ) : links.length === 0 ? (
        <p>No links found</p>
      ) : (
        links.map((link, i) => (
          <div className="curiusitem" key={i}>
            <p>
              <a className="curiuslink" href={link.link} target="_blank" rel="noopener noreferrer">
                {link.title}
              </a>{' '}
              <span className="curiusdate">{renderDate(link.createdDate)}</span>
            </p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}
