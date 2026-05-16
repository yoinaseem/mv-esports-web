"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { seedAndBuildTournament } from "@/lib/api/tournaments";
import type { Tournament } from "@/types/tournaments";
import {
  isStageBuildable,
  type SeedAndBuildPreview as SeedAndBuildPreviewPayload,
} from "@/types/seed-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedAndBuildPreview as SeedAndBuildPreviewView } from "@/components/tournaments/builder/SeedAndBuildPreview";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  // The cached preview payload from the live panel. When null (still
  // loading or fetch failed), the dialog shows a skeleton / error state.
  preview: SeedAndBuildPreviewPayload | null;
  loadError?: string;
  onBuilt: (tournament: Tournament) => void;
};

// Confirmation dialog wrapping the preview render. Two variants:
//
//  - all stages buildable: shows the preview + Build/Cancel actions
//  - any stage unbuildable: blocking — Close only. The host has to go back
//    and adjust the stage config (or change max participants) before they
//    can build at all.
//
// Confirm path calls the existing seed-and-build endpoint and bubbles the
// updated tournament back to the host page so it can refetch matches.
export function SeedAndBuildConfirmDialog({
  open,
  onOpenChange,
  tournamentId,
  preview,
  loadError,
  onBuilt,
}: Props) {
  const [submitting, startSubmit] = useTransition();

  const allBuildable =
    preview !== null && preview.stages.length > 0 && preview.stages.every(isStageBuildable);

  const handleConfirm = () => {
    if (!allBuildable) return;
    startSubmit(async () => {
      try {
        const updated = await seedAndBuildTournament(tournamentId);
        toast.success("Bracket built — tournament is now in progress");
        onBuilt(updated);
        onOpenChange(false);
      } catch (error) {
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : error instanceof Error
              ? error.message
              : "Couldn't build the bracket.";
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {preview === null
              ? "Loading preview…"
              : allBuildable
                ? "Confirm seed and build"
                : "Bracket not buildable yet"}
          </DialogTitle>
          <DialogDescription>
            {preview === null
              ? "Fetching the predicted bracket layout from the current seeds and approvals."
              : allBuildable
                ? "Review the structure the generator will produce. Once built, the tournament moves to In Progress and the bracket is locked."
                : "One or more entry stages can't be built with the current participant count. Adjust the stage configuration (or change max participants) and try again."}
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : preview === null ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <SeedAndBuildPreviewView preview={preview} />
          </div>
        )}

        <DialogFooter>
          {allBuildable ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Adjust stage first
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={submitting || preview === null}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                {submitting ? "Building…" : "Build with this structure"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
