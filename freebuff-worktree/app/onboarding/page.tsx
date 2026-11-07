import { loadProfile } from "@/lib/db";
import { readSessionId } from "@/lib/session";
import { emptyProfile } from "@/lib/profile/defaults";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.step);
  const requestedStep =
    Number.isFinite(requested) && requested >= 1 && requested <= 7 ? Math.round(requested) : undefined;

  const sessionId = await readSessionId();
  const profile = sessionId ? loadProfile(sessionId) : null;
  const initialStep = requestedStep ?? profile?.onboardingStep ?? 1;

  return (
    <OnboardingWizard
      initialProfile={profile ?? emptyProfile()}
      initialStep={initialStep}
    />
  );
}
