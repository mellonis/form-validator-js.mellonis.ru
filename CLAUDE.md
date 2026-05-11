# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A small, single-page **demo** of the author's own `@form-validator-js/*` libraries (`core` + `validators`, pinned at `1.0.0`). It is not the library source — it consumes the libraries from npm and shows how to wire them into a plain HTML form. The whole app is `index.html` (at project root, the Vite entry) + `src/main.js` + a single `src/styles/main.css`. No tests, no lint, no framework.

## Commands

- `npm run dev` — Vite dev server (HMR).
- `npm run build` — production build → `dist/`.
- `npm run preview` — serve the built `dist/` locally.
- `npm test` — placeholder; exits 1. There is no test suite.

## How the demo wires the library

`src/main.js` is the entire integration. The pattern to preserve when editing:

1. **Declarative validators on inputs** via `data-validation="..."` in `index.html`. The current form uses `required` and `equalsTo(password)` — `equalsTo` takes the *name* of another field as its argument.
2. **`new FormValidator({ form, validatorDeclarations, onErrorMessageListChanged })`** is the single entry point from `@form-validator-js/core`. Validators imported from `@form-validator-js/validators` are spread into `validatorDeclarations` together with a per-validator `errorMessage` override.
3. **Rendering errors is the consumer's job.** `onErrorMessageListChanged(target, errorList)` fires per-field; `target` is the input element. The demo finds the sibling `<ul class="error-list">` via `target.nextElementSibling` — so the DOM shape `<input> + <ul class="error-list">` inside `.form__value` is a contract `main.js` relies on. Changing the markup without updating the render function will silently break error display.
4. Adding a new field = add the `<input data-validation="...">` + sibling `<ul class="error-list">` in the HTML, register any new validator under `validatorDeclarations`, and (if submitting) add the field name to the `reduce` array in the submit handler.

## Styling

Plain CSS with native nesting and CSS custom properties for the theme (`--color1`…`--color4` on `:root`, `--key-width` scoped to `.form`). BEM-style class names (`form__row`, `form__input_error`, etc.) — note that native CSS nesting **cannot** concatenate BEM segments the way SCSS's `&__row` did, so BEM names live as flat top-level rules; only pseudo-class / state nesting (`&:active`, `&:not(:last-of-type)`) is nested. Error state is toggled by `main.js` adding/removing `form__input_error` on the input.
