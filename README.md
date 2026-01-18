# SoEngaged - A Simple But Powerful Wedding Planner

Lightweight frontend-only wedding planner app using Vite, Vue 3, Bootstrap and FontAwesome. Includes example support for saving to `localStorage` and importing/exporting JSON and XLSX files.

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

- Build production:

```bash
npm run build
```

- Preview production build locally (optional):

```bash
npm run preview
# or with a static server:
npx serve -s dist -l 5000
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

This project is configured to deploy automatically via **GitHub Actions** (see `.github/workflows/deploy.yml`). 

### Deployment Steps:
1. Push your changes to the `main` branch.
2. Go to your GitHub Repository **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.

The site will be deployed automatically whenever you push to `main`.

