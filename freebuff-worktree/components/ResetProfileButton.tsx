"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetProfileButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn btn--small"
      disabled={busy}
      onClick={async () => {
        const confirmed = window.confirm(
          "Delete this prototype profile? The saved answers will be removed from this browser's session.",
        );
        if (!confirmed) return;
        setBusy(true);
        try {
          await fetch("/api/profile", { method: "DELETE" });
          router.push("/");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Deleting…" : "Delete this profile"}
    </button>
  );
}
