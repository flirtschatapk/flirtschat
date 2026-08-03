const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function validateToken(token: string | null) {
  if (!token || token === "expired" || token === "invalid") throw new Error("This link is invalid or has expired. Request a new link to continue.");
}

export async function requestPasswordReset(email: string) { await wait(900); if (email.toLowerCase().includes("error")) throw new Error("We could not send the reset email. Please try again."); return { delivered: true }; }
export async function updatePassword(password: string, token: string | null) { await wait(950); validateToken(token); return { updated: password.length >= 8 }; }
export async function resendVerificationEmail(email: string) { await wait(800); if (!email) throw new Error("Add your email address before requesting another link."); if (email.toLowerCase().includes("error")) throw new Error("The verification email could not be sent."); return { delivered: true }; }
export async function verifyEmail(token: string | null) { await wait(850); validateToken(token); return { verified: true }; }
