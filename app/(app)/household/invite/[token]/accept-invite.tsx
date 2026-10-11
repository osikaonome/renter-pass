"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { Alert, Button } from "@/components/ui";
import { useAcceptInvite } from "@/hooks/use-households";

export function AcceptInvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const accept = useAcceptInvite();

  return (
    <div className="mt-4 flex flex-col gap-3">
      {accept.error && <Alert tone="danger">{accept.error.message}</Alert>}
      <Button
        className="self-start"
        disabled={accept.isPending}
        onClick={() => accept.mutate(token, { onSuccess: () => router.push("/household") })}
      >
        {accept.isPending ? "Joining…" : "Accept and join"}
      </Button>
    </div>
  );
}
