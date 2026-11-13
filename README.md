# England North Volleyball website

The live site for England North Volleyball, hosted on Netlify.

- Programme cards, dates, prices and places live in the `CONFIG` block at the top of `site/app.js`.
- Page text and layout are in `site/index.html`. The privacy notice is `site/privacy.html`.
- Security headers are in `site/_headers`.
- Every change saved to the `main` branch publishes to the live site automatically.

Changes are made through Claude and published automatically by Netlify.

After changing `CONFIG` in `site/app.js`, run `python3 tools/prerender.py` before committing. It writes the programme cards and Google event data into `site/index.html` so search engines can read them, and refreshes `robots.txt` and `sitemap.xml`. When the domain changes, update `SITE_URL` in that script and the canonical/og tags in `site/index.html`.
