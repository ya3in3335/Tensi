import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Icon, { ICON_NAMES } from '../src/components/Icon';

describe('icons', () => {
  it('every icon renders as an accessible-by-default SVG', () => {
    for (const name of ICON_NAMES) {
      const html = renderToStaticMarkup(<Icon name={name} />);
      expect(html).toMatch(/^<svg[^>]*viewBox="0 0 24 24"/);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toMatch(/<(path|rect|circle)/);
    }
    expect(renderToStaticMarkup(<Icon name="bell" label="x" />)).toContain('role="img"');
  });

  it('the interface uses SVG icons, not emojis or symbol characters', () => {
    const files: string[] = [];
    const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); });
    walk(join(__dirname, '..', 'src'));
    const symbol = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{25A0}-\u{25FF}\u{2300}-\u{23FF}ℹ]/u;
    const offenders = files.filter((f) => readFileSync(f, 'utf8').split('\n').some((l) => !l.trim().startsWith('//') && !l.includes('/**') && symbol.test(l)));
    expect(offenders).toEqual([]);
  });
});
