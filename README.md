# StripKit Website

> Version 0.6.0 · last-updated 2026-06-04

The marketing and download landing page for **StripKit** — a desktop tool that turns a
single transparent PNG into animated **filmstrip** sprite sheets for audio-plugin GUI
controls (knobs, faders, sliders, meters). This repo is the public site for
**[stripkit.pro](https://stripkit.pro)**; the app itself lives in a separate repo,
[`Vybecode-LTD/stripkit`](https://github.com/Vybecode-LTD/stripkit).

This README is the maintenance guide for whoever (human or agent) keeps the site running.

---

## What it is

A **static, dependency-free** site: plain HTML, one CSS file, and a few small vanilla-JS
files. There is **no build step**, no framework, no bundler, no `package.json`, no
`node_modules`. You edit files and they ship as-is.

- **Theme:** a medium-light design. All design tokens are CSS custom properties in the
  `:root` block of `css/style.css`. Key ones:
  - `--bg: #eceef3` (page background) / `--bg-2: #e3e6ec`
  - `--surface: #ffffff`, `--surface-2: #f6f7fa`
  - `--text: #1b1f27`, `--text-2: #4d5560`, `--muted: #79828f`
  - `--accent: #e8440a` (StripKit orange) / `--accent-hi: #ff5a1e` / `--accent-ink: #b8350a`
  - Changelog tag colours: `--new: #1f9d57` (green) · `--fix: #2f6fed` (blue) ·
    `--improved: #e8440a` (orange)
  - `--radius: 16px`, `--shadow-sm/md/accent`, `--maxw: 1120px`
  - `--font`: system sans-serif stack (`system-ui, -apple-system, "Segoe UI", Roboto, …`)
- The site is **passive**: it reads the live GitHub Release for download links/version
  and a curated local `updates.json` for the changelog. Shipping a new app release does
  **not** require redeploying this site (with one manual exception — see
  [Adding a changelog entry](#adding-a-changelog-entry-the-one-manual-step)).

---

## File map

```
StripKit-Website/
├── index.html          # Landing page: hero, features, download, recent changelog (3)
├── changelog.html      # Full changelog (all versions from updates.json)
├── privacy.html        # Privacy Policy (static copy)
├── terms.html          # Terms of Service (static copy)
├── contact.html        # Contact form (Formspree)
├── updates.json        # ← Curated, user-facing changelog feed (THE manual edit per release)
├── favicon.ico         # Site favicon (multi-resolution .ico)
├── css/
│   └── style.css       # All styling + the :root theme tokens
├── js/
│   ├── download.js     # Fetch latest GitHub Release → wire download buttons/version/VT link
│   ├── changelog.js    # Render updates.json into the timeline(s)
│   ├── contact.js      # AJAX-submit the contact form to Formspree
│   └── main.js         # Footer year + scroll-reveal animations
├── resources/
│   ├── screenshot.png    # Hero app screenshot (swap this when the UI changes)
│   ├── stripkit-icon.png # App icon — header/footer marks + apple-touch-icon
│   ├── stripkit-logo.png # Full StripKit wordmark/logo (present; not referenced by current pages)
│   └── vybeco-logo.png   # VybeCode maker logo (footer "Made by")
├── .gitignore
└── README.md           # This file
```

### Pages and their purpose

| Page             | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `index.html`     | Hero (headline + download CTA + VirusTotal shield + OSS badge), 9-card feature grid, dark download card, and the 3 most recent changelog entries. Loads all three scripts. |
| `changelog.html` | The full release history (every entry in `updates.json`). Loads `changelog.js` + `main.js`. |
| `privacy.html`   | Privacy Policy. Static prose; "no telemetry / static site / GitHub-served downloads".   |
| `terms.html`     | Terms of Service. Static prose; free for personal + commercial use, no warranty.        |
| `contact.html`   | Contact form posting to Formspree. Loads `main.js` + `contact.js`.                       |

All pages share the same sticky header, footer (with the VybeCode maker logo + dynamic
copyright year), and `css/style.css`.

---

## How the dynamic bits work

Everything dynamic is client-side JavaScript run in the visitor's browser. Scripts are
loaded with `defer` and guard for missing elements, so each page only does the work its
markup supports.

### `js/download.js` — live download links from GitHub Releases

Implements "Stage 3 / passive consumer" of the app's release pipeline.

- Fetches the latest release: `https://api.github.com/repos/Vybecode-LTD/stripkit/releases/latest`
  (note the repo slug is **lowercase `stripkit`**).
- Finds the first release **asset whose name contains `.exe`** (the Inno Setup installer).
- Wires that asset's `browser_download_url` into both download buttons
  (IDs `download-btn`, `download-btn-2`).
- Builds a version/size label like `v0.6.0 · Windows 10/11 · x64 · 34 MB` into the meta
  spans (IDs `download-version`, `download-version-2`). Size is derived from the asset's
  byte count.
- Builds the **VirusTotal report link** (IDs `vt-link`, `vt-link-2`): it prefers the
  asset's `sha256:` `digest` field (`https://www.virustotal.com/gui/file/<sha256>`) and
  falls back to scraping a VirusTotal URL out of the release `body` notes if no digest is
  present.
- **Caches** the API response in `sessionStorage` under key `sk_latest_release` for **5
  minutes** (`CACHE_TTL = 300000`) to avoid hammering the unauthenticated GitHub API
  (rate-limited per IP).
- On any failure (no release yet, rate-limited, offline) it does nothing — the buttons
  keep their static fallback `href` (`#download`) and the version text stays at its
  HTML default (`Windows 10/11 · x64`).

> If you rename the app repo or change the installer extension, update `REPO` and the
> `.exe` match in this file.

### `js/changelog.js` — the curated changelog

Renders the **simplified, user-facing** changelog from `updates.json`. This is **not**
the app's technical `docs/CHANGELOG.md` — it is a hand-curated, plain-language feed
written for end users.

- Source: `updates.json` (fetched with `cache: 'no-cache'`).
- On `index.html` it renders into `#changelog-timeline`, limited to the **first 3**
  entries (`MAX_HOME = 3`). On `changelog.html` it renders into `#changelog-full` with
  **no limit** (the presence of `#changelog-full` is what switches it to "show all").
- Per change item it renders a coloured tag (`new` → green "New", `fix` → blue "Fix",
  `improved` → orange "Improved"; any other type falls back to the `improved` style with
  a capitalized label) and the description text.
- **Inline formatting** in any `text` or `summary` string:
  - `**bold**` → `<strong>`
  - `` `code` `` → `<code>` (styled as an orange inline chip)
  - All other input is HTML-escaped first, so it is safe to write `<` and `&` in copy.
- Dates (`date`, ISO `YYYY-MM-DD`) are formatted to e.g. "June 3, 2026".
- On fetch failure it shows a graceful "Changelog unavailable right now." message.

### `updates.json` — the changelog feed (the one manual maintenance step)

A JSON **array** of version objects, newest first. This is the single file you must edit
by hand when the app ships a release (see the maintenance section below).

Shape:

```json
[
  {
    "version": "0.6.0",
    "date": "2026-06-03",
    "summary": "A short one-line headline for this release.",
    "changes": [
      { "type": "new",      "text": "**Bold lead-in** — what's new, in plain language." },
      { "type": "improved", "text": "Something that got better. Inline `code` is allowed." },
      { "type": "fix",      "text": "A bug that was squashed." }
    ]
  }
]
```

Field reference:

| Field             | Required | Notes                                                                 |
| ----------------- | -------- | --------------------------------------------------------------------- |
| `version`         | yes      | Bare semver, **no** leading `v` (the UI prepends `v`).                 |
| `date`            | no       | ISO `YYYY-MM-DD`. Formatted to a long date; omitted if absent/invalid. |
| `summary`         | no       | One-line headline shown under the version. Supports `**bold**`/`` `code` ``. |
| `changes`         | yes      | Array of change items.                                                |
| `changes[].type`  | yes      | `new`, `improved`, or `fix` (drives the coloured tag).                |
| `changes[].text`  | yes      | The change description. Supports `**bold**`/`` `code` ``.             |

Keep entries **newest-first** — the home page slices the first three.

### `js/contact.js` — Formspree contact form

- Intercepts the `#contact-form` submit and posts via `fetch` (AJAX) so the visitor stays
  on the page instead of being redirected.
- Endpoint: **`https://formspree.io/f/xredjllr`** (also the form's `action` attribute in
  `contact.html`). A hidden `_subject` field sets the email subject.
- Shows inline status in `#cf-note` (sending → success → "Sent ✓", or an error from
  Formspree / a network failure), and resets the form on success.

> To change where contact messages go, update the Formspree form ID in **both**
> `contact.html` (the `action`) and the endpoint reference here (the script reads
> `form.action`, so editing the HTML `action` is sufficient — keep them consistent).

### `js/main.js` — footer year + scroll reveal

- Sets the current year into every `#year`, `#year2`, and `.year-now` element (footer
  copyright + the "Last updated" lines on privacy/terms).
- Adds a subtle fade-and-rise **scroll-reveal** to `.feature-card`, `.download-card`, and
  `.section-head` via `IntersectionObserver` (no-op if the browser lacks it).

### Hero badges

- **VirusTotal shield** — a shields.io-style two-tone badge in the hero and download
  card. Its link is filled in at runtime by `download.js` (see above); until then it
  points at `#`.
- **"100% free & open source · MIT on GitHub"** badge — a static link to the public app
  repo `https://github.com/Vybecode-LTD/stripkit`. The header also has a GitHub nav link
  to the same repo.

---

## Local preview

There is no build. Because the JS uses `fetch` against `updates.json`, open the site over
**HTTP**, not `file://` (a `file://` origin blocks the `fetch`). From the repo root:

```bash
python -m http.server 8080 --directory .
# then open http://localhost:8080
```

Any static server works equally well (e.g. `npx serve`, VS Code Live Server). The
download links and version/size require a network call to the GitHub API; the changelog
requires `updates.json` to be served, which the HTTP server above handles.

---

## Deployment

The site is fully static, so any static host works. The intended setup:

1. **GitHub Pages** — enable Pages on this repo (`Vybecode-LTD/StripKit-Website`),
   serving from the `main` branch root. (The files are already at the repo root, so no
   `/docs` folder or build output is needed.)
2. **Custom domain** — point **stripkit.pro** at the host. For GitHub Pages, add the
   domain in the Pages settings (which creates/uses a `CNAME` file) and configure DNS at
   the registrar. Enable "Enforce HTTPS".

Notes:

- **No build coupling to releases.** The site reads the live GitHub Release and the
  curated `updates.json` at runtime. Publishing a new StripKit version updates the
  download button/version automatically with no redeploy. The **only** site change per
  release is the manual `updates.json` changelog entry.
- The app repo's release pipeline (Inno Setup installer → GitHub Release, with a
  VirusTotal scan) is documented in the app repo's `docs/PACKAGING.md`. This site is the
  passive Stage 3 consumer of that pipeline.

---

## How to update

**Edit page content / copy.** Edit the relevant `.html` file directly. The header,
footer, and nav are duplicated across pages (no templating) — if you change a footer link
or nav item, update it in **every** HTML file (`index`, `changelog`, `privacy`, `terms`,
`contact`).

**Restyle.** Prefer editing the `:root` tokens in `css/style.css` over hard-coding
colours; the whole site derives from them. The accent orange (`--accent: #e8440a`)
matches the app's Obsidian design system.

### Adding a changelog entry (the one manual step)

When the app ships a release, add a **plain-language** entry to `updates.json` — at the
**top** of the array — alongside (not copied verbatim from) the app repo's technical
`docs/CHANGELOG.md`. Write it for end users: short, benefit-led, `**bold**` lead-ins,
optional `` `code` ``. Bump `version` and `date`, give a one-line `summary`, and list the
`changes` with the right `type` tags. No deploy step beyond committing/pushing (and the
host serving the file).

**Swap the screenshot.** Replace `resources/screenshot.png` with a new app capture
(same filename). The hero auto-hides the frame's "App preview" placeholder once the image
loads; if the file is missing or fails to load, the placeholder shows instead
(`onerror` handler on the `<img>`).

**Brand assets.** All live in `resources/`:

- `stripkit-icon.png` — the app icon used as the header/footer brand mark and the
  apple-touch-icon. Replace in place to update everywhere.
- `vybeco-logo.png` — the VybeCode "Made by" logo in the footer.
- `stripkit-logo.png` — the full StripKit wordmark. Present in the repo but **not**
  currently referenced by any page; available if you want to use it (e.g. an OG image or
  a larger hero lockup).
- `favicon.ico` — the browser tab icon (root level). Also referenced by every page's
  `<link rel="icon">`.
- The Open Graph image is set in `index.html` to `https://stripkit.pro/resources/screenshot.png`.

---

## Relationship to the app repo

| | This repo (`StripKit-Website`) | App repo (`stripkit`) |
| --- | --- | --- |
| Contains | The marketing/download site | The C#/Avalonia desktop app + Inno installer + release pipeline |
| Changelog | Curated, plain-language `updates.json` | Technical `docs/CHANGELOG.md` (drives GitHub Release notes) |
| Coupling | Passive — reads the live GitHub Release at runtime | Creates the GitHub Release (the single release creator) |
| Per release | **Manually** add an `updates.json` entry | Run the release pipeline (auto-publishes the Release) |

Keep the two changelogs in step: every release gets both a `docs/CHANGELOG.md` entry (in
the app repo) and a friendlier `updates.json` entry (here).
