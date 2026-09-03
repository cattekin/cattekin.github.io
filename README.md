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

| Path | What lives there |
| --- | --- |
| `src/_data/site_metadata.yml` | Name, tagline, email, and the footer links |
| `src/_layouts/default.erb` | The page shell |
| `src/_partials/` | `_head`, `_site_header`, `_site_footer` |
| `src/index.md` | The home page — front matter only; the design comes from the layout |
| `src/404.html` | Reuses the same splash design |
| `src/CNAME` | Custom domain, copied verbatim into the build |
| `frontend/styles/index.scss` | All site styles |

The header shows `title`/`subtitle` from a page's front matter, falling back to
`title`/`tagline` from the site metadata. That is how `404.html` gets the same
treatment as the home page without any extra CSS.

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
