# Modern docs-site rewrite for the form-validator-js demo

*Spec date: 2026-05-10 · author: mellonis (with Claude Code)*

## Goal

Rewrite the current single-page demo at `form-validator-js.mellonis.ru` into a small static docs site that markets the `@form-validator-js/{core,validators}` libraries (v1.0.0, source at `../form-validator-js`). Three goals:

1. Showcase the library's distinctive declarative API — *validation rules in HTML, not JS*.
2. Document every built-in validator and key API surface so a visitor can use the library without leaving the page.
3. Look distinctive for a developer-targeted library — explicitly avoid the "every modern docs site looks the same" trap.

## Scope

### In scope
- Static [Astro](https://astro.build) site with four sections: home, validators reference, examples gallery, API reference.
- Four live-demo forms in the gallery (signup, booking, wizard, async username) plus a trigger-mode comparison on the API page.
- Custom design system in the "technical brutalism" direction — monospace display type, near-black background, single accent color, hard rules.
- Light + dark theme via `prefers-color-scheme` and a manual toggle persisted to `localStorage`.
- Self-hosted webfonts (no Google Fonts CDN at runtime).
- Replacement of the current Vite + vanilla-HTML setup that this repo migrated to earlier in the session.

### Out of scope
- VPS deploy wiring — that lands as a separate change in `../vps` once this site is built.
- Search. Defer until traffic justifies it; [Pagefind](https://pagefind.app) can be added later as a build-time integration.
- i18n.
- An automated test suite. The library is tested at 100% coverage in `../form-validator-js`; this site is content + thin demo wiring.
- Any change to the library itself.
- An editable code playground (option B from the scope brainstorm — explicitly rejected as scope creep).

### Deferred decisions
- Search (yes/no) — revisit once content lands.
- A "Compare with X" page (vs Zod, yup, vee-validate) — content question, not structural; can add later.
- Whether to add a build-time check that the displayed code snippet in each demo matches the form actually being rendered (see *Live-demo integration pattern* → *Risk* below).

## Audience & positioning

The library's [README](https://github.com/mellonis/form-validator-js#when-this-fits-when-it-doesnt) is explicit about its niche, and the site MUST mirror that honesty rather than overselling. Lifted verbatim from the README's *When this fits, when it doesn't* section, this lib is **good for:**

- Server-rendered apps with light JS (Rails/Hotwire, Django, Laravel, plain HTML + HTMX, Alpine).
- No-build static sites.
- Codebases that don't already have a form-state library.

And **not the right tool** if you're on a component framework with state-managed forms (React, Vue, Svelte, Solid) — the README points readers at `react-hook-form` + `zod`, `@tanstack/form` + `valibot`. Schema-first validation with full TypeScript inference fits that world better.

This is the *audience*. Don't dilute the positioning by trying to also speak to React app developers — that fight is already lost on purpose.

**Hero headline:** *"Form validation in HTML. Not in JavaScript."*

**Subtitle:** Declarative `data-*` attribute rules for server-rendered apps, HTMX/Alpine, and no-build static sites.

This positioning is locked. Two alternatives were considered and rejected during brainstorming:
- *"Validation that speaks the platform's language"* (a11y / native APIs angle) — credible but narrower; wins a smaller crowd.
- *"Ten validators. Zero ceremony."* (catalog angle) — safe but undifferentiated; every competitor has 10+ validators.

Every section of the site reinforces the declarative-HTML angle, scoped to the right audience.

## Information architecture

### Pages

| Path | Purpose | Format |
|------|---------|--------|
| `/` | Hero + 1 inline live demo (signup) + **"When this fits, when it doesn't"** (verbatim from README) + footer | `.astro` |
| `/validators/` | All 10 built-in validators, one block each: name, signature, description, runnable example | `.mdx` |
| `/examples/signup` | Full-page live demo: signup with `required` + `minLength` + `pattern` + `equalsTo` | `.astro` |
| `/examples/booking` | Full-page live demo: dates/times with `numeric`, `min`, `max`, `step` | `.astro` |
| `/examples/wizard` | Full-page live demo: multi-step with `data-validation-context` per step | `.astro` |
| `/examples/async` | Full-page live demo: async username availability via `createValidateEvent` injection | `.astro` |
| `/api/` | `FormValidator` constructor params, methods, lifecycle, trigger-mode comparison (4 forms side-by-side) | `.mdx` |

### Navigation

- **Header.** Sticky top. Logo (`form-validator-js`, links to `/`). Nav links: *Validators*, *Examples*, *API*. Right side: GitHub link, theme toggle.
- **Sidebar.** Auto-generated from page headings on `/validators/` and `/api/` only, using Astro's heading-extraction. The home page and `/examples/*` pages render full-bleed without a sidebar — they're the visual showcases, not reference material.
- **Footer.** Version (pulled from lib `package.json` at build time), MIT license badge, GitHub link, author credit.

### Source layout

```
src/
├── pages/
│   ├── index.astro
│   ├── validators/index.mdx
│   ├── examples/{signup,booking,wizard,async}.astro
│   └── api/index.mdx
├── layouts/
│   └── DocsLayout.astro          # header + (optional) sidebar + content + footer
├── components/
│   ├── Hero.astro
│   ├── LiveDemo.astro            # form + html-snippet + js-snippet triplet
│   ├── ValidatorCard.astro       # one validator's reference block
│   ├── CodeBlock.astro           # Shiki wrapper with custom theme + copy button
│   ├── ThemeToggle.astro         # client-side theme switcher
│   └── Header.astro
├── styles/
│   └── global.css                # design tokens + base styles
└── lib/
    └── theme.ts                  # localStorage + prefers-color-scheme handling
public/
└── fonts/                        # self-hosted woff2 (Inter, JetBrains Mono)
```

## Design system

### Palette

| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `--bg` | `#0a0a0a` | `#fafaf7` | Page background |
| `--fg` | `#e5e5e5` | `#0a0a0a` | Body text |
| `--accent` | `#f69e7b` | `#f69e7b` | Coral; links, primary CTAs, code keywords. Continuity with current brand. |
| `--muted` | `#71717a` | `#71717a` | Labels, metadata, comments in code |
| `--rule` | `#262626` | `#e7e5e4` | 1px separators |
| `--error` | `#f87171` | `#dc2626` | Invalid-input state in demos |

Deliberately small palette — brutalism depends on restraint.

### Typography

- **Display (h1, h2, hero).** `JetBrains Mono` 700, tight letter-spacing (`-0.02em`).
- **Section headings (h3, h4).** `JetBrains Mono` 500.
- **Body.** `Inter` 400, with `font-feature-settings: "ss01"` for the alternate single-storey `a`. `Inter` 500 for emphasis.
- **Code.** `JetBrains Mono` 400.

Both fonts are self-hosted as `woff2` in `public/fonts/`, Latin subset only, declared with `font-display: swap`.

### Geometry

- 8px base spacing unit. All padding/margin use multiples.
- Hard 1px rules (`var(--rule)`) for separators. No `box-shadow`.
- Square corners except buttons (4px radius).
- Content max-width: `72ch` for prose pages (`/validators/`, `/api/`), full width with a 64px desktop gutter (24px mobile) for `/examples/*` and the home hero.

### Code highlighting

Shiki via Astro's built-in syntax highlighter. Custom theme with a three-color palette: `--accent` for keywords and operators, `--muted` for comments, `--fg` for everything else. No rainbow — code reads as part of the page, not as a separate visual layer.

### Motion

- 150ms hover transitions on links and buttons.
- No page transitions, no scroll-triggered animation.
- Demo forms validate instantly. That's the library's job, not the design's.

## Live-demo integration pattern

Every `<LiveDemo />` is the same triplet:

```
┌─────────────────┬─────────────────┐
│  Working form   │  HTML snippet   │
│  (real          │  (highlighted,  │
│  FormValidator) │  copy button)   │
│                 ├─────────────────┤
│                 │  JS snippet     │
│  [Reset]        │  (highlighted,  │
│                 │  copy button)   │
└─────────────────┴─────────────────┘
```

Mobile (≤ 768px): stacks vertically — form on top, code below.

### Implementation contract

Each demo is its own `.astro` component. Each demo has exactly **one source for its HTML** and **one source for its JS** — Astro renders both twice (once executed, once displayed) so the snippet visitors copy is literally the code that's running.

**HTML — one string constant:**

```astro
---
const formHtml = `<form>
  <input data-validation="required" name="login">
  <ul class="error-list"></ul>
  ...
</form>`;
---
<div set:html={formHtml} /> {/* renders the form */}
<CodeBlock lang="html" code={formHtml} /> {/* shows the source */}
```

**JS — one `.ts` file imported two ways:**

The demo's runtime logic lives in a sibling file (e.g. `src/components/demos/signup.demo.ts`) that imports `@form-validator-js/{core,validators}` and instantiates `new FormValidator({…})` against the form. The same file is imported by the `.astro` component twice:

```astro
---
import './demos/signup.demo';                   // executes the demo
import jsSource from './demos/signup.demo?raw'; // reads the file's text for display
---
<CodeBlock lang="ts" code={jsSource} />
```

Astro inherits Vite's `?raw` import suffix, which resolves to the file's source as a string at build time. One file, two views.

**Error rendering** uses `onErrorMessageListChanged` to append errors into a sibling `<ul class="error-list">` — the same pattern `src/main.js` uses today.

### Risk

If a demo's code is ever copy-pasted between the runtime source and a separate display string, the displayed snippet and the running code can drift — a credibility-destroying outcome for a docs site. **Mitigation:** the one-source-imported-twice pattern above (`set:html` for HTML, `?raw` for JS). If it's ever broken, add a build-time check that compares the rendered form's `outerHTML` to the displayed HTML snippet — *deferred until at least one demo is built; the pattern alone should be enough.*

## Build & deploy

- **Output.** `output: 'static'`. `npm run build` produces `dist/` of pre-rendered HTML, CSS, woff2, and minimal client JS (the form-validator-js library plus per-demo init script).
- **Astro version.** Latest stable at build time, pinned via `^`. As of 2026-05, that is roughly Astro 5.x — verify at install.
- **Integrations.** `@astrojs/mdx` (for `/validators/` and `/api/` pages). `@astrojs/sitemap` for cheap SEO.
- **Deploy.** Static `dist/` served by nginx via the workspace's VPS pattern, same as `mellonis.ru`, `mines.mellonis.ru`, `demo.machines.mellonis.ru`. **Wiring is a separate change in `../vps` and out of scope for this spec.**

## Migration from current state

Current state (after the Vite migration completed earlier in this session):

| Current | After rewrite |
|---------|---------------|
| `/index.html` (Vite entry at root) | Replaced by `src/pages/index.astro` |
| `/src/main.js` | Logic moves into `<LiveDemo />` for the home page's signup form |
| `/src/styles/main.css` | Folded into `src/styles/global.css` as a base layer; brutalist tokens replace the cream-on-indigo aesthetic |
| `package.json` `vite` devDep | Swapped for `astro`, `@astrojs/mdx`, `@astrojs/sitemap` |
| Scripts `dev` / `build` / `preview` | Map directly: `astro dev` / `astro build` / `astro preview` |

`@form-validator-js/{core,validators}` v1.0.0 remain the only runtime dependencies.

`package-lock.json` will be regenerated on `npm install` after the dependency swap.

## Testing & QA

- **No automated test suite.** Rationale: the library is tested at 100% coverage in `../form-validator-js`; this site is content + thin demo wiring. The cost of an automated suite outweighs the benefit at this scale.
- **Build is the type-check / integrity gate.** Astro's build fails on broken imports, TypeScript errors, and invalid frontmatter. CI (if added later) = `astro build`.
- **Manual smoke test before merging:**
  - Every page in the page tree loads with no console errors.
  - Every live demo validates correctly: deliberately invalid inputs trip errors; valid inputs pass.
  - Light/dark toggle works and persists across reloads.
  - 360px mobile width doesn't break any layout.
  - Lighthouse a11y score ≥ 95 on the home page. (The library already manages `aria-invalid` and `setCustomValidity`; the site contributes the rest — landmarks, headings, contrast.)

## Success criteria

A visitor lands on `/`, reads the headline, scrolls through one live demo, and within 60 seconds can answer:

1. *What does this library do?* — HTML-driven form validation.
2. *Is this for me?* — the "When this fits, when it doesn't" block tells them yes (server-rendered/HTMX/static) or no (React/Vue/Svelte/Solid → use react-hook-form + zod) without them having to read further. **A React-app visitor leaves quickly with a clear answer**, which is a feature, not a failure.
3. *How would I use it?* — a working, copyable snippet is right there.
4. *Where do I learn more?* — visible top nav: Validators / Examples / API.

The `/validators/` page documents all 10 built-in validators with runnable examples. The `/api/` page shows the `FormValidator` constructor signature, all params (`trigger`, `manageValidity`, `reportValidityOnSubmit`), lifecycle methods (`destroy`, `addValidators`, `updateValidationParameters`), and the four trigger modes side-by-side.

## Related

- **Library source:** `../form-validator-js` (npm-workspaces monorepo, TypeScript).
- **Library reference:** `../form-validator-js/CLAUDE.md` is the authoritative reference for the validator contract, trigger model, lifecycle, and accessibility behavior. Any API question for this site should be resolved there before guessing here.
- **Library README:** `../form-validator-js/README.md` (~16KB) — much of its content informs the validators reference and API pages of this site.
