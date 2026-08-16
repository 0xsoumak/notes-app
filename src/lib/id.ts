/**
 * Client-side id generator. Once the backend owns identity, the repository
 * layer will stop calling this and use server-issued ids instead.
 */
export function createId(): string {
  return crypto.randomUUID()
}
