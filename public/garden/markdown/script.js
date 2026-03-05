// ==============================
// CONFIGURATION
// ==============================

marked.setOptions({
  breaks: true,
  gfm: true,
});

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// ==============================
// STATE
// ==============================

let activePanel = 'markdown';
let syncSource = null;
let savedSelection = null;
let saveTimeout = null;
let editorMode = 'raw'; // 'raw' or 'styled'
let styledRenderTimer = null;
const STORAGE_KEY = 'md-editor-content';
const MODE_KEY = 'md-editor-mode';

// ==============================
// DOM REFERENCES
// ==============================

const markdownInput = document.getElementById('markdown-input');
const markdownOverlay = document.getElementById('markdown-overlay');
const richtext = document.getElementById('richtext');
const markdownPanel = document.getElementById('markdown-panel');
const richtextPanel = document.getElementById('richtext-panel');
const rawEditor = document.getElementById('raw-editor');
const styledEditor = document.getElementById('styled-editor');
const modeRawBtn = document.getElementById('mode-raw');
const modeStyledBtn = document.getElementById('mode-styled');
const wordCountEl = document.getElementById('word-count');
const exportBtn = document.getElementById('export-btn');
const linkTooltip = document.getElementById('link-tooltip');
const linkUrlInput = document.getElementById('link-url-input');
const linkApplyBtn = document.getElementById('link-apply');
const linkCancelBtn = document.getElementById('link-cancel');

// ==============================
// SYNTAX HIGHLIGHTING (raw mode)
// ==============================

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightMarkdown(text) {
  return text.split('\n').map(line => {
    let escaped = escapeHtml(line);

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      return '<span class="md-syntax md-hr">' + escaped + '</span>';
    }

    escaped = escaped.replace(
      /^(#{1,6}\s)/,
      '<span class="md-syntax">$1</span>'
    );

    escaped = escaped.replace(
      /(\*\*|__)(.+?)\1/g,
      '<span class="md-syntax">$1</span><span class="md-bold-text">$2</span><span class="md-syntax">$1</span>'
    );

    escaped = escaped.replace(
      /(?<!\*)(\*|_)(?!\*)(.+?)(?<!\*)\1(?!\*)/g,
      '<span class="md-syntax">$1</span><span class="md-em-text">$2</span><span class="md-syntax">$1</span>'
    );

    escaped = escaped.replace(
      /(~~)(.+?)\1/g,
      '<span class="md-syntax">$1</span><span class="md-strike-text">$2</span><span class="md-syntax">$1</span>'
    );

    escaped = escaped.replace(
      /(`)([^`]+)\1/g,
      '<span class="md-syntax">$1</span><span class="md-code-text">$2</span><span class="md-syntax">$1</span>'
    );

    escaped = escaped.replace(
      /(\[)([^\]]+)(\]\()([^)]+)(\))/g,
      '<span class="md-syntax">$1</span><span class="md-link-text">$2</span><span class="md-syntax">$3</span><span class="md-link-url">$4</span><span class="md-syntax">$5</span>'
    );

    escaped = escaped.replace(
      /^(<span class="md-syntax">#{1,6}\s<\/span>)?(&gt;\s)/,
      '$1<span class="md-syntax">$2</span>'
    );

    escaped = escaped.replace(
      /^(\s*)([-*]|\d+\.)\s/,
      '$1<span class="md-syntax">$2 </span>'
    );

    return escaped;
  }).join('\n');
}

function updateOverlay(text) {
  markdownOverlay.innerHTML = highlightMarkdown(text);
}

// ==============================
// STYLED MODE RENDERING
// ==============================

