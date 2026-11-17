import { renderGuide, slugify } from './guide-renderer';

describe('slugify', () => {
  it('makes GitHub style ids, so the anchors inside the guide keep working', () => {
    expect(slugify('6. Items op je chase-lijst zetten')).toBe('6-items-op-je-chase-lijst-zetten');
    expect(slugify('Gearing plan: wat moet je waar doen?')).toBe('gearing-plan-wat-moet-je-waar-doen');
    expect(slugify('Seizoen-config: gear-tiers en bonusrol')).toBe('seizoen-config-gear-tiers-en-bonusrol');
    expect(slugify('Twee weergaven: Itemlijst en Character')).toBe('twee-weergaven-itemlijst-en-character');
  });
});

describe('renderGuide', () => {
  const md = [
    '# Titel van de gids',
    '',
    'Intro.',
    '',
    '## Inhoud',
    '',
    '1. [Een](#een)',
    '',
    '---',
    '',
    '## Een',
    '',
    '### Sub',
    '',
    '![Een screenshot](docs/how-to/01-x.png)',
    '',
    'Zie [extern](https://example.com) en [hier](#sub).',
    '',
    '| A | B |',
    '| --- | --- |',
    '| 1 | 2 |',
    '',
    '## Een',
  ].join('\n');

  it('takes the title, collects chapters and sections and gives every heading an id (duplicates get a suffix)', () => {
    const guide = renderGuide(md);
    expect(guide.title).toBe('Titel van de gids');
    expect(guide.headings).toEqual([
      { id: 'een', text: 'Een', level: 2 },
      { id: 'sub', text: 'Sub', level: 3 },
      { id: 'een-1', text: 'Een', level: 2 },
    ]);
    expect(guide.html).toContain('<h2 id="een">');
    expect(guide.html).not.toContain('Titel van de gids');
  });

  it('leaves out the inline table of contents', () => {
    expect(renderGuide(md).html).not.toContain('href="#een"');
  });

  it('serves screenshots from the app, wraps tables and opens external links in a new tab', () => {
    const html = renderGuide(md).html;
    expect(html).toContain('src="/assets/help/images/01-x.png"');
    expect(html).toContain('<div class="table-wrap"><table class="table">');
    expect(html).toContain('href="https://example.com" target="_blank"');
    expect(html).toContain('<a href="#sub">hier</a>');
  });
});
