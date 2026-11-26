# Fémini · Team Shift Schedule

Live shift dashboard: who's on duty now, daily timeline, weekly report, personal schedule cards (saved as PNG), and full manager control behind a PIN.

## Features
- **Live**: who's on shift / on break / off right now (Cairo time).
- **Weeks**: create any week from the default template, a copy of the previous week, or empty — then edit every day, add or remove people for that week, and add extra shifts.
- **Images**: save the weekly report or each person's schedule card as a PNG (or share directly from a phone).
- **Default template**, team roster, break rules, backup/restore.

## Deploy on Vercel
1. Import this repo into Vercel (Framework preset: **Other**).
2. Storage → Create **Blob** store → connect it to the project (adds `BLOB_READ_WRITE_TOKEN`).
3. Settings → Environment Variables → add `ADMIN_PIN`.
4. If the Blob store is **public**, also add `BLOB_ACCESS=public`.
5. Redeploy.

## Files
- `index.html` — the whole dashboard (UI + schedule engine + image export).
- `api/schedule.js` — reads/saves the schedule in Vercel Blob (keeps the last 15 versions as backups).
- `assets/` — Fémini logos, bundled fonts, html-to-image.