function generateStyledHtml(text) {
  return text.split('\n').map(line => {
    if (line.trim() === '') return '<div class="s-empty"><br></div>';

    let content = escapeHtml(line);

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      return '<div class="s-line-hr"><span class="md-syntax">' + content + '</span></div>';
    }

    // Headings
    let lineClass = '';
    content = content.replace(/^(#{1,6})\s/, (match, hashes) => {
      lineClass = ' s-line-h' + Math.min(hashes.length, 3);
      return '<span class="md-syntax">' + hashes + ' </span>';
    });

    // Bold
    content = content.replace(
      /(\*\*|__)(.+?)\1/g,
      '<span class="md-syntax">$1</span><span class="s-bold">$2</span><span class="md-syntax">$1</span>'
    );

    // Italic
    content = content.replace(
      /(?<!\*)(\*|_)(?!\*)(.+?)(?<!\*)\1(?!\*)/g,
      '<span class="md-syntax">$1</span><span class="s-em">$2</span><span class="md-syntax">$1</span>'
    );

    // Strikethrough
    content = content.replace(
      /(~~)(.+?)\1/g,
      '<span class="md-syntax">$1</span><span class="s-strike">$2</span><span class="md-syntax">$1</span>'
    );

    // Inline code
    content = content.replace(
      /(`)([^`]+)\1/g,
      '<span class="md-syntax">$1</span><span class="s-code">$2</span><span class="md-syntax">$1</span>'
    );

    // Links
    content = content.replace(
      /(\[)([^\]]+)(\]\()([^)]+)(\))/g,
      '<span class="md-syntax">$1</span><span class="s-link">$2</span><span class="md-syntax">$3</span><span class="s-url">$4</span><span class="md-syntax">$5</span>'
    );

    // Blockquote
    let isBq = false;
    content = content.replace(/^(&gt;\s)/, () => {
      isBq = true;
      return '<span class="md-syntax">&gt; </span>';
    });
    if (isBq) lineClass += ' s-line-bq';

    // List markers
    content = content.replace(
      /^(\s*)([-*]|\d+\.)\s/,
      '$1<span class="md-syntax">$2 </span>'
    );

    return '<div class="s-line' + lineClass + '">' + content + '</div>';
  }).join('');
}

// ==============================
// CURSOR HELPERS (styled mode)
// ==============================

function getCursorOffset(el) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function setCursorOffset(el, offset) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let node;
  while (node = walker.nextNode()) {
    if (pos + node.length >= offset) {
      const range = document.createRange();
      range.setStart(node, offset - pos);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    pos += node.length;
  }
  // Fallback: place cursor at end
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// ==============================
// TEXT EXTRACTION (styled editor)
// ==============================

function extractTextFromStyled() {
  // Walk child nodes (each line is a <div>), extract textContent per div
  const lines = [];
  const children = styledEditor.childNodes;
  if (children.length === 0) return '';

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.nodeType === Node.TEXT_NODE) {
      lines.push(node.textContent);
    } else if (node.nodeName === 'DIV') {
      // Empty div with just <br> = blank line
      if (node.innerHTML === '<br>' || node.textContent === '') {
        lines.push('');
      } else {
        lines.push(node.textContent);
      }
    } else if (node.nodeName === 'BR') {
      lines.push('');
    } else {
      lines.push(node.textContent);
    }
  }

  return lines.join('\n');
}

// ==============================
// MODE TOGGLE
// ==============================

const modeToggleContainer = document.getElementById('mode-toggle');
const modeUnderline = document.querySelector('.mode-underline');

function positionUnderline() {
  const activeBtn = editorMode === 'raw' ? modeRawBtn : modeStyledBtn;
  modeUnderline.style.left = activeBtn.offsetLeft + 'px';
  modeUnderline.style.width = activeBtn.offsetWidth + 'px';
}

function setMode(mode) {
  editorMode = mode;

  if (mode === 'styled') {
    const md = markdownInput.value;
    markdownPanel.classList.add('styled-mode');
    modeRawBtn.classList.remove('active');
    modeStyledBtn.classList.add('active');
    styledEditor.innerHTML = generateStyledHtml(md);
    styledEditor.focus();
  } else {
    const md = extractTextFromStyled();
    markdownInput.value = md;
    markdownPanel.classList.remove('styled-mode');
    modeRawBtn.classList.add('active');
    modeStyledBtn.classList.remove('active');
    updateOverlay(md);
    richtext.innerHTML = marked.parse(md);
    markdownInput.focus();
  }

  positionUnderline();
  try { localStorage.setItem(MODE_KEY, mode); } catch(e) {}
}

modeRawBtn.addEventListener('click', () => { setMode('raw'); });
modeStyledBtn.addEventListener('click', () => { setMode('styled'); });

// ==============================
// SYNC ENGINE
// ==============================

