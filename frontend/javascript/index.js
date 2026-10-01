import "normalize.css"
import "$styles/index.scss"
import { mountHeightmap } from "./heightmap.js"
import { mountThemeToggle } from "./theme.js"

mountThemeToggle()
mountHeightmap()
