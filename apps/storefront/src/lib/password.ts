/**
 * Server-side password rule, shared by sign-up and reset. The forms check the same thing, but a direct
 * POST skips them, and Medusa's emailpass update silently ignores a password that is not a string.
 */
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string") return "Enter a password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 128) return "Use at most 128 characters.";
  return null;
}
