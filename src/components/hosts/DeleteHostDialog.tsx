"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { deleteHost } from "@/lib/api/tournament-hosts";
import type { TournamentHost } from "@/types/tournament-hosts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteHostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: TournamentHost | null;
  onDeleted: (host: TournamentHost) => void;
};

export function DeleteHostDialog({ open, onOpenChange, host, onDeleted }: DeleteHostDialogProps) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!host) return;
    setError("");
    setSubmitting(true);
    try {
      await deleteHost(host.id);
      onDeleted(host);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.message) {
        setError(err.message);
      } else if (err instanceof Error && err.message.trim()) {
        setError(err.message);
      } else {
        setError("Couldn't remove the host record. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove host record?</DialogTitle>
          <DialogDescription>
            {host ? (
              <>
                <span className="font-medium text-foreground">{host.display_name}</span>&apos;s host application
                will be removed and they&apos;ll lose tournament-builder access. They can re-apply after.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
            {submitting ? "Removing…" : "Remove host"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