function onMarkdownInput() {
  if (syncSource === 'richtext') return;
  syncSource = 'markdown';

  const md = markdownInput.value;
  updateOverlay(md);
  richtext.innerHTML = marked.parse(md);

  syncSource = null;
  debounceSave(md);
  updateWordCount(md);
}

function onStyledEditorInput() {
  if (syncSource === 'richtext') return;
  syncSource = 'markdown';

  const md = extractTextFromStyled();

  // Sync to hidden textarea and rich text panel
  markdownInput.value = md;
  richtext.innerHTML = marked.parse(md);

  // Debounced re-render of styled view
  clearTimeout(styledRenderTimer);
  styledRenderTimer = setTimeout(() => {
    const offset = getCursorOffset(styledEditor);
    styledEditor.innerHTML = generateStyledHtml(md);
    setCursorOffset(styledEditor, offset);
  }, 500);

  syncSource = null;
  debounceSave(md);
  updateWordCount(md);
}

let richSyncTimer = null;
function onRichTextInput() {
  if (syncSource === 'markdown') return;

  clearTimeout(richSyncTimer);
  richSyncTimer = setTimeout(() => {
    syncSource = 'richtext';

    const html = richtext.innerHTML;
    const md = turndownService.turndown(html);
    markdownInput.value = md;

    if (editorMode === 'raw') {
      updateOverlay(md);
    } else {
      styledEditor.innerHTML = generateStyledHtml(md);
    }

    syncSource = null;
    debounceSave(md);
    updateWordCount(md);
  }, 50);
}

// ==============================
// SCROLL SYNC
// ==============================

let scrollSyncSource = null;

function syncScrollPct(source, target) {
  if (scrollSyncSource === target) return;
  scrollSyncSource = source;
  const maxS = source.scrollHeight - source.clientHeight;
  const pct = maxS > 0 ? source.scrollTop / maxS : 0;
  const maxT = target.scrollHeight - target.clientHeight;
  target.scrollTop = pct * maxT;
  requestAnimationFrame(() => { scrollSyncSource = null; });
}

// Textarea → overlay + richtext
markdownInput.addEventListener('scroll', () => {
  markdownOverlay.scrollTop = markdownInput.scrollTop;
  markdownOverlay.scrollLeft = markdownInput.scrollLeft;
  syncScrollPct(markdownInput, richtext);
});

// Styled editor → richtext
styledEditor.addEventListener('scroll', () => {
  syncScrollPct(styledEditor, richtext);
});

// Richtext → markdown panel
richtext.addEventListener('scroll', () => {
  if (editorMode === 'raw') {
    syncScrollPct(richtext, markdownInput);
  } else {
    syncScrollPct(richtext, styledEditor);
  }
});

// ==============================
// PANEL FOCUS TRACKING
// ==============================

markdownInput.addEventListener('focus', () => {
  activePanel = 'markdown';
  markdownPanel.classList.add('active');
  richtextPanel.classList.remove('active');
});

styledEditor.addEventListener('focus', () => {
  activePanel = 'markdown';
  markdownPanel.classList.add('active');
  richtextPanel.classList.remove('active');
});

richtext.addEventListener('focus', () => {
  activePanel = 'richtext';
  richtextPanel.classList.add('active');
  markdownPanel.classList.remove('active');
});

// ==============================
// TOOLBAR ACTIONS
// ==============================

function applyFormat(action) {
  if (activePanel === 'markdown') {
    if (editorMode === 'styled') {
      applyStyledFormat(action);
    } else {
      applyMarkdownFormat(action);
    }
  } else {
    applyRichTextFormat(action);
  }
}

function getLineStart(text, pos) {
  return text.lastIndexOf('\n', pos - 1) + 1;
}

