/**
 * GitHub hands file contents back as base64. `atob` is byte-oriented, so UTF-8
 * has to be decoded explicitly — otherwise any non-ASCII character (an emoji in
 * a note, say) corrupts on the way in.
 *
 * There is no encoder here: writes go through the Git Data API, which takes
 * file content as plain UTF-8.
 */

export function decodeBase64(base64: string): string {
  // The API pretty-prints base64 with newlines; atob rejects them.
  const binary = atob(base64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
