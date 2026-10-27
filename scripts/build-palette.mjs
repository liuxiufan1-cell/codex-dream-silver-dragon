// Single palette source for the preview, trusted runtime and restricted static ZIP.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const palette = JSON.parse(await fs.readFile(path.join(root, 'palette.json'), 'utf8'));
export const colors = Object.fromEntries(Object.entries(palette.colors).map(([k, v]) => {
  if (!/^#[0-9a-f]{6}$/i.test(v.hex)) throw Error(`Invalid palette: ${k}`);
  return [k, v.hex];
}));
export const paletteCSS = `/* Generated from palette.json. */\n:root {\n${Object.entries(colors).map(([k, v]) => `  --smp-${k}: ${v};`).join('\n')}\n}\n`;
await fs.writeFile(path.join(root, 'assets/ui/palette.css'), paletteCSS);
const themePath = path.join(root, 'static-theme/theme.json');
const theme = JSON.parse(await fs.readFile(themePath, 'utf8'));
Object.assign(theme, { name: '白银龙娘 · 紫晶白昼（动态测试版）', appearance: 'light',
  brandSubtitle: 'SILVER DRAGON // AMETHYST DAYLIGHT', statusText: '紫晶白昼',
  colors: { background: colors.canvas, panel: colors.surface, panelAlt: colors.raised,
    accent: colors.accent, accentAlt: colors.focus, secondary: colors.muted,
    highlight: colors.ink, text: colors.ink, muted: colors.muted, line: colors.line } });
await fs.writeFile(themePath, JSON.stringify(theme, null, 2) + '\n');
const parts = {
  root: [colors.canvas, colors.ink], sidebar: [colors.canvas, colors.ink],
  header: [colors.surface, colors.ink], 'home-hero': [null, colors.ink],
  'project-list': [colors.surface, colors.ink], thread: [colors.canvas, colors.ink],
  message: [colors.surface, colors.ink], composer: [colors.surface, colors.ink],
  'composer-toolbar': [colors.surface, colors.ink], dialog: [colors.surface, colors.ink],
};
await fs.writeFile(path.join(root, 'static-theme/theme.css'), '' +
  Object.entries(parts).map(([part, [bg, fg]]) => `[data-ds-part="${part}"] {\n  color: ${fg};\n${bg ? `  background-color: ${bg};\n` : ''}  border-color: ${colors.line};\n  border-radius: 12px;\n}\n`).join('') +
  `[data-ds-part="project-list"]:hover { background-color: ${colors.raised}; }\n[data-ds-part="composer"]:focus-visible { border-color: ${colors.focus}; }\n`);
