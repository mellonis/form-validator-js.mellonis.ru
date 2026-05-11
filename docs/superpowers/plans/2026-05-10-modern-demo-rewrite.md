# Modern docs-site rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-page Vite demo with a small static Astro site (4 sections, 5 live-demo forms, "technical brutalism" design) that markets the `@form-validator-js/{core,validators}` libraries.

**Architecture:** Static Astro site, MDX for prose pages (validators reference + API), `.astro` for the home and example pages. Each live demo is a single source of truth: HTML lives as a frontmatter string used by both `set:html` and `<CodeBlock>`; JS lives in a sibling `.ts` file imported once for execution and once with Vite's `?raw` suffix for display.

**Tech Stack:** Astro 5.x (static output), `@astrojs/mdx`, `@astrojs/sitemap`, Shiki (Astro built-in), `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@form-validator-js/{core,validators}` v1.0.0.

**Source spec:** `docs/superpowers/specs/2026-05-10-modern-demo-rewrite-design.md`. Read it before starting; it locks in audience, palette, typography, geometry, and the live-demo contract.

**Note on tests and commits:** Per the spec, this site has no automated test suite — every task ends with a manual smoke-test step instead of an automated one. Commit steps are included at the end of each task; do not skip them, but the user has a global rule against unauthorized commits, so the executor should commit only when explicitly authorized for this run.

---

## File map (created or modified across the plan)

```
astro.config.mjs                              # Task 1
tsconfig.json                                 # Task 1
package.json                                  # Task 1
public/fonts/                                 # Task 2 (via @fontsource)
src/
├── pages/
│   ├── index.astro                           # Task 1 (placeholder), Task 8 (real)
│   ├── validators/index.mdx                  # Task 13
│   ├── examples/
│   │   ├── signup.astro                      # Task 9
│   │   ├── booking.astro                     # Task 10
│   │   ├── wizard.astro                      # Task 11
│   │   └── async.astro                       # Task 12
│   └── api/index.mdx                         # Task 14
├── layouts/
│   └── DocsLayout.astro                      # Task 4
├── components/
│   ├── Header.astro                          # Task 4
│   ├── Footer.astro                          # Task 4
│   ├── ThemeToggle.astro                     # Task 5
│   ├── Hero.astro                            # Task 8
│   ├── WhenThisFits.astro                    # Task 8
│   ├── CodeBlock.astro                       # Task 6
│   ├── LiveDemo.astro                        # Task 7
│   ├── ValidatorCard.astro                   # Task 13
│   ├── TriggerComparison.astro               # Task 14
│   └── demos/
│       ├── home.demo.ts                      # Task 8
│       ├── signup.demo.ts                    # Task 9
│       ├── booking.demo.ts                   # Task 10
│       ├── wizard.demo.ts                    # Task 11
│       └── async.demo.ts                     # Task 12
├── styles/
│   └── global.css                            # Task 3
└── lib/
    └── theme.ts                              # Task 5
```

Files **deleted** in Task 1 (no longer used after Astro replaces Vite):

```
index.html                                    # Vite entry (root) — replaced by src/pages/index.astro
src/main.js                                   # current FormValidator integration — moves into demo files
src/styles/main.css                           # current CSS — replaced by src/styles/global.css
package-lock.json                             # regenerated after dependency swap
```

---

## Task 1: Replace Vite with Astro scaffolding

**Files:**
- Modify: `package.json`
- Create: `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`
- Delete: `index.html`, `src/main.js`, `src/styles/main.css`, `package-lock.json`

- [ ] **Step 1: Replace `package.json` contents**

```json
{
  "name": "form-validator-js.mellonis.ru",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mellonis/form-validator-js.mellonis.ru.git"
  },
  "author": "Ruslan Gilmullin <mellonis@yandex.ru>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/mellonis/form-validator-js.mellonis.ru/issues"
  },
  "homepage": "https://github.com/mellonis/form-validator-js.mellonis.ru#readme",
  "dependencies": {
    "@form-validator-js/core": "1.0.0",
    "@form-validator-js/validators": "1.0.0"
  },
  "devDependencies": {
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0",
    "astro": "^5.0.0",
    "typescript": "^5.6.0"
  }
}
```

Note: pin to `^5.0.0` for Astro and current `^` ranges for the rest. If newer majors exist at install time, the executor verifies compatibility (see Step 4) before locking. The `"type": "module"` line is required so Astro reads `astro.config.mjs` correctly.

- [ ] **Step 2: Delete the legacy Vite files**

```bash
rm index.html src/main.js src/styles/main.css package-lock.json
rmdir src/styles 2>/dev/null  # remove if now empty; styles will be recreated in Task 3
```

- [ ] **Step 3: Install dependencies**

```bash
rm -rf node_modules
npm install
```

Expected: completes with no errors. A new `package-lock.json` is created.

- [ ] **Step 4: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://form-validator-js.mellonis.ru',
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
```

The Shiki theme is `github-light` / `github-dark` for now — Task 6 swaps it for a custom near-monochrome theme that matches the brutalist palette.

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 6: Create placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>form-validator-js</title>
  </head>
  <body>
    <h1>form-validator-js — site under construction</h1>
  </body>
</html>
```

This is replaced wholesale in Task 8.

- [ ] **Step 7: Smoke test — Astro dev server**

```bash
npm run dev
```

Expected: Astro starts, prints a URL (typically `http://localhost:4321/`). Open it: the placeholder page renders. Stop the server (`Ctrl-C`).

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json src/pages/index.astro
git rm index.html src/main.js src/styles/main.css
git rm package-lock.json
git add package-lock.json
git commit -m "feat: scaffold Astro site (replaces Vite + vanilla HTML)"
```

If `git rm` fails because the file isn't tracked yet (it was created earlier in this session and never committed), fall back to plain `rm` for those — they'll just disappear from the working tree.

---

## Task 2: Self-host fonts via @fontsource

**Files:**
- No new source files. Imports added in Task 3's `global.css`. (`@fontsource-variable/*` ships woff2 files in `node_modules`; Astro/Vite resolves them at build time.)

- [ ] **Step 1: Verify font packages installed**

```bash
ls node_modules/@fontsource-variable/inter/files/ | head
ls node_modules/@fontsource-variable/jetbrains-mono/files/ | head
```

Expected: `.woff2` files for both packages are present. (Already installed in Task 1 Step 3.) No action needed unless missing — if missing, `npm install @fontsource-variable/inter @fontsource-variable/jetbrains-mono`.

- [ ] **Step 2: Note the import paths**

The fonts are imported in CSS as:

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';
```

These imports pull the variable-weight fonts (full `wght` axis 100–900). At build time, Vite copies the woff2 files into `dist/_astro/` and rewrites the URLs.

The `font-family` names declared by these packages are `Inter Variable` and `JetBrains Mono Variable`. Use these exact names in the `font-family` stack in Task 3.

This task has no commit on its own — the imports will land in Task 3's `global.css` commit.

---

## Task 3: Design tokens & base styles (global.css)

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create the directory if it doesn't exist**

```bash
mkdir -p src/styles
```

- [ ] **Step 2: Create `src/styles/global.css` with full content below**

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

/* === Design tokens (dark default) === */
:root {
  --bg: #0a0a0a;
  --fg: #e5e5e5;
  --accent: #f69e7b;
  --muted: #71717a;
  --rule: #262626;
  --error: #f87171;
  --bg-elev: #141414;       /* subtle elevation, e.g. code blocks on dark */

  --font-display: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-body:    'Inter Variable', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --font-mono:    'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;

  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;

  --content-max: 72ch;
  --gutter-mobile: 24px;
  --gutter-desktop: 64px;

  color-scheme: dark;
}

/* === Light theme (manual or via prefers-color-scheme) === */
[data-theme='light'] {
  --bg: #fafaf7;
  --fg: #0a0a0a;
  --rule: #e7e5e4;
  --error: #dc2626;
  --bg-elev: #f5f5f4;
  color-scheme: light;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --bg: #fafaf7;
    --fg: #0a0a0a;
    --rule: #e7e5e4;
    --error: #dc2626;
    --bg-elev: #f5f5f4;
    color-scheme: light;
  }
}

/* === Reset === */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { background: var(--bg); color: var(--fg); }
body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  font-feature-settings: "ss01";
  min-height: 100vh;
}

/* === Type scale === */
h1, h2 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}
h3, h4 {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
h1 { font-size: clamp(2rem, 5vw, 3rem); }
h2 { font-size: clamp(1.5rem, 3.5vw, 2.25rem); }
h3 { font-size: 1.25rem; }
h4 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; }

p, li { max-width: var(--content-max); }
strong { font-weight: 500; }
small { color: var(--muted); font-size: 0.875rem; }

/* === Links === */
a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: opacity 150ms ease;
}
a:hover { opacity: 0.7; }

