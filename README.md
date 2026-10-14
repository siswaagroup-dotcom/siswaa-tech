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

## Chat assistant (AI)

The "Ask us" button opens a chat that answers questions about plans, prices, apps and timelines, then hands visitors to WhatsApp with a summary of what they asked.

- **With an API key:** answers come from Google Gemini through `api/chat.js`: `gemini-3.5-flash-lite` first (about 1 second), and `gemini-3.8-flash` automatically if the first is busy or slow.
- **Without a key, or if Gemini fails or runs out of quota:** answers come from the FAQ in `assets/chat-knowledge.json`, inside the browser. `python3 -m http.server` always uses this mode, because it can't run the server function.

**Test the real AI on your computer:**

1. Copy `.env.example` to `.env.local` and paste your key after `GEMINI_API_KEY=`. Git ignores `.env.local`, so the key never reaches GitHub.
2. Run `npm run dev` in this folder (no install needed) and open http://localhost:3000.
3. The terminal says "Chat: real AI" when the key is loaded. Stop with Ctrl+C; restart after changing `.env.local`.

**Turn on the AI (5 minutes):**

1. Go to https://aistudio.google.com/apikey, sign in, and create an API key.
2. In Vercel: your project → Settings → Environment Variables → add `GEMINI_API_KEY` with that key (Production and Preview).
3. Redeploy (Deployments → ⋯ → Redeploy). Open the site and ask the chat something.

Optional settings: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), `GEMINI_FALLBACK_MODEL` (default `gemini-3.8-flash`) and `ALLOWED_ORIGINS` (extra domains allowed to use the chat, comma-separated). Google sometimes returns "high demand" errors; the backup model and the FAQ fallback cover that.

**Changing what the bot knows:** edit `assets/chat-knowledge.json` (prices, plans, FAQ answers) and push. Both the AI and the FAQ fallback read it, so they always agree. Keep `keywords` on each FAQ entry; the fallback uses them to match questions.

**Safeguards:** the key is only in Vercel's settings; the function only answers requests from your own domain, caps messages at 500 characters and 12 turns, limits each visitor to 20 messages per 10 minutes, gives up after 25 seconds, and is told to use only the facts in the knowledge file and to refuse unrelated requests. The per-visitor limit is per server instance; if you ever see abuse, add a shared limit with Upstash Redis.

**Privacy:** on Gemini's free tier, Google may use prompts to improve its products. The chat tells visitors not to share sensitive details, and the Privacy page explains it. Turning on billing for the key (paid tier) stops that.

## Deploy

**Vercel:** New Project → import this repo → Framework preset "Other" → no build command, output directory `.` → Deploy.

**Netlify:** Add new site → import this repo → leave build command empty, publish directory `.` → Deploy.

Then add the custom domain `tech.siswaa.com` in the host's domain settings and create the DNS record it asks for (usually a CNAME) at your domain registrar.

## Run locally

```
npm run dev
```

Then open http://localhost:3000. This runs the site with its real security headers and the AI chat (see above). `python3 -m http.server 8000` also works, but the chat then uses FAQ answers only.

## Files

```
index.html        Home page
privacy.html      Privacy page (/privacy)
terms.html        Terms page (/terms)
404.html          Not-found page
assets/config.js  WhatsApp number, booking link, email
assets/main.js    Theme toggle, pricing toggle, WhatsApp links, enquiry form
assets/chat.js    Chat assistant widget (AI answers, FAQ fallback, WhatsApp handoff)
assets/chat-knowledge.json  Everything the chat assistant knows: plans, prices, FAQ
api/chat.js       Vercel server function that asks Google Gemini (keeps the API key secret)
assets/theme-init.js  Applies the saved light/dark choice before the page paints
assets/styles.css All styles, light and dark themes
assets/fonts/     Self-hosted fonts (subset), with their licences
assets/*.webp/png Logo, icons, Easipaper screenshot, link-preview image
site.webmanifest  App name and icons for phones
.well-known/security.txt  Where to report a security issue
dev-server.js     Local server with the AI chat (npm run dev); not deployed
.env.example      Template for .env.local, where your Gemini key goes locally
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
