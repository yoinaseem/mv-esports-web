"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { cancelTournament } from "@/lib/api/tournaments";
import type { Tournament } from "@/types/tournaments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CancelTournamentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | null;
  onCancelled: (tournament: Tournament) => void;
};

export function CancelTournamentDialog({
  open,
  onOpenChange,
  tournament,
  onCancelled,
}: CancelTournamentDialogProps) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!tournament) return;
    setError("");
    setSubmitting(true);
    try {
      const updated = await cancelTournament(tournament.id);
      onCancelled(updated);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.message) {
        setError(err.message);
      } else if (err instanceof Error && err.message.trim()) {
        setError(err.message);
      } else {
        setError("Couldn't cancel the tournament. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel tournament?</DialogTitle>
          <DialogDescription>
            {tournament ? (
              <>
                <span className="font-medium text-foreground">{tournament.name}</span> will move to
                a cancelled state. Existing registrations stay on the record but the tournament
                won&apos;t progress further. This is terminal.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Keep tournament
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Cancelling…" : "Cancel tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