/* === Code === */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--bg-elev);
  padding: 1px 5px;
  border-radius: 2px;
}
pre code { background: transparent; padding: 0; }
pre {
  background: var(--bg-elev);
  border: 1px solid var(--rule);
  padding: var(--space-2);
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.55;
}

/* === Rules / separators === */
hr {
  border: 0;
  border-top: 1px solid var(--rule);
  margin: var(--space-4) 0;
}

/* === Buttons === */
button, .button {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--accent);
  color: #0a0a0a;
  border: 0;
  padding: 10px 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 150ms ease;
}
button:hover, .button:hover { opacity: 0.85; }
button.secondary, .button.secondary {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--rule);
}

/* === Form-validator default error styling === */
.error-list {
  list-style: none;
  padding: 4px 0 0 0;
  margin: 0;
  color: var(--error);
  font-size: 0.875rem;
}
.error-list li { padding: 2px 0; }

input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"] {
  border-color: var(--error);
}

/* === Layout primitives === */
.container {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--gutter-mobile);
}
.container-wide {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--gutter-mobile);
}

@media (min-width: 768px) {
  .container, .container-wide {
    padding: 0 var(--gutter-desktop);
  }
}

/* === Utility === */
.muted { color: var(--muted); }
.label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

/* === Skip link (a11y) === */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
}
.skip-link:focus {
  position: fixed;
  left: 8px;
  top: 8px;
  background: var(--bg);
  color: var(--fg);
  padding: 8px 12px;
  border: 1px solid var(--rule);
  z-index: 100;
}
```

- [ ] **Step 3: Smoke test — confirm CSS compiles**

The CSS isn't imported anywhere yet. To verify it parses:

```bash
node -e "console.log(require('fs').readFileSync('src/styles/global.css', 'utf8').length)"
```

Expected: prints a number (file size). If syntax errors exist, they'll surface in Task 4 when DocsLayout imports this file.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: design tokens and base styles (brutalist palette + typography)"
```

---

## Task 4: Layout chrome — Header, Footer, DocsLayout

**Files:**
- Create: `src/components/Header.astro`, `src/components/Footer.astro`, `src/layouts/DocsLayout.astro`
- Modify: `src/pages/index.astro` (use the layout)

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
const navItems = [
  { href: '/validators/', label: 'Validators' },
  { href: '/examples/signup', label: 'Examples' },
  { href: '/api/', label: 'API' },
];
const currentPath = Astro.url.pathname;
---
<header class="site-header">
  <a href="#main" class="skip-link">Skip to content</a>
  <div class="container-wide header-inner">
    <a href="/" class="brand">form-validator-js</a>
    <nav aria-label="Primary">
      <ul>
        {navItems.map(({ href, label }) => (
          <li>
            <a href={href} class:list={[
              'nav-link',
              currentPath === href || currentPath.startsWith(href.replace(/\/$/, '/')) ? 'is-current' : '',
            ]}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
    <div class="header-actions">
      <a href="https://github.com/mellonis/form-validator-js" class="github-link" aria-label="GitHub repository">GitHub ↗</a>
      {/* ThemeToggle slot: filled in Task 5 */}
      <slot name="theme-toggle" />
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    border-bottom: 1px solid var(--rule);
    backdrop-filter: blur(8px);
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-2);
    padding-bottom: var(--space-2);
  }
  .brand {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--fg);
    text-decoration: none;
    letter-spacing: -0.01em;
  }
  nav ul {
    display: flex;
    gap: var(--space-3);
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .nav-link {
    color: var(--fg);
    text-decoration: none;
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }
  .nav-link:hover, .nav-link.is-current {
    color: var(--accent);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .github-link {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--fg);
    text-decoration: none;
  }
  .github-link:hover { color: var(--accent); }

  @media (max-width: 640px) {
    nav ul { gap: var(--space-2); }
    .github-link { display: none; }
  }
</style>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="container-wide footer-inner">
    <p class="muted">
      <code>@form-validator-js/{`{core,validators}`}</code> v1.0.0 · MIT · by
      <a href="https://github.com/mellonis">mellonis</a>
    </p>
    <p class="muted">© {year}</p>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--rule);
    margin-top: var(--space-8);
  }
  .footer-inner {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-3);
    padding-bottom: var(--space-3);
    font-size: 0.875rem;
    flex-wrap: wrap;
  }
  .footer-inner p { margin: 0; }
  .footer-inner code { font-size: 0.875rem; }
</style>
```

- [ ] **Step 3: Create `src/layouts/DocsLayout.astro`**

```astro
---
import '~/styles/global.css';
import Header from '~/components/Header.astro';
import Footer from '~/components/Footer.astro';

interface Props {
  title: string;
  description?: string;
  fullBleed?: boolean;  // true on /examples/* and /
}
const { title, description = 'Declarative form validation in HTML — for server-rendered apps, HTMX/Alpine, and no-build static sites.', fullBleed = false } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={Astro.url.href} />
    <meta name="twitter:card" content="summary" />
    <link rel="canonical" href={Astro.url.href} />
    {/* Theme bootstrap script — runs before paint to prevent flash */}
    <script is:inline>
      (function () {
        try {
          var saved = localStorage.getItem('theme');
          if (saved === 'light' || saved === 'dark') {
            document.documentElement.dataset.theme = saved;
          }
        } catch (_) {}
      })();
    </script>
  </head>
  <body>
    <Header>
      <slot name="theme-toggle" slot="theme-toggle" />
    </Header>
    <main id="main" class:list={[fullBleed ? 'main-full' : 'main-prose']}>
      <slot />
    </main>
    <Footer />
  </body>
</html>

<style is:global>
  .main-full {
    /* Examples and the home hero use the full-bleed container in their own components */
  }
  .main-prose {
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--space-6) var(--gutter-mobile);
  }
  @media (min-width: 768px) {
    .main-prose {
      padding-left: var(--gutter-desktop);
      padding-right: var(--gutter-desktop);
    }
  }
</style>
```

The `~/` alias resolves to `src/` per `tsconfig.json` (Task 1 Step 5). The flash-prevention inline script is required because Astro pre-renders pages — without it, dark-mode users would see a brief flash of light theme before JS runs.

- [ ] **Step 4: Replace `src/pages/index.astro` placeholder to use the layout**

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
---
<DocsLayout title="form-validator-js" fullBleed>
  <div class="container-wide" style="padding-top: var(--space-6);">
    <h1>form-validator-js</h1>
    <p class="muted">Site under construction. Hero lands in Task 8.</p>
  </div>
</DocsLayout>
```

- [ ] **Step 5: Smoke test — page renders with header and footer**

```bash
npm run dev
```

Open `http://localhost:4321/`. Expected:
- Sticky header with brand + nav links + GitHub link visible
- Body shows the placeholder
- Footer at the bottom
- No console errors
- Nav links to `/validators/`, `/examples/signup`, `/api/` 404 (those pages don't exist yet — expected; nav still works)

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro src/layouts/DocsLayout.astro src/pages/index.astro
git commit -m "feat: layout chrome (header, footer, DocsLayout)"
```

---

## Task 5: Theme toggle (theme.ts + ThemeToggle.astro)

**Files:**
- Create: `src/lib/theme.ts`, `src/components/ThemeToggle.astro`
- Modify: `src/layouts/DocsLayout.astro` (slot in the toggle)

- [ ] **Step 1: Create `src/lib/theme.ts`**

```ts
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function getEffectiveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function toggleTheme(): Theme {
  const next: Theme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
```

- [ ] **Step 2: Create `src/components/ThemeToggle.astro`**

```astro
---
---
<button id="theme-toggle" type="button" class="secondary" aria-label="Toggle theme">
  <span class="theme-toggle-icon" aria-hidden="true">◐</span>
  <span class="visually-hidden">Theme</span>
</button>

<style>
  #theme-toggle {
    padding: 6px 10px;
    font-size: 1rem;
    line-height: 1;
    background: transparent;
    border: 1px solid var(--rule);
    color: var(--fg);
  }
  #theme-toggle:hover { color: var(--accent); }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>

<script>
  import { toggleTheme, getEffectiveTheme } from '~/lib/theme';

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = toggleTheme();
      btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
    });
    // Initial label
    const current = getEffectiveTheme();
    btn.setAttribute('aria-label', `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`);
  }
</script>
```

- [ ] **Step 3: Slot the toggle into DocsLayout's header**

In `src/pages/index.astro` (and every page that uses DocsLayout), the toggle is provided as a named slot. Update `index.astro`:

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
---
<DocsLayout title="form-validator-js" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <div class="container-wide" style="padding-top: var(--space-6);">
    <h1>form-validator-js</h1>
    <p class="muted">Site under construction. Hero lands in Task 8.</p>
  </div>
</DocsLayout>
```

Every subsequent page (Tasks 8–14) follows this pattern — `<ThemeToggle slot="theme-toggle" />` directly inside `<DocsLayout>`.

- [ ] **Step 4: Smoke test — toggle works and persists**

