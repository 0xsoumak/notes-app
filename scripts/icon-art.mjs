/**
 * The app icon, as geometry rather than a checked-in binary.
 *
 * A notepad seen head on: yellow bound edge along the top, a row of punch
 * holes below it, ruled lines on the page. Everything is expressed against a
 * 512-unit square so the same source scales to a 16px favicon and a 512px
 * install icon without a second drawing.
 */

const SIZE = 512

export const COLORS = {
  /* Warm yellow of the bound edge. Doubles as the manifest theme colour. */
  binding: '#fbd24a',
  page: '#f7f7f5',
  hole: '#cbbc8f',
  rule: '#c9c9c6',
}

/**
 * Draws the notepad into a square of `size` units placed at `x`/`y`, rounded
 * by `radius`. With `binding: false` the yellow edge is left off — the
 * maskable icon paints it as the surrounding plate instead, so drawing it
 * again here would merge the two into one flat shape.
 */
function notepad({ x, y, size, radius, binding = true }) {
  const scale = size / SIZE
  const u = (value) => x + value * scale
  const v = (value) => y + value * scale
  const s = (value) => value * scale

  const bindingHeight = 132
  const holeRow = binding ? 150 : 74
  const holeRadius = 7.5

  // Punch holes are laid out from the centre so the row stays symmetrical
  // whatever spacing is chosen.
  const holeCount = 15
  const holeGap = 30
  const holeSpan = (holeCount - 1) * holeGap
  const holes = Array.from({ length: holeCount }, (_, index) => {
    const cx = SIZE / 2 - holeSpan / 2 + index * holeGap
    return `<circle cx="${u(cx).toFixed(2)}" cy="${v(holeRow).toFixed(2)}" r="${s(holeRadius).toFixed(2)}" fill="${COLORS.hole}" />`
  }).join('\n      ')

  const rule = (top, width) => {
    const left = (SIZE - width) / 2
    return `<rect x="${u(left).toFixed(2)}" y="${v(top).toFixed(2)}" width="${s(width).toFixed(2)}" height="${s(16).toFixed(2)}" rx="${s(8).toFixed(2)}" fill="${COLORS.rule}" />`
  }

  const clipId = `pad-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`

  return `<defs>
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" />
      </clipPath>
    </defs>
    <g clip-path="url(#${clipId})">
      <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${COLORS.page}" />
      ${binding ? `<rect x="${x}" y="${y}" width="${size}" height="${s(bindingHeight).toFixed(2)}" fill="${COLORS.binding}" />` : ''}
      ${holes}
      ${rule(236, 336)}
      ${rule(330, 336)}
    </g>`
}

/** Full-bleed icon: the pad fills the canvas, rounded like an app tile. */
export function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Notes">
    ${notepad({ x: 0, y: 0, size: SIZE, radius: 114 })}
  </svg>`
}

/**
 * Maskable icon: the platform crops this to its own shape (circle, squircle,
 * rounded square), so the art is pulled into the safe zone — the centre 80% —
 * and the rest is a flat plate that survives any crop.
 *
 * The plate takes the binding yellow and the inset page drops its own yellow
 * edge, so the crop reads as a page sitting on the pad rather than as a second
 * icon floating on a background.
 */
export function maskableSvg() {
  const safe = SIZE * 0.72
  const offset = (SIZE - safe) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Notes">
    <rect width="${SIZE}" height="${SIZE}" fill="${COLORS.binding}" />
    ${notepad({ x: offset, y: offset, size: safe, radius: 46, binding: false })}
  </svg>`
}
