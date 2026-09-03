# cattekin.com

Personal site for Edward Tippett, built with [Bridgetown](https://www.bridgetownrb.com).

## Getting started

```sh
bundle install
npm install
bin/bridgetown start
```

The site is then at <http://localhost:4000>.

## Layout

Layouts chain: `default` is the shell every page shares, and each child adds
the part that actually differs. Adding a page type means adding one small
layout, not editing the shell.

| Path | What lives there |
| --- | --- |
| `src/_layouts/default.erb` | The shell — `<head>`, the body class, the footer |
| `src/_layouts/splash.erb` | Full-viewport treatment; used by the home page and `404` |
| `src/_layouts/page.erb` | Masthead + prose column, for ordinary pages |
| `src/_partials/` | `_head`, `_masthead`, `_site_footer` |
| `src/_data/site_metadata.yml` | Name, tagline, email, `nav` (internal), `links` (external) |
| `src/index.md` | The home page — front matter only; the design comes from the layout |
| `src/404.html` | The splash layout again, plus `page_class: not-found` |
| `src/CNAME` | Custom domain, copied verbatim into the build |
| `frontend/styles/` | `index.scss` imports the partials below |

The `<body>` carries both the layout name and any `page_class`, so `404.html`
is `class="splash not-found"` — the geometry from the layout, a hook for
per-page tweaks on top. The stylesheet is scoped to match:

| Path | Applies to |
| --- | --- |
| `_tokens.scss` | Breakpoints. Emits no CSS |
| `_base.scss` | Colour custom properties, the flex shell, links, footer nav |
| `_splash.scss` | `.splash` — the viewport split around the midline |
| `_page.scss` | `.page` — masthead, reading measure, prose defaults |

Both layouts share the same sticky-footer shell and differ only in how the
slack is distributed: on a splash the title block and footer each take half;
on a page the content takes it all and the footer sits beneath. Keep new
design rules inside a page-class block — a bare `header`/`h1`/`text-align`
rule applies to every page type, which is what made the splash hard to build
on in the first place.

A splash page shows `title`/`subtitle` from its front matter, falling back to
`title`/`tagline` from the site metadata. The home page sets `title: ""` to
declare itself untitled — Bridgetown otherwise names a resource after its
filename, which would title it "Index".

To add a page: front matter of `layout: page` and a `title`, body in
Markdown, then add it to `nav` in the site metadata if it should appear in
the masthead.

## Deploying

`.github/workflows/deploy.yml` runs `bin/bridgetown deploy` on every pull
request and on every push to `main`; only the pushes to `main` go on to
publish `output/` to GitHub Pages. So a pull request that fails to build says
so before it lands, and is worth requiring under **Settings → Branches**.

Publishing requires the repository's **Settings → Pages → Build and deployment
→ Source** to be set to **GitHub Actions**.

Dependabot (`.github/dependabot.yml`) proposes gem, npm, and action updates
once a month, one grouped pull request each, which the same build then checks.

To reproduce the production build locally:

```sh
BRIDGETOWN_ENV=production bin/bridgetown deploy
```