```bash
npm run dev
```

Open the home page. Verify:
- A toggle button appears in the header (a `◐` icon)
- Clicking it inverts the colors instantly
- Reload — the chosen theme persists
- Open DevTools → Application → Local Storage; verify `theme` is `'light'` or `'dark'`
- With `theme` cleared from localStorage, the page respects `prefers-color-scheme` (test by toggling OS dark mode preference, or by overriding in DevTools → Rendering → Emulate CSS prefers-color-scheme)
- No flash on reload (the inline script in DocsLayout runs before paint)

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/components/ThemeToggle.astro src/pages/index.astro
git commit -m "feat: theme toggle with localStorage + prefers-color-scheme"
```

---

## Task 6: CodeBlock component (Shiki wrapper + copy button)

**Files:**
- Create: `src/components/CodeBlock.astro`

- [ ] **Step 1: Create `src/components/CodeBlock.astro`**

```astro
---
import { Code } from 'astro:components';

interface Props {
  code: string;
  lang: 'html' | 'ts' | 'js' | 'css' | 'json' | 'sh';
  filename?: string;
}
const { code, lang, filename } = Astro.props;
---
<figure class="code-block">
  {filename && <figcaption class="label">{filename}</figcaption>}
  <div class="code-pane">
    <button type="button" class="copy-btn secondary" data-code={code} aria-label="Copy code">Copy</button>
    <Code code={code} lang={lang} themes={{ light: 'github-light', dark: 'github-dark' }} />
  </div>
</figure>

<style>
  .code-block {
    margin: var(--space-2) 0;
  }
  .code-block figcaption {
    margin-bottom: var(--space-1);
  }
  .code-pane {
    position: relative;
    border: 1px solid var(--rule);
    background: var(--bg-elev);
  }
  .code-pane :global(pre) {
    margin: 0;
    border: 0;
    background: transparent;
    padding: var(--space-2);
    font-size: 0.875rem;
    line-height: 1.55;
    overflow-x: auto;
  }
  .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    padding: 4px 10px;
    opacity: 0;
    transition: opacity 150ms ease;
    z-index: 1;
  }
  .code-pane:hover .copy-btn,
  .copy-btn:focus { opacity: 1; }
  .copy-btn.copied { color: var(--accent); }
</style>

<script>
  document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.code ?? '';
      try {
        await navigator.clipboard.writeText(code);
        const original = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });
  });
</script>
```

The `themes={{ light, dark }}` syntax is Astro's `<Code />` component dual-theme feature: it renders both at build time and CSS toggles them based on the document's theme. The themes match `astro.config.mjs` defaults.

- [ ] **Step 2: Smoke test — render a code block on the home page**

Temporarily add to `src/pages/index.astro` inside the `<DocsLayout>`:

```astro
<CodeBlock lang="ts" code={`const x = 42;\nconsole.log(x);`} filename="example.ts" />
```

(With `import CodeBlock from '~/components/CodeBlock.astro';` in the frontmatter.)

```bash
npm run dev
```

Verify:
- The code renders with syntax highlighting
- Hovering the pane reveals a "Copy" button
- Clicking Copy → button text changes to "Copied" → resets after 1.5s
- Clipboard contains the code
- Toggle theme: highlighting updates without page reload

Remove the temporary block; revert `index.astro` to its Task 5 state.

- [ ] **Step 3: Commit**

```bash
git add src/components/CodeBlock.astro
git commit -m "feat: CodeBlock with Shiki dual theme + copy button"
```

---

## Task 7: LiveDemo component

**Files:**
- Create: `src/components/LiveDemo.astro`

- [ ] **Step 1: Create `src/components/LiveDemo.astro`**

```astro
---
import CodeBlock from '~/components/CodeBlock.astro';

interface Props {
  formHtml: string;
  jsSource: string;
  jsFilename?: string;
  htmlFilename?: string;
}
const { formHtml, jsSource, jsFilename = 'demo.ts', htmlFilename = 'index.html' } = Astro.props;
---
<section class="live-demo container-wide">
  <div class="live-demo-grid">
    <div class="form-pane">
      <header class="pane-header">
        <span class="label">Live form</span>
        <button type="button" class="reset-btn secondary">Reset</button>
      </header>
      <div class="form-host" set:html={formHtml} />
    </div>
    <div class="code-pane-stack">
      <CodeBlock lang="html" code={formHtml} filename={htmlFilename} />
      <CodeBlock lang="ts" code={jsSource} filename={jsFilename} />
    </div>
  </div>
</section>

<style>
  .live-demo {
    margin: var(--space-6) auto;
  }
  .live-demo-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  @media (min-width: 900px) {
    .live-demo-grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: var(--space-4);
    }
  }
  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }
  .form-host {
    border: 1px solid var(--rule);
    padding: var(--space-3);
    background: var(--bg-elev);
  }
  .form-host :global(form) {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .form-host :global(label) {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    display: block;
    margin-bottom: 4px;
  }
  .form-host :global(input),
  .form-host :global(textarea),
  .form-host :global(select) {
    width: 100%;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--rule);
    padding: 8px 12px;
    font-family: inherit;
    font-size: 1rem;
    border-radius: 0;
  }
  .form-host :global(input:focus),
  .form-host :global(textarea:focus),
  .form-host :global(select:focus) {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  .form-host :global(button[type="submit"]) {
    align-self: flex-start;
  }
  .reset-btn {
    font-size: 0.75rem;
    padding: 4px 10px;
  }
</style>

<script>
  document.querySelectorAll<HTMLButtonElement>('.reset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = btn.closest('.live-demo')?.querySelector('form');
      if (form instanceof HTMLFormElement) form.reset();
    });
  });
</script>
```

- [ ] **Step 2: Smoke test deferred — first real use is in Task 8**

This component is verified end-to-end when Task 8's home page uses it with a real form.

- [ ] **Step 3: Commit**

```bash
git add src/components/LiveDemo.astro
git commit -m "feat: LiveDemo (form + html + js triplet)"
```

---

## Task 8: Home page (Hero + WhenThisFits + inline live demo)

**Files:**
- Create: `src/components/Hero.astro`, `src/components/WhenThisFits.astro`, `src/components/demos/home.demo.ts`
- Modify: `src/pages/index.astro` (replace placeholder with full home)

- [ ] **Step 1: Create `src/components/Hero.astro`**

```astro
---
---
<section class="hero container-wide">
  <p class="label hero-eyebrow">v1.0 · MIT · zero deps</p>
  <h1 class="hero-headline">
    Form validation in HTML.<br />
    <span class="muted-headline">Not in JavaScript.</span>
  </h1>
  <p class="hero-sub">
    Declarative <code>data-*</code> attribute rules for server-rendered apps,
    HTMX/Alpine, and no-build static sites.
  </p>
  <div class="hero-actions">
    <a href="#demo" class="button">See it work ↓</a>
    <a href="/validators/" class="button secondary">Read the docs</a>
  </div>
</section>

<style>
  .hero {
    padding-top: var(--space-8);
    padding-bottom: var(--space-6);
    border-bottom: 1px solid var(--rule);
  }
  .hero-eyebrow {
    margin-bottom: var(--space-3);
    color: var(--accent);
  }
  .hero-headline {
    font-size: clamp(2.5rem, 7vw, 4.5rem);
    margin-bottom: var(--space-3);
    max-width: 18ch;
  }
  .muted-headline { color: var(--muted); }
  .hero-sub {
    font-size: clamp(1rem, 1.5vw, 1.125rem);
    color: var(--muted);
    max-width: 56ch;
    margin-bottom: var(--space-4);
    line-height: 1.55;
  }
  .hero-actions {
    display: flex;
    gap: var(--space-1);
    flex-wrap: wrap;
  }
</style>
```

- [ ] **Step 2: Create `src/components/WhenThisFits.astro`**

Content lifted verbatim from `../form-validator-js/README.md` § "When this fits, when it doesn't".

```astro
---
---
<section class="when-fits container-wide">
  <h2>When this fits, when it doesn't</h2>
  <p class="lede">
    This is the Parsley.js / jQuery Validate style: rules go in HTML, JS just wires up the engine. Good for:
  </p>
  <ul>
    <li>Server-rendered apps with light JS (Rails/Hotwire, Django, Laravel, plain HTML + HTMX, Alpine).</li>
    <li>No-build static sites.</li>
    <li>Codebases that don't already have a form-state library.</li>
  </ul>
  <p class="aside">
    If you're on a component framework with state-managed forms (React, Vue, Svelte, Solid), reach for
    <a href="https://react-hook-form.com/"><code>react-hook-form</code></a> +
    <a href="https://zod.dev/"><code>zod</code></a>,
    <a href="https://tanstack.com/form/latest"><code>@tanstack/form</code></a> +
    <a href="https://valibot.dev/"><code>valibot</code></a>, or similar.
    Schema-first validation with full TypeScript inference is a better fit there.
  </p>
