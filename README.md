# Vue 3 + Bootstrap + XLSX Demo

Lightweight frontend-only scaffold using Vite, Vue 3, Bootstrap and FontAwesome. Includes example support for saving to `localStorage` and importing/exporting JSON and XLSX files.

Quickstart

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the printed URL (usually http://localhost:5173)

Run / Build / Serve

- Install dependencies:

```bash
npm install
```

- Start development server (hot reload):

```bash
npm run dev
```

- Build production (output goes to `docs/` for GitHub Pages):

```bash
npm run build
```

- Preview production build locally (optional):

```bash
npm run preview
# or with a static server:
npx serve -s docs -l 5000
```

Notes

- JSON import/export and Excel import/export are implemented in `src/components/DataManager.vue` using `xlsx`.
- Bootstrap and FontAwesome are imported in `src/main.js`.

Requirements

- Node.js 16+ (LTS) and `npm` (or use `yarn`/`pnpm` if you prefer).
- Recommended package manager: `npm` (commands in this README use `npm`).

Recommended VS Code extensions and tools

- **Volar**: Vue 3 language support (preferred over Vetur for Vue 3).
- **ESLint**: linting support (if you add ESLint config later).
- **Prettier**: code formatting.
- **GitLens**: helpful Git integration.
- **Vite** (helper extensions) — optional.

Publishing to GitHub Pages

This scaffold outputs a production build into the `docs` folder, which makes it easy to publish on GitHub Pages from the `main` branch (Repository Settings → Pages → Source: `main` / `docs` folder).

Typical publish flow:

```bash
npm run build
git add docs
git commit -m "chore: build for github pages"
git push origin main
# then enable Pages in the repo settings (or confirm it's enabled)
```

Notes:
- The Vite config uses a relative `base: './'` so the app works when served from the `docs` folder or from a subpath. If you prefer serving from a repository subpath (like `https://username.github.io/repo/`), set `base: '/repo/'` in `vite.config.js` before building.
- If you'd rather publish via a `gh-pages` branch, remove `outDir: 'docs'` and use a deploy tool like `gh-pages` or GitHub Actions.

