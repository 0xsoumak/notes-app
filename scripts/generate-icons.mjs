/**
 * Renders every icon asset in `public/` from `icon-art.mjs`.
 *
 * Run after changing the artwork: `pnpm icons`. The outputs are committed so
 * a plain `pnpm build` never needs sharp.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { iconSvg, maskableSvg } from './icon-art.mjs'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))

/** PNG sizes: the two the manifest needs, plus iOS's home-screen icon. */
const PNG_TARGETS = [
  { file: 'icon-192.png', size: 192, art: iconSvg },
  { file: 'icon-512.png', size: 512, art: iconSvg },
  { file: 'icon-maskable-512.png', size: 512, art: maskableSvg },
  { file: 'apple-touch-icon.png', size: 180, art: iconSvg },
]

await mkdir(publicDir, { recursive: true })

await writeFile(new URL('favicon.svg', `file://${publicDir}`), `${iconSvg()}\n`, 'utf8')

for (const { file, size, art } of PNG_TARGETS) {
  await sharp(Buffer.from(art()))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(file, `file://${publicDir}`)))
}

console.log(`Wrote favicon.svg and ${PNG_TARGETS.length} PNGs to public/`)