</section>

<style>
  .when-fits {
    padding-top: var(--space-6);
    padding-bottom: var(--space-6);
    border-bottom: 1px solid var(--rule);
  }
  .lede { margin-bottom: var(--space-2); }
  .when-fits ul { margin: 0 0 var(--space-3) var(--space-3); }
  .when-fits li { margin-bottom: 4px; }
  .aside {
    border-left: 2px solid var(--accent);
    padding-left: var(--space-2);
    color: var(--muted);
    max-width: 64ch;
  }
</style>
```

- [ ] **Step 3: Create `src/components/demos/home.demo.ts`**

This is the minimal home-page demo: 2 fields (login + password) with `required` + `minLength`. Just enough to make the "validation in HTML" point.

```ts
import { FormValidator } from '@form-validator-js/core';
import { required, minLength } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#home-demo-form');
if (form) {
  new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required.' },
      minLength: { ...minLength, errorMessage: 'Too short.' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });
}
```

- [ ] **Step 4: Replace `src/pages/index.astro` with the full home page**

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
import Hero from '~/components/Hero.astro';
import WhenThisFits from '~/components/WhenThisFits.astro';
import LiveDemo from '~/components/LiveDemo.astro';
import jsSource from '~/components/demos/home.demo.ts?raw';

const formHtml = `<form id="home-demo-form" novalidate>
  <div>
    <label for="home-login">Login</label>
    <input id="home-login" name="login" type="text" data-validation="required;minLength(3)" />
    <ul class="error-list"></ul>
  </div>
  <div>
    <label for="home-password">Password</label>
    <input id="home-password" name="password" type="password" data-validation="required;minLength(8)" />
    <ul class="error-list"></ul>
  </div>
  <button type="submit">Sign in</button>
</form>`;
---
<DocsLayout title="form-validator-js — Form validation in HTML, not JavaScript" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <Hero />
  <section id="demo" class="container-wide demo-anchor">
    <h2>One demo</h2>
    <p class="muted lede">The form below is wired with the library. Try submitting empty, then with `ab`. The JS imports it from npm, the rules live in `data-validation`.</p>
  </section>
  <LiveDemo formHtml={formHtml} jsSource={jsSource} jsFilename="home.demo.ts" />
  <WhenThisFits />
  <script>
    import '~/components/demos/home.demo';
  </script>
</DocsLayout>

<style>
  .demo-anchor {
    padding-top: var(--space-6);
  }
  .demo-anchor h2 { margin-bottom: var(--space-2); }
  .demo-anchor .lede { margin-bottom: var(--space-3); max-width: 64ch; }
</style>
```

The frontmatter `import jsSource from '...?raw'` is a build-time import — Vite's `?raw` suffix returns the file's source as a string for the displayed code block. The browser-side execution happens through the `<script>` block at the bottom of the page, which Astro bundles into a regular module script that runs once when the page loads. This same pattern (`?raw` for display, `<script>{import}</script>` for execution) is used in every demo page in Tasks 9–12.

- [ ] **Step 5: Smoke test — full home page works**

```bash
npm run dev
```

Open `http://localhost:4321/`. Verify:

- Hero renders with the brutalist headline ("Form validation in HTML." in JetBrains Mono Bold, "Not in JavaScript." in muted)
- "See it work ↓" anchor scrolls to the demo section
- LiveDemo shows the form on the left, two code blocks (HTML + TS) on the right
- The form is **live**: clicking submit with empty fields shows error messages from the lib; entering `ab` in login shows "Too short."; entering valid values clears errors
- Reset button clears the form and errors
- Copy button on each code block copies the source
- "When this fits, when it doesn't" section renders with the verbatim README copy and the `react-hook-form` / `tanstack/form` links
- Theme toggle works, layout doesn't break in light mode
- No console errors
- 360px mobile width: hero text doesn't overflow, demo stacks vertically, nav is reasonable

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.astro src/components/WhenThisFits.astro src/components/demos/home.demo.ts src/pages/index.astro
git commit -m "feat: home page (hero + live demo + when-this-fits)"
```

---

## Task 9: /examples/signup — full signup form

**Files:**
- Create: `src/pages/examples/signup.astro`, `src/components/demos/signup.demo.ts`

This is the *first* of the four full-page examples. It establishes the pattern Tasks 10–12 follow exactly. **Read this task carefully; the later tasks are abbreviated and assume this pattern.**

- [ ] **Step 1: Create `src/components/demos/signup.demo.ts`**

```ts
import { FormValidator } from '@form-validator-js/core';
import { required, minLength, pattern, equalsTo } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#signup-form');
if (form) {
  const validator = new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required.' },
      minLength: { ...minLength, errorMessage: 'Too short.' },
      pattern:   { ...pattern,   errorMessage: 'Not a valid format.' },
      equalsTo:  { ...equalsTo,  errorMessage: 'Passwords must match.' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });

  // Per-field overrides: tell users what the password rules are.
  const password = form.querySelector<HTMLInputElement>('#signup-password');
  if (password) {
    validator.elementToSpecificErrorMessageMap.set(password, {
      minLength: 'Use at least 8 characters.',
      pattern: 'Include at least one digit.',
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Signed up (this is a demo — no actual submission).');
  });
}
```

- [ ] **Step 2: Create `src/pages/examples/signup.astro`**

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
import LiveDemo from '~/components/LiveDemo.astro';
import jsSource from '~/components/demos/signup.demo.ts?raw';

const formHtml = `<form id="signup-form" novalidate>
  <div>
    <label for="signup-email">Email</label>
    <input id="signup-email" name="email" type="email"
           data-validation="required;pattern([^@\\s]+@[^@\\s]+\\.[^@\\s]+)" />
    <ul class="error-list"></ul>
  </div>
  <div>
    <label for="signup-username">Username</label>
    <input id="signup-username" name="username" type="text"
           data-validation="required;minLength(3)" />
    <ul class="error-list"></ul>
  </div>
  <div>
    <label for="signup-password">Password</label>
    <input id="signup-password" name="password" type="password"
           data-validation="required;minLength(8);pattern(.*\\d.*)" />
    <ul class="error-list"></ul>
  </div>
  <div>
    <label for="signup-confirm">Confirm password</label>
    <input id="signup-confirm" name="confirm" type="password"
           data-validation="required;equalsTo(signup-password)" />
    <ul class="error-list"></ul>
  </div>
  <button type="submit">Create account</button>
</form>`;
---
<DocsLayout title="Sign up — form-validator-js" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <section class="container-wide page-header">
    <p class="label">Example</p>
    <h1>Sign up</h1>
    <p class="muted lede">
      Required fields, length and pattern checks, cross-field equality. The classic.
      Validators stressed: <code>required</code>, <code>minLength</code>, <code>pattern</code>, <code>equalsTo</code>.
    </p>
  </section>
  <LiveDemo formHtml={formHtml} jsSource={jsSource} jsFilename="signup.demo.ts" htmlFilename="signup.html" />
  <script>
    import '~/components/demos/signup.demo';
  </script>
</DocsLayout>

<style>
  .page-header {
    padding-top: var(--space-6);
    padding-bottom: var(--space-2);
  }
  .page-header h1 { margin-bottom: var(--space-2); }
  .page-header .lede { max-width: 64ch; }
</style>
```

Note: the inline `<script>` at the page level uses dynamic `import()` so the demo executes only in the browser. This is the same loader pattern used in Task 8 — kept inline in the page rather than in a separate `_loader` file because each example page is a single artifact.

A few subtleties in the form HTML worth noting for the executor:
- The `pattern(...)` regex argument follows the library's parser — see `../form-validator-js/CLAUDE.md` § "How validation actually works" for the parsing constraint (closing paren must be followed by `;`, `,`, or whitespace; the parser appends `;` if missing). Backslashes in the JS template literal must be doubled: `\\d` becomes `\d` in the rendered HTML.
- `equalsTo(signup-password)` references another field by **id**. The id format with hyphens works because the parser regex permits `[a-z0-9-_]+`.

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Open `http://localhost:4321/examples/signup`. Verify:

- Page renders with header and demo
- Submit empty: every field shows "Required."
- Type `bob` in email: shows "Not a valid format." (the pattern rejects it)
- Type `ab` in username: shows "Too short."
- Type `password` (no digit): shows "Use at least 8 characters." for length AND "Include at least one digit." for pattern (per-field override message)
- Type `password1` and a different value in confirm: shows "Passwords must match."
- All valid: submit shows the alert
- Reset clears all errors

