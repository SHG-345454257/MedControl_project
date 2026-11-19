export function familyInviteHash(hash: string) {
  return /^#[a-f0-9]{64}$/.test(hash) ? hash : "";
}
