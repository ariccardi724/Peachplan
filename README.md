# Glute & Lean Mass Plan

A mobile-first workout tracker for the 12-week glute and lean mass hypertrophy plan.
Day and week views, set-by-set logging, rest timer, drag-to-reorder, swaps, PR badges,
and a one-page PDF export (weekly log and lift trends).

Your logs are saved in your browser (localStorage) on the device you use.
Clearing site data erases them.

## Run it locally

```bash
npm install
npm run dev
```

## Put it online with GitHub Pages

1. Create a new GitHub repository and push this folder to the `main` branch.
2. In the repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push again (or run the workflow from the **Actions** tab). Your site appears at
   `https://<your-username>.github.io/<repo-name>/`.
4. On your phone, open that link and choose **Add to Home Screen** to use it like an app.

## Notes

- Set your program start date in the app's Settings so it opens on today's workout.
- PDF export is built in the browser. If a download is blocked, use "Open in new tab".
- Data lives per device and per browser. There is no account or sync.

## App icon

Icons live in `public/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
`apple-touch-icon.png`, `favicon.png`). To change the icon, replace those files
(keep the same names and sizes) and push.
