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

The repository is also connected to Cloudflare Workers Builds: each push runs `npm run build` then
`npx wrangler deploy`, which publishes `dist/` as static assets of the Worker "tensi" (see `wrangler.jsonc`;
unknown paths fall back to `index.html` for client-side routing).

```bash
```

Optional build variables: `VITE_API_BASE_URL`, `VITE_API_FALLBACK_URLS` (comma-separated).
Security headers (CSP etc.) are in `public/_headers` (used by both Pages and Workers).

## Android app download

The landing page offers the latest members' APK (`public/downloads/association-members.apk`) with its
version, size, date and SHA-256 from `public/app-latest.json`, plus a QR code (`public/img/apk-qr.svg`).
To publish a new build: `node scripts/update-apk.mjs path/to/app.apk <version>` then `npm run deploy`.