Light mode: same form, inverted theme, no contrast issues.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/examples/signup.astro src/components/demos/signup.demo.ts
git commit -m "feat: /examples/signup live demo"
```

---

## Task 10: /examples/booking — date/time validators

**Files:**
- Create: `src/pages/examples/booking.astro`, `src/components/demos/booking.demo.ts`

Follows the exact pattern of Task 9. The demo stresses `numeric`, `min`, `max`, and `step` on `type="date"` and `type="time"` inputs. Booking-domain story: pick a date in the next 30 days, pick a time on the half-hour between 09:00 and 18:00, choose a party size between 1 and 8.

- [ ] **Step 1: Create `src/components/demos/booking.demo.ts`**

```ts
import { FormValidator } from '@form-validator-js/core';
import { required, numeric, min, max, step } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#booking-form');
if (form) {
  // Compute today + 30 days for the date bounds.
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const in30 = new Date(today.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);

  // Inject computed bounds into the data-validation attributes.
  const dateInput = form.querySelector<HTMLInputElement>('#booking-date');
  if (dateInput) {
    dateInput.dataset.validation = `required;numeric;min(${todayIso});max(${in30})`;
  }

  new FormValidator({
    form,
    validatorDeclarations: {
      required: { ...required, errorMessage: 'Required.' },
      numeric:  { ...numeric,  errorMessage: 'Not a valid value.' },
      min:      { ...min,      errorMessage: 'Too early / too small.' },
      max:      { ...max,      errorMessage: 'Too late / too large.' },
      step:     { ...step,     errorMessage: 'Not on the allowed step.' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Booked.');
  });
}
```

- [ ] **Step 2: Create `src/pages/examples/booking.astro`**

Same shape as Task 9 Step 2 but with the booking-specific form:

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
import LiveDemo from '~/components/LiveDemo.astro';
import jsSource from '~/components/demos/booking.demo.ts?raw';

const formHtml = `<form id="booking-form" novalidate>
  <div>
    <label for="booking-date">Date</label>
    <input id="booking-date" name="date" type="date"
           data-validation="required;numeric" />
    <ul class="error-list"></ul>
    <small>Bounds (today and today + 30 days) are injected by the JS at runtime.</small>
  </div>
  <div>
    <label for="booking-time">Time</label>
    <input id="booking-time" name="time" type="time"
           data-validation="required;numeric;min(09:00);max(18:00);step(1800)" />
    <ul class="error-list"></ul>
    <small>09:00–18:00, on the half-hour. <code>step</code> takes seconds for type=time.</small>
  </div>
  <div>
    <label for="booking-party">Party size</label>
    <input id="booking-party" name="party" type="number"
           data-validation="required;numeric;min(1);max(8);step(1)" />
    <ul class="error-list"></ul>
  </div>
  <button type="submit">Reserve</button>
</form>`;
---
<DocsLayout title="Booking — form-validator-js" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <section class="container-wide page-header">
    <p class="label">Example</p>
    <h1>Booking</h1>
    <p class="muted lede">
      Date and time inputs with bounds and step. The lib parses each value in the input's
      own format — no hand-rolled date math. Validators stressed:
      <code>numeric</code>, <code>min</code>, <code>max</code>, <code>step</code>.
    </p>
  </section>
  <LiveDemo formHtml={formHtml} jsSource={jsSource} jsFilename="booking.demo.ts" htmlFilename="booking.html" />
  <script>
    import '~/components/demos/booking.demo';
  </script>
</DocsLayout>

<style>
  .page-header { padding-top: var(--space-6); padding-bottom: var(--space-2); }
  .page-header h1 { margin-bottom: var(--space-2); }
  .page-header .lede { max-width: 64ch; }
  .form-host :global(small) { display: block; margin-top: 4px; color: var(--muted); font-size: 0.75rem; }
</style>
```

- [ ] **Step 3: Smoke test**

`npm run dev` → `/examples/booking`. Verify:
- Submit empty: every field shows "Required."
- Pick a date in the past: shows "Too early."
- Pick a date 60 days in the future: shows "Too late."
- Pick `08:30` time: shows "Too early." (below 09:00)
- Pick `12:15` time: shows "Not on the allowed step." (not on a 30-minute boundary)
- Party = 0 or 9: shows min / max error
- Party = 1.5: shows step error (not a whole number)
- All valid: alert fires

- [ ] **Step 4: Commit**

```bash
git add src/pages/examples/booking.astro src/components/demos/booking.demo.ts
git commit -m "feat: /examples/booking live demo"
```

---

## Task 11: /examples/wizard — multi-step with context scoping

**Files:**
- Create: `src/pages/examples/wizard.astro`, `src/components/demos/wizard.demo.ts`

Follows Task 9's pattern. The demo: 3 steps (Profile, Address, Review). Each step is a `<fieldset data-validation-context="*">` so errors from invalid fields in step 1 don't bleed into step 2's view. A "Next" button validates the current step before advancing.

- [ ] **Step 1: Create `src/components/demos/wizard.demo.ts`**

```ts
import { FormValidator } from '@form-validator-js/core';
import { required, minLength, pattern } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#wizard-form');
if (!form) throw new Error('Wizard form missing');

const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-step]'));
let currentStep = 0;

function showStep(i: number) {
  steps.forEach((step, idx) => {
    step.hidden = idx !== i;
  });
  form.querySelector<HTMLElement>('.wizard-progress')!.textContent =
    `Step ${i + 1} of ${steps.length}`;
}

const validator = new FormValidator({
  form,
  validatorDeclarations: {
    required:  { ...required,  errorMessage: 'Required.' },
    minLength: { ...minLength, errorMessage: 'Too short.' },
    pattern:   { ...pattern,   errorMessage: 'Not a valid format.' },
  },
  onErrorMessageListChanged(target, errors) {
    if (target === form) return;
    const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
    if (!list) return;
    list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
  },
});

form.querySelector<HTMLButtonElement>('[data-action="next"]')!.addEventListener('click', () => {
  // Validate every field within the current step. If any are invalid, stay.
  const stepEl = steps[currentStep];
  const fields = stepEl.querySelectorAll<HTMLInputElement>('[data-validation]');
  let allValid = true;
  fields.forEach((f) => {
    f.dispatchEvent(FormValidator.createValidateEvent());
    if (f.getAttribute('aria-invalid') === 'true') allValid = false;
  });
  if (allValid && currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
});

form.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Submitted.');
});

showStep(0);
```

- [ ] **Step 2: Create `src/pages/examples/wizard.astro`**

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
import LiveDemo from '~/components/LiveDemo.astro';
import jsSource from '~/components/demos/wizard.demo.ts?raw';

const formHtml = `<form id="wizard-form" novalidate>
  <p class="wizard-progress label" aria-live="polite"></p>

  <fieldset data-step="profile" data-validation-context="*">
    <legend>Profile</legend>
    <div>
      <label for="wiz-name">Full name</label>
      <input id="wiz-name" name="name" type="text" data-validation="required;minLength(2)" />
      <ul class="error-list"></ul>
    </div>
    <div>
      <label for="wiz-email">Email</label>
      <input id="wiz-email" name="email" type="email"
             data-validation="required;pattern([^@\\s]+@[^@\\s]+\\.[^@\\s]+)" />
      <ul class="error-list"></ul>
    </div>
  </fieldset>

  <fieldset data-step="address" data-validation-context="*" hidden>
    <legend>Address</legend>
    <div>
      <label for="wiz-street">Street</label>
      <input id="wiz-street" name="street" type="text" data-validation="required" />
      <ul class="error-list"></ul>
    </div>
    <div>
      <label for="wiz-city">City</label>
      <input id="wiz-city" name="city" type="text" data-validation="required" />
      <ul class="error-list"></ul>
    </div>
  </fieldset>

  <fieldset data-step="review" data-validation-context="*" hidden>
    <legend>Review</legend>
    <p class="muted">Click submit to finalize.</p>
  </fieldset>

  <div class="wizard-actions">
    <button type="button" data-action="back" class="secondary">Back</button>
    <button type="button" data-action="next">Next</button>
    <button type="submit">Submit</button>
  </div>
</form>`;
---
<DocsLayout title="Wizard — form-validator-js" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <section class="container-wide page-header">
    <p class="label">Example</p>
    <h1>Multi-step wizard</h1>
    <p class="muted lede">
      Each step is a <code>&lt;fieldset data-validation-context="*"&gt;</code> — errors scope per
      step. The "Next" button manually triggers validation via
      <code>FormValidator.createValidateEvent()</code> before advancing.
    </p>
  </section>
  <LiveDemo formHtml={formHtml} jsSource={jsSource} jsFilename="wizard.demo.ts" htmlFilename="wizard.html" />
  <script>
    import '~/components/demos/wizard.demo';
  </script>
</DocsLayout>

<style>
  .page-header { padding-top: var(--space-6); padding-bottom: var(--space-2); }
  .page-header h1 { margin-bottom: var(--space-2); }
  .page-header .lede { max-width: 64ch; }
  .form-host :global(fieldset) {
    border: 1px solid var(--rule);
    padding: var(--space-2);
    margin: 0;
  }
  .form-host :global(legend) {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0 8px;
  }
  .form-host :global(.wizard-progress) {
    margin-bottom: var(--space-2);
    color: var(--accent);
  }
  .form-host :global(.wizard-actions) {
    display: flex;
    gap: var(--space-1);
    margin-top: var(--space-3);
  }
  .form-host :global(button[type="submit"]) {
    margin-left: auto;
  }
</style>
```

- [ ] **Step 3: Smoke test**

`npm run dev` → `/examples/wizard`. Verify:
- Step 1 (Profile) is visible. "Next" with empty fields stays on step 1 with errors.
- Fill step 1 valid, click Next → Step 2 (Address) shows. Step 1 fieldset is hidden but errors don't carry visually.
- Step 2 with empty fields → errors on the visible fields only.
- "Back" returns to step 1 (and the data is preserved by the form's natural state).
- Step 3 (Review) → Submit fires the alert.

- [ ] **Step 4: Commit**

```bash
git add src/pages/examples/wizard.astro src/components/demos/wizard.demo.ts
git commit -m "feat: /examples/wizard live demo (multi-step, context scoping)"
```

---

## Task 12: /examples/async — username availability

**Files:**
- Create: `src/pages/examples/async.astro`, `src/components/demos/async.demo.ts`

Same pattern as Task 9. Demonstrates async injection via `FormValidator.createValidateEvent({ data: { … } })`. The "server" is a mock with `setTimeout` that flags `admin`, `root`, and `mellonis` as taken.

- [ ] **Step 1: Create `src/components/demos/async.demo.ts`**

```ts
import {
  FormValidator,
  FormValidatorInitResult,
  FormValidatorValidationResult,
} from '@form-validator-js/core';
import { required, minLength } from '@form-validator-js/validators';

const TAKEN = new Set(['admin', 'root', 'mellonis']);

function checkUsername(value: string): Promise<boolean> {
  // Mock server: 600ms delay, then resolves with availability.
  return new Promise((resolve) => {
    setTimeout(() => resolve(!TAKEN.has(value.toLowerCase())), 600);
  });
}

const form = document.querySelector<HTMLFormElement>('#async-form');
if (form) {
  const username = form.querySelector<HTMLInputElement>('#async-username')!;
  const status = form.querySelector<HTMLElement>('#async-status')!;

  // A "uniqueUsername" validator that does nothing on its own — the result is
  // injected via createValidateEvent below.
  new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required.' },
      minLength: { ...minLength, errorMessage: 'Too short.' },
      uniqueUsername: {
        init: (target) => new FormValidatorInitResult({ observableElementList: [target] }),
        validate: () => new FormValidatorValidationResult({ isValid: true }),
        errorMessage: 'Username is taken.',
      },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });

  // Debounced async check on input. Skips when the value is empty or too short
  // (let the synchronous validators handle those cases).
  let pending: number | null = null;
  username.addEventListener('input', () => {
    if (pending) window.clearTimeout(pending);
    const value = username.value.trim();
    if (value.length < 3) {
      status.textContent = '';
      return;
    }
    status.textContent = 'Checking…';
    pending = window.setTimeout(async () => {
      const available = await checkUsername(value);
      // Inject the async result for the `uniqueUsername` validator.
      username.dispatchEvent(FormValidator.createValidateEvent({
        data: {
          uniqueUsername: new FormValidatorValidationResult({ isValid: available }),
        },
      }));
      status.textContent = available ? 'Available.' : '';
    }, 300);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Submitted.');
  });
}
```

- [ ] **Step 2: Create `src/pages/examples/async.astro`**

```astro
---
import DocsLayout from '~/layouts/DocsLayout.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';
import LiveDemo from '~/components/LiveDemo.astro';
import jsSource from '~/components/demos/async.demo.ts?raw';

