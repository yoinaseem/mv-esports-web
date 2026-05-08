"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { deleteGame } from "@/lib/api/games";
import type { Game } from "@/types/games";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteGameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game | null;
  onDeleted: (game: Game) => void;
};

export function DeleteGameDialog({ open, onOpenChange, game, onDeleted }: DeleteGameDialogProps) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!game) return;
    setError("");
    setSubmitting(true);
    try {
      await deleteGame(game.id);
      onDeleted(game);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.message) {
        setError(err.message);
      } else if (err instanceof Error && err.message.trim()) {
        setError(err.message);
      } else {
        setError("Couldn't delete the game. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete game?</DialogTitle>
          <DialogDescription>
            {game ? (
              <>
                <span className="font-medium text-foreground">{game.name}</span> will be removed from the catalog. Tournaments already linked to it stay intact, but you won&apos;t be able to create new ones for this title.
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
            {submitting ? "Deleting…" : "Delete game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
