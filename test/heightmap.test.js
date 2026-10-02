import assert from "node:assert/strict"
import { test } from "node:test"
import { mountHeightmap } from "../frontend/javascript/heightmap.js"

test("heightmap waits for valid CSS colours and refreshes its palette", t => {
  const windowEvents = new EventTarget()
  const documentEvents = new EventTarget()
  let colours = ["", "", ""]
  let pixels
  let paints = 0
  const canvas = {
    style: {},
    setAttribute() {},
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData(image) { pixels = image.data; paints++ },
    }),
  }
  install("window", Object.assign(windowEvents, { innerWidth: 60, innerHeight: 60 }))
  install("document", Object.assign(documentEvents, {
    readyState: "interactive",
    documentElement: {},
    createElement: () => canvas,
    body: { prepend() {} },
  }))
  install("requestAnimationFrame", callback => callback())
  install("cancelAnimationFrame", () => {})
  install("getComputedStyle", () => ({
    getPropertyValue: name => colours[
      ["--gradient-top", "--gradient-middle", "--gradient-bottom"].indexOf(name)
    ],
  }))
  mountHeightmap()
  assert.equal(paints, 0, "missing CSS must not produce an opaque black canvas")

  colours = ["#666", "#cbcbc7", "#e3e3e2"]
  windowEvents.dispatchEvent(new Event("load"))
  assert.equal(paints, 1, "load retries the initial palette read")
  assert.ok(pixels[0] >= 102)
  assert.equal(canvas.style.display, "")

  colours = ["#0e0e0e", "#262625", "#323231"]
  documentEvents.dispatchEvent(new Event("themechange"))
  assert.ok(pixels[0] <= 50)

  colours = ["#xyz", "#262625", "#323231"]
  documentEvents.dispatchEvent(new Event("themechange"))
  assert.equal(paints, 2, "invalid colours must not be drawn")
  assert.equal(canvas.style.display, "none", "CSS fallback replaces stale canvas")

  colours = ["#666", "#cbcbc7", "#e3e3e2"]
  windowEvents.dispatchEvent(new Event("resize"))
  assert.equal(paints, 3)
  assert.equal(canvas.style.display, "")
  assert.ok(pixels[0] >= 102)

  function install(name, value) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    })
  }
})
