export const MASTER_ADMIN_EMAIL = "ajaymeena787956@gmail.com";
export function validateAdminSignup(email: string, pw: string, confirm: string): string | null {
  if (email.trim().toLowerCase() !== MASTER_ADMIN_EMAIL) return "Only the Master Admin email can register.";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain letters and numbers.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}
