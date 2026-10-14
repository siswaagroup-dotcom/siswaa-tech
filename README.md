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
assets/styles.css All styles, light and dark themes
assets/*.png/ico  Logo, icons, link-preview image
vercel.json       Clean URLs and caching on Vercel
netlify.toml      Publish settings and caching on Netlify
```
