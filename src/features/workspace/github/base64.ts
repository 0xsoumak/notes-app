/**
 * GitHub exchanges file contents as base64. `atob`/`btoa` are byte-oriented,
 * so UTF-8 has to be encoded and decoded explicitly — otherwise any non-ASCII
 * character (an emoji in a note, say) corrupts on round-trip.
 */

export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function decodeBase64(base64: string): string {
  // The API pretty-prints base64 with newlines; atob rejects them.
  const binary = atob(base64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
