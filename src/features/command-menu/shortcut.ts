/**
 * How the palette's shortcut is written on screen. Apple keyboards get ⌘K,
 * everything else Ctrl K — the binding itself accepts either modifier.
 */
const isApplePlatform =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

export const COMMAND_MENU_SHORTCUT = isApplePlatform ? '⌘K' : 'Ctrl K'
