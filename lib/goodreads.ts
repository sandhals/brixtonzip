// Goodreads retired public shelf RSS feeds (late Oct 2026), so read the
// "Currently Reading" box from the public profile page instead.
const PROFILE_URL = 'https://www.goodreads.com/user/show/6432075-brixton';

export interface Book { title: string; author: string; }

const decode = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .trim();

export async function fetchCurrentlyReading(): Promise<Book[]> {
  const res = await fetch(PROFILE_URL);
  if (!res.ok) throw new Error(`Goodreads profile returned ${res.status}`);
  const html = await res.text();

  const start = html.indexOf('id="currentlyReadingReviews"');
  if (start === -1) return [];
  const end = html.indexOf('bigBox"', start);
  const section = html.slice(start, end === -1 ? undefined : end);

  return section.split('class="Updates').slice(1).map(block => {
    const rawTitle = block.match(/class="bookTitle"[^>]*>([^<]*)</)?.[1];
    const author = block.match(/class="authorName"[^>]*>([^<]*)</)?.[1];
    const title = rawTitle ? decode(rawTitle).replace(/\s*:.*$/, '') : null;
    return title ? { title, author: author ? decode(author) : '' } : null;
  }).filter((b): b is Book => b !== null);
}
