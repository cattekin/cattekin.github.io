// A random heightmap behind the page, after the method described at
// https://justinjay.wang/methods-for-random-gradients/: a grid of cells, each
// holding a height between 0 and 1 from smoothed Perlin noise, read off
// against a colour scale. Here the scale is the page's own grey ramp, so the
// ground keeps its tone and only the shape of it changes from visit to visit.
//
// The CSS gradient on `html` stays as the fallback — without JavaScript, or
// before this runs, the page looks exactly as it did.

// Cells per CSS pixel. The grid is drawn small and the browser's smoothing
// does the upscale, which is both the "smoothed" part of the noise and what
// keeps this cheap on a large screen.
const CELL_SIZE = 6

// Roughly how many hills fit across the longer side of the viewport.
const FEATURE_SCALE = 2.2
const OCTAVES = 4

// How much of the tone comes from the noise; the rest is the original
// top-to-bottom gradient, so the top stays darkest and the text sits on the
// lighter middle of the ramp.
const NOISE_WEIGHT = 0.45

// Deterministic per seed, so a resize redraws the same landscape rather than
// a new one.
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function perlin(random) {
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a, b, t) => a + (b - a) * t
  const grad = (hash, x, y) => {
    const h = hash & 7
    const u = h < 4 ? x : y
    const v = h < 4 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v)
  }

  return (x, y) => {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)
    const aa = perm[perm[xi] + yi]
    const ab = perm[perm[xi] + yi + 1]
    const ba = perm[perm[xi + 1] + yi]
    const bb = perm[perm[xi + 1] + yi + 1]
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    )
  }
}

function parseHex(value) {
  let hex = value.trim().replace(/^#/, "")
  if (hex.length === 3) hex = [...hex].map(c => c + c).join("")
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// The same three stops the CSS gradient uses, evenly spaced as it spaces them.
function readRamp() {
  const style = getComputedStyle(document.documentElement)
  return ["--gradient-top", "--gradient-middle", "--gradient-bottom"]
    .map(name => parseHex(style.getPropertyValue(name)))
}

function sampleRamp(ramp, t) {
  const scaled = Math.min(Math.max(t, 0), 1) * (ramp.length - 1)
  const i = Math.min(Math.floor(scaled), ramp.length - 2)
  const f = scaled - i
  return ramp[i].map((c, k) => c + (ramp[i + 1][k] - c) * f)
}

function draw(canvas, noise, offset, ramp) {
  const width = Math.ceil(window.innerWidth / CELL_SIZE)
  const height = Math.ceil(window.innerHeight / CELL_SIZE)
  canvas.width = width
  canvas.height = height

  const span = Math.max(width, height) / FEATURE_SCALE
  const heights = new Float32Array(width * height)
  let min = Infinity
  let max = -Infinity

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let amplitude = 1
      let frequency = 1 / span
      for (let o = 0; o < OCTAVES; o++) {
        sum += amplitude * noise(offset[0] + x * frequency, offset[1] + y * frequency)
        amplitude *= 0.5
        frequency *= 2
      }
      heights[y * width + x] = sum
      if (sum < min) min = sum
      if (sum > max) max = sum
    }
  }

  const context = canvas.getContext("2d")
  const image = context.createImageData(width, height)
  const range = max - min || 1

  for (let y = 0; y < height; y++) {
    const vertical = height > 1 ? y / (height - 1) : 0.5
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const h = (heights[i] - min) / range
      const [r, g, b] = sampleRamp(ramp, (1 - NOISE_WEIGHT) * vertical + NOISE_WEIGHT * h)
      image.data[i * 4] = r
      image.data[i * 4 + 1] = g
      image.data[i * 4 + 2] = b
      image.data[i * 4 + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)
}

export function mountHeightmap() {
  const random = mulberry32(Math.floor(Math.random() * 2 ** 32))
  const noise = perlin(random)
  const offset = [random() * 256, random() * 256]
  const ramp = readRamp()

  const canvas = document.createElement("canvas")
  canvas.className = "heightmap"
  canvas.setAttribute("aria-hidden", "true")
  document.body.prepend(canvas)

  draw(canvas, noise, offset, ramp)

  let pending
  window.addEventListener("resize", () => {
    cancelAnimationFrame(pending)
    pending = requestAnimationFrame(() => draw(canvas, noise, offset, ramp))
  })
}
