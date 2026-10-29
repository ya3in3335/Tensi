# Association — members' website

Web version of the members' Android app: news, activities (registration), polls (voting),
lectures and meetings (registration form), volunteering, gallery, donations, notifications,
account (sign-up with e-mail code, phone verification through the Telegram bot).
Arabic (RTL) by default, French available.

It uses the same API as the apps (`ya3in3335/Ges` → `backend/`). The API must list this site's
origin in `ALLOWED_ORIGINS` (backend `wrangler.toml`).

```bash
npm ci
npm test          # unit tests
npm run dev       # local development
npm run deploy    # build + publish to Cloudflare Pages (project "association-web")
```

Optional build variables: `VITE_API_BASE_URL`, `VITE_API_FALLBACK_URLS` (comma-separated).
Security headers (CSP etc.) are in `public/_headers`; SPA routing in `public/_redirects`.