function applyMarkdownFormat(action) {
  const ta = markdownInput;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selected = text.substring(start, end);
  let replacement;

  if (action === 'link') {
    showLinkTooltip();
    return;
  }

  switch (action) {
    case 'bold':
      replacement = '**' + (selected || 'bold text') + '**';
      break;
    case 'italic':
      replacement = '*' + (selected || 'italic text') + '*';
      break;
    case 'strikethrough':
      replacement = '~~' + (selected || 'text') + '~~';
      break;
    case 'code':
      replacement = '`' + (selected || 'code') + '`';
      break;
    case 'h1': case 'h2': case 'h3': {
      const level = parseInt(action[1]);
      const prefix = '#'.repeat(level) + ' ';
      const lineStart = getLineStart(text, start);
      const lineEnd = text.indexOf('\n', end);
      const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
      const stripped = line.replace(/^#{1,6}\s*/, '');
      const newLine = prefix + stripped;
      ta.setRangeText(newLine, lineStart, lineEnd === -1 ? text.length : lineEnd, 'end');
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      return;
    }
    case 'blockquote': {
      const lineStart = getLineStart(text, start);
      ta.setRangeText('> ', lineStart, lineStart, 'end');
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      return;
    }
    case 'ol': {
      const lineStart = getLineStart(text, start);
      ta.setRangeText('1. ', lineStart, lineStart, 'end');
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      return;
    }
    case 'ul': {
      const lineStart = getLineStart(text, start);
      ta.setRangeText('- ', lineStart, lineStart, 'end');
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      return;
    }
    case 'hr':
      replacement = '\n---\n';
      break;
    default:
      return;
  }

  ta.setRangeText(replacement, start, end, 'end');
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

function applyStyledFormat(action) {
  if (action === 'link') {
    showLinkTooltip();
    return;
  }

  // Get current text + cursor position from styled editor
  const md = extractTextFromStyled();
  const offset = getCursorOffset(styledEditor);

  // Convert to textarea, apply format there, then sync back
  markdownInput.value = md;
  markdownInput.selectionStart = offset;
  markdownInput.selectionEnd = offset;

  // Find if there's a selection in styled editor
  const sel = window.getSelection();
  if (sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(styledEditor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const selStart = preRange.toString().length;
    const selEnd = selStart + sel.toString().length;
    markdownInput.selectionStart = selStart;
    markdownInput.selectionEnd = selEnd;
  }

  applyMarkdownFormat(action);

  // Sync back to styled editor
  const newMd = markdownInput.value;
  styledEditor.innerHTML = generateStyledHtml(newMd);
  richtext.innerHTML = marked.parse(newMd);

  // Try to restore cursor near the right position
  setCursorOffset(styledEditor, markdownInput.selectionEnd);
  styledEditor.focus();

  debounceSave(newMd);
  updateWordCount(newMd);
}

function applyRichTextFormat(action) {
  richtext.focus();

  if (action === 'link') {
    showLinkTooltip();
    return;
  }

  switch (action) {
    case 'bold':
      document.execCommand('bold');
      break;
    case 'italic':
      document.execCommand('italic');
      break;
    case 'strikethrough':
      document.execCommand('strikeThrough');
      break;
    case 'code': {
      const sel = window.getSelection();
      if (sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const code = document.createElement('code');
        code.textContent = range.toString();
        range.deleteContents();
        range.insertNode(code);
        sel.collapseToEnd();
      }
      break;
    }
    case 'h1':
      document.execCommand('formatBlock', false, 'h1');
      break;
    case 'h2':
      document.execCommand('formatBlock', false, 'h2');
      break;
    case 'h3':
      document.execCommand('formatBlock', false, 'h3');
      break;
    case 'blockquote':
      document.execCommand('formatBlock', false, 'blockquote');
      break;
    case 'ol':
      document.execCommand('insertOrderedList');
      break;
    case 'ul':
      document.execCommand('insertUnorderedList');
      break;
    case 'hr':
      document.execCommand('insertHorizontalRule');
      break;
  }

  richtext.dispatchEvent(new Event('input'));
}

// Toolbar button click delegation
document.getElementById('toolbar-actions').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  applyFormat(btn.dataset.action);
});

// ==============================
// LINK TOOLTIP
// ==============================

function getTextareaCursorRect(textarea) {
  const mirror = document.createElement('div');
  const computed = getComputedStyle(textarea);

  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
    'letterSpacing', 'wordSpacing', 'textIndent', 'whiteSpace',
    'wordWrap', 'padding', 'border', 'boxSizing', 'tabSize'
  ];
  props.forEach(p => mirror.style[p] = computed[p]);

  mirror.style.position = 'absolute';
  mirror.style.top = '-9999px';
  mirror.style.left = '-9999px';
  mirror.style.width = computed.width;
  mirror.style.overflow = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  const textBefore = textarea.value.substring(0, textarea.selectionEnd);
  mirror.textContent = textBefore;

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);

  const taRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  const rect = {
    left: taRect.left + (markerRect.left - mirror.getBoundingClientRect().left) - textarea.scrollLeft,
    top: taRect.top + (markerRect.top - mirror.getBoundingClientRect().top) - textarea.scrollTop,
    bottom: taRect.top + (markerRect.bottom - mirror.getBoundingClientRect().top) - textarea.scrollTop,
  };

  document.body.removeChild(mirror);
  return rect;
}

