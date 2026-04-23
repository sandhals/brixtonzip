# Colophon Suggestions

---

## 1. Suggested Additions

### Hosting & Deployment
The colophon doesn't mention where the site is hosted. You're using Vercel (evidenced by `@vercel/analytics`), and that's a meaningful part of how the site gets to people. A sentence or two about Vercel, your deployment workflow, or even just how the site gets from your laptop to the internet could be a nice addition.

### Typography
You're clearly intentional about your font choices — Apple Garamond for body text, Roboto for UI/headings, OCR-A for the receipt motif, and a monospace font for the source code bleed. That's a considered typographic palette worth documenting. The receipt font on the friends page, the serif body text, the intentional use of "internet blue" — these are all design decisions someone reading a colophon would appreciate knowing about.

### The Source Code Bleed
You describe the "receipt camera" aesthetic and the dithering, but don't explain the source code bleeding through the background — which is one of the most distinctive visual features of the site. The `SourceBleed` component fetches the actual page source and renders it behind the content. That's worth calling out.

### The Digital Garden
The garden is a significant part of the site — 13+ standalone projects, each built as self-contained HTML/CSS/JS apps. The colophon could acknowledge the garden as its own thing: what it is, how projects are structured (standalone apps in `/public/garden/`), and the philosophy behind it.

### Interactive Details / Easter Eggs
The site has hidden touches — the Norwegian easter egg on the homepage, the "hand-made with love" source code toggle, the receipt-styled friends page, the sketchbook viewer. A colophon is a natural place to nod at these without fully spoiling them.

### Analytics
You use Google Analytics (via gtag) and Vercel Analytics. If you have a stance on tracking/privacy, that could be worth mentioning — especially given the indie web ethos of the site.

### The "Zip Folder" Metaphor
The domain itself (brixton.zip) and the `UnzipBox` component suggest a deliberate metaphor — the site as an archive being unzipped. This concept isn't explained anywhere.

---

## 2. Suggested Edits

### "Originally, my whole site was written using just HTML and CSS, but eventually it became my experimentation ground for teaching myself TSX."
TSX isn't really a technology you "teach yourself" in isolation — it's JSX with TypeScript. You might say "Next.js" or "React with TypeScript" instead, since that's actually the stack. TSX is the file format, not the framework. Something like: *"...my experimentation ground for learning React and TypeScript through Next.js"* would be more precise without losing the casual tone.

### "...switching from static to dynamic allowed me to start using things like components"
This undersells it slightly. Components aren't a feature of "dynamic" sites per se — they're a feature of using a component framework (React). You could sharpen this: *"...switching to a component-based framework let me reuse layouts, pull in external APIs..."*

### "...like the Curius reading list I have displayed on my homepage (an idea I stole from Ben Neo)"
Is this still accurate? The homepage currently shows a `LinkList` component that appears to pull from Curius, but it's worth verifying this is still the data source. If it's changed, update the reference. Also, is the Ben Neo link still live/relevant?

### The Background section could use a light proofread
- "Through Are.na got exposed very early on" — missing "I" → "Through Are.na I got exposed..."
- "...reignited the same curiosity I had as a young child. " — trailing space before the closing tag

### The function name is `LanguagePage` but it exports the colophon
Line 4: `export default function LanguagePage()` — this is a copy-paste artifact. It should be `ColophonPage` for clarity (not user-facing, but good hygiene).

### The empty `<br />` at the end
There's a lone `<br />` before the closing `</div>` that doesn't seem intentional. Consider removing it.

---

## 3. Questions to Help Improve the Colophon

### Design
- What tool do you use to write/edit your code? You mention "a text editor" in the source code comment — is it VS Code? Something else? This is classic colophon material.
- Do you have any other visual references beyond the receipt photobooth? The monochrome palette, the dithered images, the tight column layout — do these come from anywhere specific?
- Why 500px max-width for the container? Was that a deliberate constraint (mimicking a receipt width, a phone screen, a book column)?

### Code
- Are there any libraries or tools you considered but decided against? Any "anti-stack" choices worth mentioning?
- Do you use any build/dev tools worth mentioning (e.g., Prettier is in your devDependencies)?
- How do you handle the garden projects being standalone HTML/CSS/JS while the rest of the site is Next.js? Is that tension deliberate?

### Background
- You mention teaching friends, family, and elementary students to code. Has that experience influenced how you build your own site? (e.g., keeping things readable, the source code bleed as a teaching tool)
- The "hand-made with love" toggle and the source code comment encouraging people to learn HTML — is that part of a deliberate philosophy you could articulate?
- Are.na clearly was a turning point. Is it still a regular part of your creative process, or has your relationship with it changed?

### Philosophy
- Do you consider this an "indie web" site? A "personal site"? A "digital garden"? How do you think about what it is?
- Is there anything you deliberately avoid on the site (e.g., no JavaScript frameworks for garden projects, no dark mode, no cookie banners)?
- The site has a strong "handmade" quality. Is that a principle or just how things ended up?
