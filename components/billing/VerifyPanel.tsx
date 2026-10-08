"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function VerifyPanel() {
  const params = useSearchParams();
  const reference = params.get("reference");
  const [state, setState] = useState<"checking" | "ok" | "failed" | "none">("checking");
  const [message, setMessage] = useState("Verifying with Paystack…");

  useEffect(() => {
    if (!reference) {
      setState("none");
      setMessage("No payment reference supplied.");
      return;
    }
    fetch(`/api/billing?reference=${encodeURIComponent(reference)}`, { method: "PUT" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data?.verified) {
          setState("ok");
          setMessage("Payment confirmed — Premium is active.");
        } else {
          setState("failed");
          setMessage(j.error?.message ?? "Verification failed.");
        }
      })
      .catch(() => {
        setState("failed");
        setMessage("Verification failed. Try again.");
      });
  }, [reference]);

  return (
    <Card title="Payment verification">
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {state === "ok" && (
        <p className="mt-2">
          <Badge tone="success">PREMIUM ACTIVE</Badge>
        </p>
      )}
      <p className="mt-3 text-sm">
        <a href="/billing" className="text-teal-800 hover:underline">
          Back to billing
        </a>
      </p>
    </Card>
  );
}