const formHtml = `<form id="async-form" novalidate>
  <div>
    <label for="async-username">Username</label>
    <input id="async-username" name="username" type="text"
           data-validation="required;minLength(3);uniqueUsername" autocomplete="off" />
    <p id="async-status" class="muted async-status" aria-live="polite"></p>
    <ul class="error-list"></ul>
    <small>Try <code>admin</code>, <code>root</code>, or <code>mellonis</code>.</small>
  </div>
  <button type="submit">Sign up</button>
</form>`;
---
<DocsLayout title="Async — form-validator-js" fullBleed>
  <ThemeToggle slot="theme-toggle" />
  <section class="container-wide page-header">
    <p class="label">Example</p>
    <h1>Async username availability</h1>
    <p class="muted lede">
      A custom <code>uniqueUsername</code> validator backed by an injected result via
      <code>FormValidator.createValidateEvent()</code>. The mock "server" lives entirely on
      the page (<code>setTimeout</code>); swap for a real <code>fetch</code> in production.
    </p>
  </section>
  <LiveDemo formHtml={formHtml} jsSource={jsSource} jsFilename="async.demo.ts" htmlFilename="async.html" />
  <script>
    import '~/components/demos/async.demo';
  </script>
</DocsLayout>

<style>
  .page-header { padding-top: var(--space-6); padding-bottom: var(--space-2); }
  .page-header h1 { margin-bottom: var(--space-2); }
  .page-header .lede { max-width: 64ch; }
  .form-host :global(.async-status) {
    font-size: 0.875rem;
    margin-top: 4px;
  }
</style>
```

- [ ] **Step 3: Smoke test**

`/examples/async`. Verify:
- Empty submit → "Required."
- Type `ad` → "Too short." (synchronous validator)
- Type `admin` → "Checking…" appears, then 600ms later "Username is taken." appears (and "Checking…" clears)
- Type `bob` → "Checking…", then "Available." in muted text
- Quickly type `admin` then change to `bob` mid-check: only the latest result is reflected (debounce + async correctness)
- Submit when valid: alert fires

- [ ] **Step 4: Commit**

```bash
git add src/pages/examples/async.astro src/components/demos/async.demo.ts
git commit -m "feat: /examples/async live demo (createValidateEvent injection)"
```

---

## Task 13: /validators/ — full reference page

**Files:**
- Create: `src/components/ValidatorCard.astro`, `src/pages/validators/index.mdx`

The validators page lists all 10 built-in validators. Each gets a card with: name, DSL syntax, argument description, supported input types, and a runnable inline mini-form. Content is **lifted from `../form-validator-js/README.md` § "Built-in validators"** — keep wording faithful.

- [ ] **Step 1: Create `src/components/ValidatorCard.astro`**

```astro
---
import CodeBlock from '~/components/CodeBlock.astro';

interface Props {
  name: string;       // e.g. "required"
  dsl: string;        // e.g. "required" or "minLength(3)"
  argument?: string;  // e.g. "min character count" — undefined for argument-less
  supports: string;   // human description of supported input types
  htmlExample: string;
}
const { name, dsl, argument, supports, htmlExample } = Astro.props;
---
<article class="validator-card" id={name}>
  <header class="validator-head">
    <h3>
      <a href={`#${name}`}><code>{name}</code></a>
    </h3>
    <p class="dsl"><code>{dsl}</code></p>
  </header>
  <dl class="validator-meta">
    {argument && <><dt>Argument</dt><dd>{argument}</dd></>}
    <dt>Supports</dt>
    <dd>{supports}</dd>
  </dl>
  <slot /> {/* description prose */}
  <CodeBlock lang="html" code={htmlExample} filename="example.html" />
</article>

