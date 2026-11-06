"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { patientsApi } from "@/lib/api/endpoints";
import { formatDate } from "@/lib/format";
import type { IssuedAccessToken, Patient } from "@/types/api";
import { usePatientMutations } from "./use-patient-mutations";

export const STATUS_PAGE_PATH = "/check-status";

/**
 * Front-desk dialog to issue, replace or revoke the token a patient uses on the
 * public status page. The plain token is only ever shown here, once.
 */
export function PatientTokenDialog({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { invalidate } = usePatientMutations();
  const [issued, setIssued] = useState<IssuedAccessToken | null>(null);
  const [issuedAt, setIssuedAt] = useState(patient.accessTokenIssuedAt ?? null);
  const [copied, setCopied] = useState(false);
  const onError = (error: unknown) => toast.error(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");

  const issue = useMutation({
    mutationFn: () => patientsApi.issueAccessToken(patient._id),
    onSuccess: async (result) => {
      setIssued(result);
      setIssuedAt(result.issuedAt);
      setCopied(false);
      await invalidate();
    },
    onError,
  });
  const revoke = useMutation({
    mutationFn: () => patientsApi.revokeAccessToken(patient._id),
    onSuccess: async () => {
      toast.success(`Token revoked for ${patient.name}`);
      setIssuedAt(null);
      await invalidate();
    },
    onError,
  });
  const busy = issue.isPending || revoke.isPending;

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
    } catch {
      toast.error("Copy failed. Select the token and copy it manually.");
    }
  };

  const statusUrl = typeof window === "undefined" ? STATUS_PAGE_PATH : `${window.location.origin}${STATUS_PAGE_PATH}`;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Status-check token</DialogTitle>
          <DialogDescription>
            {patient.name} uses their full name and this token to see their current condition at {statusUrl}.
          </DialogDescription>
        </DialogHeader>

        {issued ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <output aria-label="Access token" className="flex-1 font-mono text-xl font-semibold tracking-[0.12em] text-foreground select-all">
                {issued.token}
              </output>
              <Button variant="outline" size="lg" onClick={copy} aria-label={copied ? "Token copied" : "Copy token"}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              Give this token to {patient.name} now. It is shown only once; if it is lost, issue a new one.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p>
              {issuedAt ? (
                <>
                  A token was issued on <strong>{formatDate(issuedAt)}</strong>. Issuing a new one stops the old token working.
                </>
              ) : (
                "No token has been issued yet."
              )}
            </p>
          </div>
        )}

        <DialogFooter>
          {issued ? (
            <Button size="lg" onClick={onClose}>
              Done
            </Button>
          ) : (
            <>
              {issuedAt && (
                <Button variant="outline" size="lg" onClick={() => revoke.mutate()} disabled={busy}>
                  {revoke.isPending && <Loader2 className="animate-spin" aria-hidden />}
                  Revoke token
                </Button>
              )}
              <Button size="lg" onClick={() => issue.mutate()} disabled={busy}>
                {issue.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {issuedAt ? "Issue new token" : "Issue token"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