function showLinkTooltip() {
  if (activePanel === 'markdown' && editorMode === 'styled') {
    // Styled mode: use selection rect from contenteditable
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const preRange = sel.getRangeAt(0).cloneRange();
      preRange.selectNodeContents(styledEditor);
      preRange.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
      const selStart = preRange.toString().length;
      const selEnd = selStart + sel.toString().length;
      savedSelection = {
        panel: 'styled',
        start: selStart,
        end: selEnd,
        range: sel.getRangeAt(0).cloneRange(),
      };
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      linkTooltip.style.left = Math.max(8, rect.left) + 'px';
      linkTooltip.style.top = (rect.bottom + 6) + 'px';
    } else {
      savedSelection = { panel: 'styled', start: 0, end: 0, range: null };
    }
  } else if (activePanel === 'markdown') {
    savedSelection = {
      panel: 'markdown',
      start: markdownInput.selectionStart,
      end: markdownInput.selectionEnd,
    };
    const rect = getTextareaCursorRect(markdownInput);
    linkTooltip.style.left = Math.max(8, rect.left) + 'px';
    linkTooltip.style.top = (rect.bottom + 6) + 'px';
  } else {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedSelection = {
        panel: 'richtext',
        range: sel.getRangeAt(0).cloneRange(),
      };
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      linkTooltip.style.left = Math.max(8, rect.left) + 'px';
      linkTooltip.style.top = (rect.bottom + 6) + 'px';
    } else {
      savedSelection = { panel: 'richtext', range: null };
      linkTooltip.style.left = '50%';
      linkTooltip.style.top = '50%';
    }
  }

  linkUrlInput.value = '';
  linkTooltip.classList.add('visible');
  linkUrlInput.focus();
}

function hideLinkTooltip() {
  linkTooltip.classList.remove('visible');
  savedSelection = null;
}

function applyLink() {
  const url = linkUrlInput.value.trim();
  if (!url || !savedSelection) {
    hideLinkTooltip();
    return;
  }

  if (savedSelection.panel === 'styled') {
    // Apply link via textarea approach, then re-render styled
    const md = extractTextFromStyled();
    markdownInput.value = md;
    const s = savedSelection.start;
    const e = savedSelection.end;
    const selected = md.substring(s, e) || 'link text';
    const replacement = '[' + selected + '](' + url + ')';
    markdownInput.setRangeText(replacement, s, e, 'end');
    const newMd = markdownInput.value;
    styledEditor.innerHTML = generateStyledHtml(newMd);
    richtext.innerHTML = marked.parse(newMd);
    setCursorOffset(styledEditor, s + replacement.length);
    styledEditor.focus();
    debounceSave(newMd);
    updateWordCount(newMd);
  } else if (savedSelection.panel === 'markdown') {
    const ta = markdownInput;
    const s = savedSelection.start;
    const e = savedSelection.end;
    const selected = ta.value.substring(s, e) || 'link text';
    const replacement = '[' + selected + '](' + url + ')';
    ta.setRangeText(replacement, s, e, 'end');
    ta.dispatchEvent(new Event('input'));
    ta.focus();
  } else {
    if (savedSelection.range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection.range);
    }
    document.execCommand('createLink', false, url);
    richtext.dispatchEvent(new Event('input'));
    richtext.focus();
  }

  hideLinkTooltip();
}

linkApplyBtn.addEventListener('click', applyLink);
linkCancelBtn.addEventListener('click', hideLinkTooltip);

linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyLink();
  } else if (e.key === 'Escape') {
    hideLinkTooltip();
  }
});

// Close tooltip on outside click
document.addEventListener('mousedown', (e) => {
  if (linkTooltip.classList.contains('visible') && !linkTooltip.contains(e.target)) {
    hideLinkTooltip();
  }
});

// ==============================
// HOTKEYS
// ==============================

