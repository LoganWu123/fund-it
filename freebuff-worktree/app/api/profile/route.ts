import { NextResponse } from "next/server";
import { computeCompleteness } from "@/lib/profile/completeness";
import { normalizeProfile } from "@/lib/profile/defaults";
import { deleteProfile, ensureProfile, loadProfile, saveProfile } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sessionId = await getOrCreateSessionId();
  const profile = ensureProfile(sessionId);
  return NextResponse.json({
    profile,
    completeness: computeCompleteness(profile),
  });
}

export async function POST(request: Request) {
  const sessionId = await getOrCreateSessionId();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const existing = loadProfile(sessionId);
  const incoming = normalizeProfile(body, sessionId);
  incoming.id = sessionId;
  incoming.createdAt = existing?.createdAt ?? incoming.createdAt;

  try {
    const saved = saveProfile(incoming);
    return NextResponse.json({
      profile: saved,
      completeness: computeCompleteness(saved),
    });
  } catch (error) {
    console.error("Failed to save profile", error);
    return NextResponse.json({ error: "The profile could not be saved." }, { status: 500 });
  }
}

export async function DELETE() {
  const sessionId = await getOrCreateSessionId();
  deleteProfile(sessionId);
  return NextResponse.json({ ok: true });
}
