/**
 * The app icon, as geometry rather than a checked-in binary.
 *
 * A white pencil on a blue tile whose bottom-right corner peels back like a
 * sheet of paper. Everything is expressed against a 512-unit square so the
 * same source scales to a 16px favicon and a 512px install icon without a
 * second drawing.
 */

const SIZE = 512

export const COLORS = {
  /* The tile runs light blue to deep blue across the diagonal. The mid value
     doubles as the manifest theme colour. */
  blueLight: '#5b95ff',
  blue: '#2563eb',
  blueDeep: '#1740c4',
  /* The peeled corner: the underside of the sheet, lit from the fold. */
  peelLight: '#eaf1ff',
  peelShade: '#bcd0f7',
  ink: '#ffffff',
}

/**
 * Gradients are declared once per SVG. Ids are suffixed so two drawings can
 * share a document without colliding.
 */
function defs(id) {
  return `<linearGradient id="tile-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.blueLight}" />
      <stop offset="1" stop-color="${COLORS.blueDeep}" />
    </linearGradient>
    <linearGradient id="peel-${id}" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${COLORS.peelShade}" />
      <stop offset="1" stop-color="${COLORS.peelLight}" />
    </linearGradient>`
}

/**
 * The pencil, drawn upright and then rotated so it lies along the diagonal
 * with the point at the lower left. One solid silhouette rather than separate
 * barrel and tip: at favicon sizes a two-piece pencil closes up into a blur,
 * whereas a single shape stays a clean stroke of white.
 *
 * `scale` shrinks it about the centre for the maskable icon, where the safe
 * zone is smaller than the canvas.
 */
function pencil(scale = 1) {
  const half = 62
  const top = -150
  const shoulder = 78
  const point = 152
  const round = 18

  // Barrel with a rounded eraser end, tapering to the point.
  const body = [
    `M ${-half} ${top + round}`,
    `Q ${-half} ${top} ${-half + round} ${top}`,
    `L ${half - round} ${top}`,
    `Q ${half} ${top} ${half} ${top + round}`,
    `L ${half} ${shoulder}`,
    `L 10 ${point}`,
    `Q 0 ${point + 12} ${-10} ${point}`,
    `L ${-half} ${shoulder}`,
    'Z',
  ].join(' ')

  // The collar where the wood meets the barrel. Thin enough to vanish at
  // favicon sizes, which is the intent — it is detail, not structure.
  const collar = `M ${-half} ${shoulder} L ${half} ${shoulder}`

  return `<g transform="translate(${SIZE / 2} ${SIZE / 2}) rotate(45) scale(${scale})">
      <path d="${body}" fill="${COLORS.ink}" />
      <path d="${collar}" stroke="${COLORS.blue}" stroke-width="9" stroke-opacity="0.28" stroke-linecap="round" />
    </g>`
}

/**
 * The bottom-right corner lifted off the tile. The flap is the triangle the
 * corner would occupy; the rounded rect clip trims its outer point back to
 * the tile's own radius, so no separate corner geometry is needed.
 */
function peel() {
  // The tile's own 114-unit corner radius eats the point of this triangle, so
  // the fold has to reach well past it to leave a flap with any body to it.
  const fold = 236
  const edge = SIZE - fold
  // The fold line bows towards the corner, so the flap is pinched in the
  // middle the way a lifted sheet is — a straight line reads as a cut corner.
  const bend = edge + fold * 0.56

  const foldLine = `M ${edge} ${SIZE} Q ${bend} ${bend} ${SIZE} ${edge}`

  return `<path d="${foldLine} L ${SIZE} ${SIZE} Z" fill="url(#peel-icon)" />
      <path d="${foldLine}" fill="none" stroke="${COLORS.blueDeep}" stroke-width="7" stroke-opacity="0.28" />`
}

/** Full-bleed icon: the tile fills the canvas, rounded like an app tile. */
export function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Notes">
    <defs>
      ${defs('icon')}
      <clipPath id="tile-clip">
        <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="114" />
      </clipPath>
    </defs>
    <g clip-path="url(#tile-clip)">
      <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#tile-icon)" />
      ${pencil(1.08)}
      ${peel()}
    </g>
  </svg>`
}

/**
 * Maskable icon: the platform crops this to its own shape (circle, squircle,
 * rounded square), so the tile runs edge to edge and the pencil is pulled
 * into the safe zone — the centre 80%. The peeled corner is left off; it sits
 * exactly where every mask cuts, so it would survive as a smear at best.
 */
export function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Notes">
    <defs>${defs('mask')}</defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#tile-mask)" />
    ${pencil(0.78)}
  </svg>`
}
