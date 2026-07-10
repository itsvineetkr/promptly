# Promptly — Frontend

React SPA for the Promptly dashboard: sign up, scrape a website, pick a widget theme, and grab (or live-test) the embed script tag. See the [root README](../README.md) for the full project overview and Docker setup.

## Run locally

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run lint
```

The API base URL is set in `src/lib/api.js` (`http://localhost:1001/api/v1` — the backend's docker-compose port). Change it there if your backend runs elsewhere.

## Stack

- **React 19 + Vite** with `@` aliased to `src/`
- **Tailwind CSS v4** (theme tokens in `src/index.css`) + a few **shadcn/ui** primitives in `src/components/ui/`
- **react-router-dom** for routing, **axios** for API calls

Design language: strict black & white — white background, neutral borders, black primary buttons, monospace uppercase section labels. No gradients.

## Layout

```
src/
├── App.jsx                 # Routes, auth state, route guards
├── index.css               # Tailwind theme (oklch grayscale tokens)
├── lib/api.js              # Axios instance + setAuthToken (JWT header)
├── components/
│   ├── Navbar.jsx          # Sticky nav, auth-aware links, GitHub link
│   └── ui/                 # shadcn/ui primitives (button, input, card, …)
└── pages/
    ├── Home.jsx            # Landing page
    ├── LoginForm.jsx       # Login + shared Spinner/FormError/parseApiError helpers
    ├── SignupForm.jsx      # Registration with auto-login after signup
    ├── Profile.jsx         # View/edit account, logout
    └── Integration.jsx     # Dashboard: scrape, themes, script tag, live widget test
```

## Behavior notes

- **Auth**: the JWT is kept in `localStorage` and applied to axios via `setAuthToken`. `/profile` and `/integrate` redirect to `/login` when logged out; `/login` and `/signup` redirect to the dashboard when logged in. Signing up logs you in immediately.
- **Dashboard** (`Integration.jsx`): the sidebar lists previously scraped sites from `GET /chatbot/websites` — selecting one restores its script tag without re-scraping. Scraping shows an indeterminate progress bar with elapsed time and rotating status messages (scrapes can take minutes).
- **Live widget test**: "Launch test" injects the generated `<script>` into the page so the real chatbot bubble appears bottom-right. Everything the widget adds is tagged with `data-promptly-test` so "Stop test", theme switches, and page navigation clean it up completely.
- **Error handling**: API errors are normalized by `parseApiError` (handles FastAPI `detail` strings and validation arrays, plus network failures) and rendered with the shared `FormError` banner.
