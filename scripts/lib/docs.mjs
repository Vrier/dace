// docs.mjs — renders the Markdown documentation in docs-src/ to HTML.
//
// Each document yields a standalone page (site/docs/<name>.html, the target of the
// deep links in src/glossary.js, src/levin_classes.js and src/ahg.js) and/or a body
// fragment (site/docs/<fragment>.html) that the Explorer loads into its side panel.
//
// Heading ids are slugs of the heading text: lower-cased, punctuation dropped,
// runs of spaces/hyphens collapsed to one hyphen ("1.1 Comprehend Verbs" →
// "11-comprehend-verbs"). This reproduces every anchor of the original handoff
// pages, and `npm test` checks that every deep link still resolves — so renaming a
// heading that something links to fails the build check rather than the user.
import fs from 'node:fs';
import path from 'node:path';
import { Marked, Renderer } from 'marked';

export const DOCS = [
  { name: 'alternations', src: 'docs-src/alternations.md', page: 'docs/alternations.html', fragment: 'docs/alt-body.html',
    title: 'DACE — Complement-Embedding Alternations', accent: '#1f7a63', accentTint: 'rgba(31,122,99,.07)',
    description: 'The complement-type, matrix-structural and inferential alternations used to classify English clause-embedding predicates in DACE.' },
  { name: 'verb_classes', src: 'docs-src/verb_classes.md', page: 'docs/verb_classes.html', fragment: 'docs/vc-body.html',
    title: 'DACE — Verb Classes', accent: '#3b6ea5', accentTint: 'rgba(59,110,165,.07)',
    description: 'The semantic and Levin-style classes of English clause-embedding predicates in DACE.' },
  { name: 'about', src: 'docs-src/about.md', fragment: 'docs/about-body.html', templated: true },
];

export function slug(text) {
  return text.toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z0-9#]+;/g, '')
    .replace(/[*_`]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderMarkdown(md) {
  const seen = new Map();
  const base = new Renderer();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        let id = slug(text);
        const n = seen.get(id) || 0;
        seen.set(id, n + 1);
        if (n) id += '-' + n;
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      table(token) {
        base.parser = this.parser;
        return '<div class="table-wrap">' + base.table(token) + '</div>\n';
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href);
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
      },
    },
  });
  return marked.parse(md);
}

/** {{key}} substitution; unknown keys are an error so typos can't ship. */
export function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`template placeholder {{${k}}} has no value`);
    return String(vars[k]);
  });
}

/** Returns a map of output path → contents for every doc file. */
export function buildDocs(root, stats) {
  const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n?/g, '\n');
  const pageTemplate = read('docs-src/_page.html');
  const out = {};
  for (const d of DOCS) {
    let md = read(d.src);
    if (d.templated) md = fill(md, stats);
    const html = renderMarkdown(md);
    if (d.fragment) out[d.fragment] = html;
    if (d.page) {
      out[d.page] = fill(pageTemplate, {
        title: escapeHtml(d.title), description: escapeHtml(d.description),
        accent: d.accent, accentTint: d.accentTint, body: html,
      });
    }
  }
  return out;
}

/** Heading ids per standalone page — used by the anchor check. */
export function headingIds(html) {
  return new Set([...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map((m) => m[1]));
}
