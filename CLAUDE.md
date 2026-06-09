# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal repository for tracking Claude-related projects. It is a monorepo-style
collection where each project lives in its own top-level directory with self-contained
tooling. There is no shared build system, workspace manager, or root-level dependency setup —
each subproject is built and run independently.

## Repository Layout

```
/
├── README.md              # Repo-level placeholder
├── CLAUDE.md              # This file
└── finance-dashboard/     # Thai personal finance dashboard (React + Vite)
```

When adding a new project, create a new top-level directory for it with its own
package manager / build tooling, and add a section below describing how to build,
run, and test it.

## Projects

### finance-dashboard

A client-side personal finance ("บัญชีการเงินส่วนตัว") dashboard for tracking income and
expenses. The entire UI is in Thai, with Thai Baht (THB) currency formatting and Buddhist-era
year display. Data is persisted to the browser's `localStorage` — there is no backend, server,
database, or user accounts.

**Tech stack:**
- React 19 (`react`, `react-dom`)
- Vite 8 as the dev server / bundler (`@vitejs/plugin-react`)
- Recharts 3 for the bar chart visualization
- ESLint 10 (flat config) with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- Plain CSS (no CSS framework or preprocessor); the Sarabun web font is loaded from Google Fonts
- ES modules (`"type": "module"`); JavaScript + JSX (no TypeScript)

**Commands** (run from inside `finance-dashboard/`):
```bash
npm install      # install dependencies
npm run dev      # start Vite dev server with HMR
npm run build    # production build to dist/
npm run preview  # preview the production build locally
npm run lint     # run ESLint over the project
```

There is **no test framework** configured. `npm run lint` is the only automated check.

**Architecture:**
- `src/main.jsx` — entry point; mounts `<App />` in React `StrictMode`.
- `src/App.jsx` — the entire application. All components live in this single file:
  - `App` — top-level state owner. Manages the transaction list, the active tab
    (`dashboard` / `add` / `monthly`), the add-transaction form, and the month filter.
  - `Dashboard` — summary cards, the 6-month income/expense bar chart, and recent transactions.
  - `AddForm` — controlled form for adding an income or expense transaction.
  - `Monthly` — month-picker filtered view of transactions with per-month totals.
  - `TransactionList` / `SummaryCard` — presentational sub-components.
- `src/App.css` — all component styles. `src/index.css` — global/reset styles.
- `index.html` — Vite HTML entry; sets `lang="th"`, the page title, and loads the Sarabun font.

**Key patterns and conventions:**
- **State lives in `App`** and is passed down via props; there is no Context, Redux, or
  external state library. Child components are stateless except for local form interactions.
- **Persistence** is via a small `useLocalStorage(key, initial)` hook in `App.jsx`. Transactions
  are stored under the `fin_txns` key. The hook reads lazily on mount and writes on every change.
- **Transaction shape:** `{ id, type, amount, category, note, date }` where `type` is
  `'income'` or `'expense'`, `amount` is a positive `Number`, and `date` is an ISO `YYYY-MM-DD`
  string. `id` is generated with `Date.now()`.
- **Categories** are hard-coded in the `CATEGORIES` constant, keyed by `type`. Add new categories
  there (in Thai) rather than introducing a separate config.
- **Derived data** (totals, monthly aggregation, filtered lists) is computed with `useMemo` from
  the transaction list — never stored as separate state.
- **Localization:** money is formatted with `formatMoney` (`Intl.NumberFormat` `th-TH` / `THB`);
  month labels use the Thai `MONTH_NAMES` array and convert Gregorian years to the Buddhist era
  (`year + 543`). Keep new UI strings in Thai to match the existing experience.
- **Styling:** className-based CSS in `App.css`, with a few inline `style` props for
  dynamic/computed values (e.g. colors that depend on whether a balance is positive). Follow
  this split — static styling in CSS classes, only truly dynamic values inline.

## Conventions (repository-wide)

- Each project is self-contained; do not add a root-level `package.json` or shared tooling
  unless the repository genuinely moves to a workspace setup.
- Keep this file up to date as projects are added, removed, or significantly restructured.
</content>