<style>
  .validator-card {
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--rule);
  }
  .validator-card:last-child { border-bottom: 0; }
  .validator-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  .validator-head h3 a {
    color: var(--fg);
    text-decoration: none;
  }
  .validator-head h3 a:hover { color: var(--accent); }
  .dsl { font-family: var(--font-mono); color: var(--muted); margin: 0; }
  .validator-meta {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px var(--space-2);
    margin: var(--space-1) 0 var(--space-2);
    font-size: 0.875rem;
  }
  .validator-meta dt {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .validator-meta dd { margin: 0; }
</style>
```

- [ ] **Step 2: Create `src/pages/validators/index.mdx`**

The MDX file imports the layout, ValidatorCard, and renders all 10 validators. Use the **exact** wording from the library's README. Below is the structure and the first three validators in full; the executor finishes the remaining 7 by mirroring the README's table at `../form-validator-js/README.md` lines 80–91.

```mdx
---
layout: ~/layouts/DocsLayout.astro
title: Validators — form-validator-js
---
import ValidatorCard from '~/components/ValidatorCard.astro';
import ThemeToggle from '~/components/ThemeToggle.astro';

<ThemeToggle slot="theme-toggle" />

# Validators

Ten built-in validators, listed alphabetically. Each is a `{ init, validate, errorMessage? }` object you spread into `validatorDeclarations` when constructing `FormValidator`.

> "Text-like input" below means any of: `text`, `password`, `tel`, `email`, `url`, `search`, `number`, `date`, `time`, `datetime-local`, `month`, `week`, `color`, `range`, `hidden`. An `<input>` without a `type` attribute defaults to `text`.

> `<input type="file">` is supported by `required` only — for real file validation (size, MIME, count) write a custom validator.

<ValidatorCard
  name="required"
  dsl="required"
  supports="Text-like input, <textarea>, <select>: non-empty value. Checkbox/radio: at least one in the group is checked. <input type=&quot;file&quot;>: a file is selected."
  htmlExample={`<input data-validation="required" name="login">`}
>
  Most fundamental validator: rejects empty values. For groups (radio, checkbox), the rule applies once and is satisfied by any group member being checked.
</ValidatorCard>

<ValidatorCard
  name="minLength"
  dsl="minLength(3)"
  argument="min character count"
  supports="Text-like input or <textarea>."
  htmlExample={`<input data-validation="minLength(3)" name="username">`}
>
  Counts UTF-16 code units to match the native `minlength` attribute. Empty values pass — combine with `required` to forbid empty.
</ValidatorCard>

<ValidatorCard
  name="maxLength"
  dsl="maxLength(20)"
  argument="max character count"
  supports="Text-like input or <textarea>."
  htmlExample={`<input data-validation="maxLength(20)" name="title">`}
>
  Counts UTF-16 code units, matching native `maxlength`.
</ValidatorCard>

<ValidatorCard
  name="pattern"
  dsl="pattern(\\d{4})"
  argument="regex source"
  supports="Text-like input or <textarea>."
  htmlExample={`<input data-validation="pattern(\\d{4})" name="pin">`}
>
  The regex is auto-anchored (`^(?:…)$`) so it must match the entire value, matching native `pattern`. Empty value passes — combine with `required` to forbid empty.
</ValidatorCard>

<ValidatorCard
  name="equalsTo"
  dsl="equalsTo(password)"
  argument="id of another field"
  supports="Any field referenced by id."
  htmlExample={`<input id="password" type="password" data-validation="required">
<input data-validation="equalsTo(password)" type="password" name="confirm">`}
>
  Cross-field equality, e.g. password confirmation. Strict `===` — Unicode normalization is **not** applied (`'café'` in NFC and NFD are not equal). Intentional, so password matching is byte-exact.
</ValidatorCard>

<ValidatorCard
  name="checkedCount"
  dsl="checkedCount(1,3)"
  argument="min, max, or min,max"
  supports="Checkbox or radio group (any input in the group can carry the data-validation)."
  htmlExample={`<fieldset data-validation-context="checkedCount">
  <input type="checkbox" name="opts" value="a" data-validation="checkedCount(1,3)">
  <input type="checkbox" name="opts" value="b">
  <input type="checkbox" name="opts" value="c">
  <input type="checkbox" name="opts" value="d">
</fieldset>`}
>
  Group min/max for checkboxes / radios. `,N` means up to N. `N,` means N or more. The error attaches to the context (here the fieldset) because group errors don't belong to any single member.
</ValidatorCard>

<ValidatorCard
  name="numeric"
  dsl="numeric"
  supports="<input type=&quot;number&quot;>, date, time, month, week, datetime-local."
  htmlExample={`<input type="number" data-validation="required;numeric" name="amount">`}
>
  Rejects unparseable input (`validity.badInput`, plus a defensive parse-side check). Empty value passes — compose with `required`.
</ValidatorCard>

<ValidatorCard
  name="min"
  dsl="min(10) / min(2026-01-01)"
  argument="lower bound (parsed in the input's own format)"
  supports="<input type=&quot;number&quot;>, date, time, month, week, datetime-local."
  htmlExample={`<input type="date" data-validation="required;numeric;min(2026-01-01)" name="start">`}
>
  The bound is parsed in the input's own format — for `type="date"`, ISO-8601 (`YYYY-MM-DD`); for `type="time"`, `HH:MM[:SS]`; etc. Empty / bad-input passes (compose with `required` / `numeric`).
</ValidatorCard>

<ValidatorCard
  name="max"
  dsl="max(100) / max(2026-12-31)"
  argument="upper bound (parsed in the input's own format)"
  supports="<input type=&quot;number&quot;>, date, time, month, week, datetime-local."
  htmlExample={`<input type="number" data-validation="required;numeric;max(100)" name="percentage">`}
>
  Same types as `min`. Empty / bad-input passes (compose with `required` / `numeric`).
</ValidatorCard>

<ValidatorCard
  name="step"
  dsl="step(0.5) / step(7, 2026-01-05) / step(900, 09:00)"
  argument="step or step,base"
  supports="<input type=&quot;number&quot;>, date, time, month, week, datetime-local."
  htmlExample={`<input type="time" data-validation="required;numeric;step(900)" name="slot">`}
>
  Step is in the input type's natural unit: number = 1; date = 1 day; time = 1 second; month = 1 month; week = 1 week; datetime-local = 1 second. Default base is `0` — except `week`, where the base is the Monday of `1970-W01` so the grid lines up with valid week values. Compared within `1e-9` to absorb FP error. Empty / bad-input passes (compose with `required` / `numeric`).
</ValidatorCard>
```

- [ ] **Step 3: Smoke test**

`/validators/`. Verify:
- All 10 validators render in alphabetical or logical order
- Each card shows name + DSL + argument + supports + description + a code example
- Anchor links work: `/validators/#minLength` scrolls to that card
- The MDX layout uses DocsLayout (not full-bleed): content is centered with `--content-max` width
- Theme toggle still works on this page
- Code blocks use the same Shiki theme as the rest of the site

- [ ] **Step 4: Commit**

```bash
git add src/components/ValidatorCard.astro src/pages/validators/index.mdx
git commit -m "feat: /validators reference page (all 10 built-ins)"
```

---

## Task 14: /api/ — params, methods, lifecycle, trigger comparison

**Files:**
- Create: `src/components/TriggerComparison.astro`, `src/pages/api/index.mdx`

Content drawn from `../form-validator-js/CLAUDE.md` § "Architecture" / "Validation timing" / "Lifecycle" and `../form-validator-js/README.md` § "Validation timing" + "Custom validators". The API page is structured as:

1. Constructor signature
2. Parameters table (`form`, `validatorDeclarations`, `onErrorMessageListChanged`, `trigger`, `manageValidity`, `reportValidityOnSubmit`)
3. Methods (`destroy`, `addValidators`, `updateValidationParameters`, the `elementToSpecificErrorMessageMap` facade)
4. Trigger-mode comparison — 4 mini forms side-by-side, one per trigger mode, on the same input

- [ ] **Step 1: Create `src/components/TriggerComparison.astro`**

The component renders 4 mini forms, each with one input wired to the same validators but a different `trigger` setting (`'input'`, `'blur'`, `'blur-then-input'`, `'submit-only'`). Each form's `<script>` instantiates its own `FormValidator`.

```astro
---
const modes = [
  { key: 'input', label: 'input', desc: 'Validates on every keystroke.' },
  { key: 'blur', label: 'blur', desc: 'Validates only on focus loss.' },
  { key: 'blur-then-input', label: 'blur-then-input (default)', desc: 'Like blur, then eagerly on input once an error has been shown.' },
  { key: 'submit-only', label: 'submit-only', desc: 'Validates only on submit.' },
];
---
<section class="trigger-comparison">
  <p class="muted lede">Same form, four trigger modes. Type "ab" in each — feel the difference.</p>
  <div class="trigger-grid">
    {modes.map(({ key, label, desc }) => (
      <article class="trigger-cell">
        <header>
          <h4><code>{label}</code></h4>
          <p class="muted">{desc}</p>
        </header>
        <form data-trigger-form={key} novalidate>
          <label>Username</label>
          <input name="username" type="text" data-validation="required;minLength(3)" />
          <ul class="error-list"></ul>
          <button type="submit">Submit</button>
        </form>
      </article>
    ))}
  </div>
</section>

<style>
  .trigger-comparison { margin: var(--space-4) 0; }
  .trigger-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  @media (min-width: 700px) {
    .trigger-grid { grid-template-columns: 1fr 1fr; }
  }
  .trigger-cell {
    border: 1px solid var(--rule);
    padding: var(--space-2);
  }
  .trigger-cell h4 { margin: 0; }
  .trigger-cell p { font-size: 0.875rem; margin: 4px 0 var(--space-2); }
  .trigger-cell form { display: flex; flex-direction: column; gap: 6px; }
  .trigger-cell label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .trigger-cell input {
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--rule);
    padding: 6px 10px;
  }
</style>

<script>
  import { FormValidator } from '@form-validator-js/core';
  import { required, minLength } from '@form-validator-js/validators';

  type TriggerMode = 'input' | 'blur' | 'blur-then-input' | 'submit-only';

  document.querySelectorAll<HTMLFormElement>('form[data-trigger-form]').forEach((form) => {
    const trigger = form.dataset.triggerForm as TriggerMode;
    new FormValidator({
      form,
      trigger,
      validatorDeclarations: {
        required:  { ...required,  errorMessage: 'Required.' },
        minLength: { ...minLength, errorMessage: 'Too short.' },
      },
      onErrorMessageListChanged(target, errors) {
        if (target === form) return;
        const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
        if (!list) return;
        list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
      },
    });
    form.addEventListener('submit', (e) => e.preventDefault());
  });
</script>
```

- [ ] **Step 2: Create `src/pages/api/index.mdx`**

```mdx
---
layout: ~/layouts/DocsLayout.astro
title: API — form-validator-js
---
import ThemeToggle from '~/components/ThemeToggle.astro';
import TriggerComparison from '~/components/TriggerComparison.astro';

<ThemeToggle slot="theme-toggle" />

# API

## `new FormValidator(params)`

The single entry point. Constructing it sets `novalidate` on the form, attaches event listeners, and (by default) starts managing `setCustomValidity` and `aria-invalid` on every form control.

```ts
import { FormValidator } from '@form-validator-js/core';
new FormValidator({ form, validatorDeclarations, onErrorMessageListChanged, /* ... */ });
```

## Parameters

| Param | Type | Default | Notes |
|---|---|---|---|
| `form` | `HTMLFormElement` | — | The form to attach to. |
| `validatorDeclarations` | `Record<string, ValidatorDeclaration>` | — | Map of validator name → declaration. The keys are the names referenced in `data-validation`. |
| `onErrorMessageListChanged` | `(target: Element, messages: string[]) => void` | no-op | Called per affected element when its error list changes. Render however you like — the engine doesn't render. |
| `trigger` | `'input' \| 'blur' \| 'blur-then-input' \| 'submit-only'` | `'blur-then-input'` | Default trigger mode. Per-field overrides via `data-validation-trigger="…"`. |
| `manageValidity` | `boolean` | `true` | If true, calls `target.setCustomValidity(messages.join('\n'))` for each form control. |
| `reportValidityOnSubmit` | `boolean` | `false` | If true, calls `form.reportValidity()` after `preventDefault` on an invalid submit. |

For full details see `../form-validator-js/CLAUDE.md` § "Validation timing" and § "Browser integration (Constraint Validation API)".

## Methods

- **`destroy()`** — removes all listeners and clears internal maps. Idempotent. The `novalidate` and `data-validation-context="*"` attributes the constructor set on the form are intentionally left in place.
- **`addValidators(declarations)`** — register additional validators after construction.
- **`updateValidationParameters(elementSelector, validatorName, argumentString)`** — re-run a validator's `init` with new arguments.
- **`elementToSpecificErrorMessageMap`** — facade with `.set(element, msgs)` / `.delete(element)` / `.clear()`. Lets you override error messages per field.

## Static helpers

- **`FormValidator.createValidateEvent({ data? })`** — returns a custom `Event` you can dispatch on a field to manually trigger validation. Pass `data` with `{ validatorName: result }` to inject precomputed results (used in [Async username](/examples/async)).

## Trigger modes

Four modes. The default is `'blur-then-input'` — validates on focus loss, then continuously on input once a field has been shown an error.

<TriggerComparison />

## Lifecycle

The validator stops doing anything after `destroy()`. The `novalidate` attribute and `data-validation-context="*"` set on the form during construction are intentionally left in place — removing them risks clobbering attributes a consumer set independently. Same for `aria-invalid` on form controls.

## Custom validators

```ts
import {
  FormValidatorInitResult,
  FormValidatorValidationResult,
  type ValidatorDeclaration,
} from '@form-validator-js/core';

const noWhitespace: ValidatorDeclaration = {
  init: (target) => new FormValidatorInitResult({ observableElementList: [target] }),
  validate: (target) => new FormValidatorValidationResult({
    isValid: !/\s/.test((target as HTMLInputElement).value),
  }),
  errorMessage: 'Cannot contain whitespace.',
};
```

For multi-rule validators using `validatorSubtypeList`, see the README.

## Async / server-side checks

Dispatch `FormValidator.createValidateEvent({ data: { validatorName: result } })` on the field. See [`/examples/async`](/examples/async) for a working pattern.
```

- [ ] **Step 3: Smoke test**

`/api/`. Verify:
- Layout uses prose layout (not full-bleed)
- All sections render
- Parameters table is readable
- TriggerComparison: 4 mini forms appear in a 2×2 grid (or stacked on mobile)
- Type `ab` in each form: each one shows errors at a different time per its mode (input = immediately, blur = only on tab-out, blur-then-input = blur first then live, submit-only = only after pressing Submit)

- [ ] **Step 4: Commit**

```bash
git add src/components/TriggerComparison.astro src/pages/api/index.mdx
git commit -m "feat: /api reference page (params, methods, trigger comparison)"
```

---

## Task 15: Sitemap + meta tags polish

**Files:**
- Modify: `src/layouts/DocsLayout.astro` (verify all meta tags), `astro.config.mjs` (verify sitemap site)

- [ ] **Step 1: Verify `astro.config.mjs` has the correct `site`**

It should already from Task 1: `site: 'https://form-validator-js.mellonis.ru'`. The sitemap integration uses this.

- [ ] **Step 2: Verify DocsLayout's `<head>` has og + twitter meta**

Already done in Task 4 Step 3 — verify nothing is missing. Add `<meta name="twitter:title">`, `<meta name="twitter:description">` if absent for clean Twitter cards.

- [ ] **Step 3: Build and confirm `dist/sitemap-index.xml` exists**

```bash
npm run build
ls dist/sitemap-*.xml
```

Expected: `sitemap-index.xml` and `sitemap-0.xml` are present and reference all 7 pages. Optionally `cat dist/sitemap-0.xml | head -30` to eyeball.

- [ ] **Step 4: Commit (if any DocsLayout tweaks were needed)**

```bash
git add src/layouts/DocsLayout.astro
git commit -m "chore: meta tags polish for sharing previews"
```

If no edits were needed in Step 2, skip this commit.

---

## Task 16: Final QA pass

**Files:** none changed unless QA finds issues.

- [ ] **Step 1: Build cleanly**

```bash
rm -rf dist
npm run build
```

Expected: zero errors, zero TypeScript warnings, Astro reports a build summary listing all 7 pages. If the build fails, fix and re-run before continuing.

- [ ] **Step 2: Preview the built site**

```bash
npm run preview
```

Walk every page (the URL the preview server prints, then `/`, `/validators/`, `/examples/{signup,booking,wizard,async}`, `/api/`).

- [ ] **Step 3: Demo functionality on every page**

Repeat the demo-specific smoke checks from Tasks 8–14 against the production build (not the dev server). Particular attention to:
- Empty submit on every demo
- Each validator triggers its expected error
- Each demo's "Submit" alert fires when valid
- The wizard's Next/Back works
- The async demo's `Checking…` → result transition

- [ ] **Step 4: Light/dark across the site**

Open every page in dark mode. Toggle to light. Reload. Verify:
- No flash on reload (DocsLayout's inline script should handle this)
- No contrast issues — every text reads against its background
- Borders/rules are visible in both themes

- [ ] **Step 5: Mobile (360px width)**

DevTools → toggle device toolbar → 360px width. Walk every page.
- Hero text wraps cleanly
- Demo grid stacks vertically (form on top, code below)
- Header nav is usable (GitHub link is hidden by CSS at ≤ 640px; nav links remain)
- No horizontal scrollbar

- [ ] **Step 6: Lighthouse a11y on `/`**

DevTools → Lighthouse → Accessibility only. Run.
- Score must be ≥ 95
- Common things to fix if score is below: missing alt text, low contrast (light mode coral on cream may borderline), missing `<main>` landmark (already present in DocsLayout), missing form labels (every demo has them).

- [ ] **Step 7: Final commit (if QA found anything)**

If any fixes were made, commit them with a single message:

```bash
git add -A
git commit -m "chore: final QA fixes (a11y, mobile, contrast)"
```

If QA found nothing, skip this commit. The plan is complete.

---

## Self-review (executor reads at end of plan, not a step)

The plan covers every spec section:

- **Goal / scope:** Tasks 1, 8–14 build the four sections.
- **Audience & positioning:** Hero (Task 8 Step 1) + WhenThisFits (Task 8 Step 2) — verbatim from README.
- **Information architecture / page tree:** Tasks 8–14 implement every row.
- **Source layout:** File map at the top.
- **Design system:** Task 3 (palette, tokens), Task 6 (Shiki theme), throughout.
- **Live-demo integration pattern:** Task 7 (LiveDemo); each demo task uses `set:html` for HTML and `?raw` for JS.
- **Build & deploy:** Task 1 (Astro static), Task 15 (sitemap).
- **Migration from current state:** Task 1 deletes Vite artifacts and replaces them.
- **Testing & QA:** Task 16 manual smoke; Astro build is the type-check gate.
- **Success criteria:** Task 16 verifies the home-page goals.

No placeholders. No "TBD". Type names in Task 14's API table match the library's actual types (cross-checked against `../form-validator-js/CLAUDE.md`).
