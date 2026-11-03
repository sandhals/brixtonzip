// External links in .hometext get a ↗ arrow via ::after (styles/globals.css).
// When punctuation sits right after the link, "link↗," reads worse than
// "link,↗" -- but CSS can't reach the text after an element, so this lifts
// that punctuation into a span beside the link and the arrow moves onto it.
const EXTERNAL = [
  '.hometext > a[href^="http"]:not([href*="brixton.zip"])',
  '.hometext > a[href^="//"]:not([href*="brixton.zip"])',
].join(', ');

const PUNCTUATION = /^[.,;:"]+/;

export function tuckPunctuation(root: ParentNode = document) {
  root.querySelectorAll<HTMLAnchorElement>(EXTERNAL).forEach(a => {
    if (a.classList.contains('has-trailing-punct')) return;
    const next = a.nextSibling;
    if (!next || next.nodeType !== Node.TEXT_NODE) return;
    const match = next.textContent?.match(PUNCTUATION);
    if (!match) return;

    next.textContent = next.textContent!.slice(match[0].length);
    const span = document.createElement('span');
    span.className = 'ext-punct';
    span.textContent = match[0];
    a.after(span);
    a.classList.add('has-trailing-punct');
  });
}
