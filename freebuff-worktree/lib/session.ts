import { cookies } from "next/headers";

export const SESSION_COOKIE = "fundit_session";

/**
 * Anonymous prototype session. There are no accounts and no authentication.
 * The cookie only separates one demo profile from another on the same browser.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
