"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ApiError, getValidationErrors } from "@/lib/api-client";
import { updateStage } from "@/lib/api/stages";
import type { FieldErrors } from "@/types/auth";
import { formatLabel, type Stage, type StageConfig } from "@/types/stages";
import type { Tournament } from "@/types/tournaments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BEST_OF_OPTIONS = ["1", "3", "5", "7"] as const;

type StageEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
  stage: Stage | null;
  // Approved registration count for the parent tournament. Used to mirror
  // the backend's "shrink-below-approved" guard: an RR PATCH that drops
  // groups × group_size below this number rejects with a clear message.
  approvedRegistrationCount?: number;
  onUpdated: (next: Stage) => void;
};

// Read the current best_of from a stage's config (RR/SE/DE all read it from
// the same key after commit 17). Default 1 when absent.
function bestOfFromConfig(config: StageConfig): number {
  const raw = (config as { best_of?: unknown }).best_of;
  return typeof raw === "number" && raw > 0 ? raw : 1;
}

export function StageEditDialog({
  open,
  onOpenChange,
  tournament,
  stage,
  approvedRegistrationCount = 0,
  onUpdated,
}: StageEditDialogProps) {
  const [name, setName] = useState("");
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(false);
  const [grandFinalReset, setGrandFinalReset] = useState(true);
  const [rrGroups, setRrGroups] = useState("1");
  const [rrGroupSize, setRrGroupSize] = useState("4");
  const [rrAllowDraws, setRrAllowDraws] = useState(false);
  const [rrLegs, setRrLegs] = useState("1");
  const [bestOf, setBestOf] = useState("1");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, startSubmit] = useTransition();

  // Hydrate form state from the stage being edited each time the dialog
  // opens. Format is shown read-only — changing it means swapping config
  // shape, which is a different (and rarer) flow we'll surface later.
  useEffect(() => {
    if (!open || !stage) return;
    setName(stage.name);
    const cfg = stage.config as Record<string, unknown>;
    setThirdPlaceMatch(Boolean(cfg.third_place_match));
    setGrandFinalReset(cfg.grand_final_reset !== false); // default true
    setRrGroups(String(cfg.groups ?? 1));
    setRrGroupSize(String(cfg.group_size ?? 4));
    setRrAllowDraws(Boolean(cfg.allow_draws));
    setRrLegs(String(typeof cfg.legs === "number" && cfg.legs > 0 ? cfg.legs : 1));
    setBestOf(String(bestOfFromConfig(stage.config)));
    setFieldErrors({});
    setFormError("");
  }, [open, stage]);

  if (!stage) return null;

  // Phase determines which guards fire. In Draft the backend enforces strict
  // cap === max equality; once registration opens the two decouple and only
  // the approved-count guard remains. Pencil only opens for {draft,
  // registration_open, registration_closed}, so "not draft" === relaxed here.
  const isDraftPhase = tournament.status === "draft";

  // RR-only capacity preview. Strict equality in Draft; no cap-vs-max check
  // in the relaxed phase (only the approved-count shrink guard fires).
  const rrGroupsNum = Math.max(1, Number(rrGroups) || 0);
  const rrGroupSizeNum = Math.max(0, Number(rrGroupSize) || 0);
  const rrCapacity = rrGroupsNum * rrGroupSizeNum;
  const max = tournament.max_participants;
  const showRrCapacityWarning =
    isDraftPhase &&
    stage.format === "round_robin" &&
    max != null &&
    max > 0 &&
    rrCapacity !== max;
  // Mirror of backend's shrink-below-approved guard. Fires in every phase the
  // pencil opens in — backend rejects with a 422 either way; we surface it
  // inline so the host can fix without round-tripping.
  const showRrShrinkWarning =
    stage.format === "round_robin" &&
    approvedRegistrationCount > 0 &&
    rrCapacity < approvedRegistrationCount;
  // DE entry stages require max_participants in {4, 8, 16, 32} regardless of
  // phase — the DE generator only knows those sizes, so the constraint is
  // structural rather than a coordination invariant.
  const DE_VALID_SIZES = [4, 8, 16, 32];
  const showDeSizeWarning =
    stage.format === "double_elim" &&
    max != null &&
    max > 0 &&
    !DE_VALID_SIZES.includes(max);

  const buildConfig = (): StageConfig => {
    const parsedBestOf = Number(bestOf);
    const bestOfValue =
      Number.isFinite(parsedBestOf) && parsedBestOf > 1 ? parsedBestOf : undefined;
    const withBestOf = <T extends Record<string, unknown>>(base: T): T =>
      bestOfValue !== undefined ? ({ ...base, best_of: bestOfValue } as T) : base;

    if (stage.format === "single_elim") {
      const base = thirdPlaceMatch ? { third_place_match: true } : {};
      return withBestOf(base) as StageConfig;
    }
    if (stage.format === "double_elim") {
      return withBestOf({ grand_final_reset: grandFinalReset }) as StageConfig;
    }
    if (stage.format === "round_robin") {
      const base: Record<string, unknown> = {
        groups: rrGroupsNum,
        group_size: rrGroupSizeNum || 2,
      };
      if (rrAllowDraws) base.allow_draws = true;
      // Backend defaults to legs=1; only emit when > 1.
      const parsedLegs = Number(rrLegs);
      if (Number.isFinite(parsedLegs) && parsedLegs > 1) base.legs = parsedLegs;
      return withBestOf(base) as StageConfig;
    }
    return {};
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    if (showRrCapacityWarning) {
      setFormError(
        `Capacity (${rrCapacity}) must equal the tournament cap of ${max} while in Draft. Adjust groups, group size, or max participants so they match.`,
      );
      return;
    }
    if (showRrShrinkWarning) {
      setFormError(
        `Capacity (${rrCapacity}) is below the current approved-registration count (${approvedRegistrationCount}). Bump groups or group size, or remove registrations first.`,
      );
      return;
    }
    if (showDeSizeWarning) {
      setFormError(
        `Double-elimination requires max participants of 4, 8, 16, or 32. Tournament cap is currently ${max}. Change either the cap or the format.`,
      );
      return;
    }

    startSubmit(async () => {
      try {
        const updated = await updateStage(tournament.id, stage.id, {
          name: name.trim() || stage.name,
          config: buildConfig(),
        });
        onUpdated(updated);
        onOpenChange(false);
        toast.success(`Updated ${updated.name}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          const validationErrors = getValidationErrors(error);
          setFieldErrors(validationErrors);
          if (Object.keys(validationErrors).length === 0) {
            setFormError(error.message || "Please review your input and try again.");
          }
          return;
        }
        const msg =
          error instanceof Error && error.message ? error.message : "Couldn't update stage.";
        setFormError(msg);
      }
    });
  };

  const renderFieldErrors = (key: string) =>
    fieldErrors[key]?.map((message) => (
      <p key={message} className="text-sm text-destructive">{message}</p>
    ));

  const renderConfigErrors = () => {
    const keys = Object.keys(fieldErrors).filter((k) => k.startsWith("config"));
    if (keys.length === 0) return null;
    return (
      <div className="space-y-1">
        {keys.flatMap((k) =>
          (fieldErrors[k] ?? []).map((m) => (
            <p key={`${k}-${m}`} className="text-sm text-destructive">{m}</p>
          )),
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit stage</DialogTitle>
          <DialogDescription>
            Tweak this stage&apos;s configuration. Format changes aren&apos;t supported here —
            cancel and create a new stage if you need a different format.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Format</span>
            <Badge variant="outline">{formatLabel(stage)}</Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-edit-name">Name</Label>
            <Input
              id="stage-edit-name"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={fieldErrors.name?.length ? true : undefined}
            />
            {renderFieldErrors("name")}
          </div>

          {stage.format === "single_elim" ? (
            <div className="flex items-center gap-2">
              <Checkbox
                id="stage-edit-third"
                checked={thirdPlaceMatch}
                onCheckedChange={(c) => setThirdPlaceMatch(c === true)}
              />
              <Label htmlFor="stage-edit-third" className="cursor-pointer">
                Include third-place match
              </Label>
            </div>
          ) : null}

          {stage.format === "double_elim" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="stage-edit-reset"
                  checked={grandFinalReset}
                  onCheckedChange={(c) => setGrandFinalReset(c === true)}
                />
                <Label htmlFor="stage-edit-reset" className="cursor-pointer">
                  Grand final reset (losers must beat winners twice)
                </Label>
              </div>
              {showDeSizeWarning ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <span className="font-medium">Max participants must be 4, 8, 16, or 32</span>{" "}
                  for a double-elimination stage. Tournament cap is currently {max}.
                </div>
              ) : null}
            </div>
          ) : null}

          {stage.format === "round_robin" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stage-edit-groups">Groups</Label>
                  <Input
                    id="stage-edit-groups"
                    type="number"
                    min={1}
                    required
                    value={rrGroups}
                    onChange={(e) => setRrGroups(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-edit-size">Group size</Label>
                  <Input
                    id="stage-edit-size"
                    type="number"
                    min={2}
                    required
                    value={rrGroupSize}
                    onChange={(e) => setRrGroupSize(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-edit-legs">Legs</Label>
                  <Input
                    id="stage-edit-legs"
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={rrLegs}
                    onChange={(e) => setRrLegs(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Times each pair plays. 1 = standard, 2 = double.
                  </p>
                </div>
              </div>
              <div
                className={`rounded-md border px-3 py-2 text-xs ${
                  showRrCapacityWarning
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
              >
                <span className="font-medium">Capacity:</span> {rrCapacity} participant
                {rrCapacity === 1 ? "" : "s"}
                {showRrCapacityWarning ? (
                  <>
                    {" "}— must equal the tournament cap of {max} while in Draft. (Cap and max
                    decouple once registration opens.)
                  </>
                ) : isDraftPhase && max != null && max > 0 ? (
                  <> — matches the tournament cap of {max}.</>
                ) : !isDraftPhase && max != null && max > 0 ? (
                  <> — tournament cap is {max} (independent of capacity post-open).</>
                ) : null}
              </div>
              {showRrShrinkWarning ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <span className="font-medium">Below approved registrations:</span> capacity{" "}
                  {rrCapacity} can&apos;t seat the {approvedRegistrationCount} approved entrants.
                  Bump groups or group size, or remove registrations first.
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="stage-edit-draws"
                  checked={rrAllowDraws}
                  onCheckedChange={(c) => setRrAllowDraws(c === true)}
                />
                <Label htmlFor="stage-edit-draws" className="cursor-pointer">
                  Allow drawn games
                </Label>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
            <Label htmlFor="stage-edit-bestof" className="text-xs text-muted-foreground">
              Series length
            </Label>
            <Select value={bestOf} onValueChange={setBestOf}>
              <SelectTrigger id="stage-edit-bestof" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BEST_OF_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>
                    Best of {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderConfigErrors()}
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
