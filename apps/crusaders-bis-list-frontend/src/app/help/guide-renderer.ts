import { Marked, Tokens } from 'marked';

/** A heading of the guide, for the table of contents. */
export interface GuideHeading {
  id: string;
  text: string;
  /** 2 = chapter, 3 = section within a chapter. */
  level: 2 | 3;
}

export interface RenderedGuide {
  /** Page title (the h1 of the guide). */
  title: string;
  html: string;
  headings: GuideHeading[];
}

/** Where the guide's screenshots are served from (see the `assets` of the frontend build). */
export const GUIDE_IMAGE_BASE = '/assets/help/images/';
export const GUIDE_URL = '/assets/help/HOW-TO-USE-THIS-APP-GUIDE.md';

/**
 * GitHub style heading id ("6. Items op je chase-lijst zetten" -> "6-items-op-je-chase-lijst-zetten"), so the links
 * inside the guide keep working in the app, and links into the guide can be written the same way.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Turns the Markdown guide (the single source of truth, also read on GitHub) into HTML for the in-app help page:
 * heading ids and a table of contents, screenshots served from the app, tables in the app's table style and external
 * links in a new tab. The "Inhoud" list at the top is left out, the page has its own table of contents.
 */
export function renderGuide(markdown: string): RenderedGuide {
  const headings: GuideHeading[] = [];
  const seen = new Map<string, number>();
  let title = 'Handleiding';

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading(this: { parser: { parseInline(t: Tokens.Generic[]): string } }, { tokens, depth, text }: Tokens.Heading): string {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1) {
          title = text;
          return '';
        }
        let id = slugify(text);
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n > 0) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) headings.push({ id, text, level: depth });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      image({ href, title: imgTitle, text }: Tokens.Image): string {
        const src = href.replace(/^(\.\/)?docs\/how-to\//, GUIDE_IMAGE_BASE);
        const caption = imgTitle ?? text;
        return `<figure class="guide-shot"><img src="${escapeHtml(src)}" alt="${escapeHtml(text)}" loading="lazy" /><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
      },
      link(this: { parser: { parseInline(t: Tokens.Generic[]): string } }, { href, tokens }: Tokens.Link): string {
        const inner = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        return external
          ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${inner}</a>`
          : `<a href="${escapeHtml(href)}">${inner}</a>`;
      },
    },
  });

  // The in-page "Inhoud" list is replaced by the sidebar
  const source = markdown.replace(/^## Inhoud\s*\n[\s\S]*?\n---\s*\n/m, '');
  const html = (marked.parse(source) as string)
    .replace(/<table>/g, '<div class="table-wrap"><table class="table">')
    .replace(/<\/table>/g, '</table></div>');
  return { title, html, headings };
}
