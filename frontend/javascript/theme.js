// Light or dark, following the system by default. The toggle pins a choice
// as `data-theme` on the root (see `_base.scss`), remembered across visits by
// the inline script in `_head.erb` so a pinned page never flashes the wrong
// theme. Pinning whatever the system already says unpins instead, and a
// change of system setting clears the pin, so the site drifts back to
// tracking the system whenever the two agree.
//
// Anything drawn from the colour tokens — the heightmap — listens for
// `themechange` on the document to redraw.

const STORAGE_KEY = "theme"
const root = document.documentElement
const systemQuery = window.matchMedia("(prefers-color-scheme: dark)")

const systemTheme = () => (systemQuery.matches ? "dark" : "light")
const currentTheme = () => root.dataset.theme || systemTheme()

// Storage throws outright in some private modes; the toggle still works for
// the visit, it just isn't remembered.
function remember(theme) {
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

function pin(theme) {
  if (theme) root.dataset.theme = theme
  else delete root.dataset.theme
  remember(theme)
  document.dispatchEvent(new CustomEvent("themechange"))
}

// Labelled with what it does, not what is showing.
function label(button) {
  const next = currentTheme() === "dark" ? "light" : "dark"
  button.dataset.nextTheme = next
  button.setAttribute("aria-label", `Switch to ${next} theme`)
  button.title = `Switch to ${next} theme`
}

export function mountThemeToggle() {
  const button = document.querySelector(".theme-toggle")

  document.addEventListener("themechange", () => button && label(button))
  systemQuery.addEventListener("change", () => pin(null))

  if (!button) return
  label(button)
  // Hidden in the markup, since without JavaScript it could do nothing.
  button.closest("[hidden]")?.removeAttribute("hidden")
  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark"
    pin(next === systemTheme() ? null : next)
  })
}
