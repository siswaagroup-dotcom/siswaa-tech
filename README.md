# Siswaa Technologies website

The one-page site for [tech.siswaa.com](https://tech.siswaa.com): website plans from ₹399/month, app and full-stack builds, and care and revamp work.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Before going live

Edit `assets/config.js`:

| Setting | What to put |
| --- | --- |
| `whatsappNumber` | Your WhatsApp number with country code, digits only, e.g. `919876543210` |
| `whatsappDisplay` | How it shows on the page, e.g. `+91 98765 43210` |
| `bookingUrl` | Calendly or Google Calendar booking link, or leave `''` to book calls over WhatsApp |
| `email` | Contact email |

Until a real number is set, WhatsApp buttons scroll to the contact form and the form falls back to email.

Also worth doing:

- Founder photos: add `assets/atul.jpg` and `assets/abhishek.jpg`, then follow the comment above each founder card in `index.html`.
- Founder descriptions: edit the one-line bios in the founders section of `index.html`.
- Have the Terms page (`terms.html`) checked against your client agreement.

## Deploy

**Vercel:** New Project → import this repo → Framework preset "Other" → no build command, output directory `.` → Deploy.

**Netlify:** Add new site → import this repo → leave build command empty, publish directory `.` → Deploy.

Then add the custom domain `tech.siswaa.com` in the host's domain settings and create the DNS record it asks for (usually a CNAME) at your domain registrar.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

```
index.html        Home page
privacy.html      Privacy page (/privacy)
terms.html        Terms page (/terms)
404.html          Not-found page
assets/config.js  WhatsApp number, booking link, email
assets/main.js    Theme toggle, pricing toggle, WhatsApp links, enquiry form
assets/theme-init.js  Applies the saved light/dark choice before the page paints
assets/styles.css All styles, light and dark themes
assets/fonts/     Self-hosted fonts (subset), with their licences
assets/*.webp/png Logo, icons, Easipaper screenshot, link-preview image
site.webmanifest  App name and icons for phones
.well-known/security.txt  Where to report a security issue
vercel.json       Security headers and caching on Vercel
netlify.toml      Security headers and caching on Netlify
```

## Security

`vercel.json` and `netlify.toml` send these headers on every page:

- **Content-Security-Policy:** only this site's own scripts, styles, fonts and images can load. No inline scripts or `style="…"` attributes are allowed, so keep all CSS in `assets/styles.css` and all JS in `assets/*.js`. If you add an outside service (analytics, a chat widget, an embedded map), add its domain to the policy in both files or it will be blocked.
- **Strict-Transport-Security**, **X-Content-Type-Options**, **X-Frame-Options** (no embedding in other sites), **Referrer-Policy**, **Permissions-Policy** (camera, mic, location, payments off).

The site has no backend, database, cookies or trackers. The enquiry form never sends data anywhere; it opens WhatsApp with the message filled in.

After deploying, check the headers at https://securityheaders.com and https://observatory.mozilla.org.

## SEO

Already in place: title and description, canonical URLs, Open Graph and Twitter cards, structured data (Organization, WebSite, service with plan prices, FAQ), `sitemap.xml`, `robots.txt`, web manifest, and fast loading (Lighthouse 99–100 on mobile and desktop).

To do after going live:

1. **Google Search Console:** add `tech.siswaa.com`, verify it (DNS record is easiest), and submit `https://tech.siswaa.com/sitemap.xml`.
2. **Google Business Profile:** create one for Siswaa Technologies. It matters more than anything else for local searches like "website designer near me".
3. **Link from siswaa.com:** make the Siswaa Technologies card on the group site link to `https://tech.siswaa.com`. Do the same from Easipaper's footer ("Built by Siswaa Technologies").
4. **Test the share preview:** paste the URL into https://www.opengraph.xyz and check the structured data at https://search.google.com/test/rich-results.
5. When you add pages later (a page per service or per city), add them to `sitemap.xml` and give each its own title, description and canonical.