document.addEventListener('keydown', (e) => {
  if (linkTooltip.classList.contains('visible') && linkTooltip.contains(e.target)) {
    return;
  }

  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.shiftKey) {
    switch (e.key) {
      case '!': case '1':
        e.preventDefault();
        applyFormat('h1');
        return;
      case '@': case '2':
        e.preventDefault();
        applyFormat('h2');
        return;
      case '#': case '3':
        e.preventDefault();
        applyFormat('h3');
        return;
      case 'S': case 's':
        e.preventDefault();
        applyFormat('strikethrough');
        return;
      case '>': case '.':
        e.preventDefault();
        applyFormat('blockquote');
        return;
      case '&': case '7':
        e.preventDefault();
        applyFormat('ol');
        return;
      case '*': case '8':
        e.preventDefault();
        applyFormat('ul');
        return;
    }
  }

  if (ctrl && !e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        applyFormat('bold');
        return;
      case 'i':
        e.preventDefault();
        applyFormat('italic');
        return;
      case 'k':
        e.preventDefault();
        applyFormat('link');
        return;
      case 'e':
        e.preventDefault();
        applyFormat('code');
        return;
      case 's':
        e.preventDefault();
        exportMarkdown();
        return;
    }
  }
});

// ==============================
// PASTE HANDLING
// ==============================

markdownInput.addEventListener('paste', (e) => {
  const html = e.clipboardData.getData('text/html');
  if (html) {
    e.preventDefault();
    const md = turndownService.turndown(html);
    const ta = markdownInput;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.setRangeText(md, start, end, 'end');
    ta.dispatchEvent(new Event('input'));
  }
});

styledEditor.addEventListener('paste', (e) => {
  e.preventDefault();
  const html = e.clipboardData.getData('text/html');
  const text = e.clipboardData.getData('text/plain');

  // Always insert as plain text (or convert HTML to markdown first)
  let toInsert = text;
  if (html) {
    toInsert = turndownService.turndown(html);
  }
  document.execCommand('insertText', false, toInsert);

  // The input event will handle syncing
});

// Styled editor copies as plain text
styledEditor.addEventListener('copy', (e) => {
  const sel = window.getSelection();
  e.clipboardData.setData('text/plain', sel.toString());
  e.preventDefault();
});

styledEditor.addEventListener('cut', (e) => {
  const sel = window.getSelection();
  e.clipboardData.setData('text/plain', sel.toString());
  e.preventDefault();
  document.execCommand('delete');
});

richtext.addEventListener('paste', (e) => {
  e.preventDefault();
  const html = e.clipboardData.getData('text/html');
  const text = e.clipboardData.getData('text/plain');

  if (html) {
    const md = turndownService.turndown(html);
    const cleanHtml = marked.parse(md);
    document.execCommand('insertHTML', false, cleanHtml);
  } else if (text) {
    document.execCommand('insertText', false, text);
  }

  richtext.dispatchEvent(new Event('input'));
});

// ==============================
// PERSISTENCE
// ==============================

function debounceSave(md) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, md);
    } catch (e) {}
  }, 500);
}

function loadFromLocalStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

function exportMarkdown() {
  const md = markdownInput.value;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.md';
  a.click();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener('click', exportMarkdown);

// ==============================
// WORD / CHAR COUNT
// ==============================

function updateWordCount(text) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  wordCountEl.textContent = words + ' word' + (words !== 1 ? 's' : '') + ', ' + chars + ' char' + (chars !== 1 ? 's' : '');
}

// ==============================
// INITIALIZATION
// ==============================

function init() {
  markdownInput.addEventListener('input', onMarkdownInput);
  styledEditor.addEventListener('input', onStyledEditorInput);
  richtext.addEventListener('input', onRichTextInput);

  // Load saved content
  const saved = loadFromLocalStorage();
  if (saved) {
    markdownInput.value = saved;
    updateOverlay(saved);
    richtext.innerHTML = marked.parse(saved);
    updateWordCount(saved);
  }

  // Restore saved mode preference
  const savedMode = (() => {
    try { return localStorage.getItem(MODE_KEY); } catch(e) { return null; }
  })();

  if (savedMode === 'styled') {
    setMode('styled');
  } else {
    positionUnderline();
    markdownInput.focus();
  }
}

init();
