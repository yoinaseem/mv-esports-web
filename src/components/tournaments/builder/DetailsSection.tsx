"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon } from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { updateTournament, type TournamentUpdatePayload } from "@/lib/api/tournaments";
import { formatPrizePool, type Tournament } from "@/types/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const DESCRIPTION_MAX = 500;

type Props = {
  tournament: Tournament;
  onUpdated: (next: Tournament) => void;
  editable: boolean;
};

// Inline editor for the post-create editable details that don't fit the
// Schedule / Stages / Bracket cards. Mirrors ScheduleSection's pencil-and-
// save pattern. Saves through updateTournament with a sparse payload
// containing only the fields the host changed — relies on backend's
// PATCH-coupling relaxation for prize pool so partial updates round-trip.
export function DetailsSection({ tournament, onUpdated, editable }: Props) {
  const [editing, setEditing] = useState(false);

  // Form state is hydrated each time the host enters edit mode so re-opens
  // after a cancel pick up the live tournament again, not stale drafts.
  const [description, setDescription] = useState(tournament.description ?? "");
  const [bannerUrl, setBannerUrl] = useState(tournament.banner_url ?? "");
  const [streamUrl, setStreamUrl] = useState(tournament.stream_url ?? "");
  const [formatLabel, setFormatLabel] = useState(tournament.format_label ?? "");
  const [prizeAmount, setPrizeAmount] = useState(
    tournament.prize_pool?.amount != null ? String(tournament.prize_pool.amount) : "",
  );
  const [prizeCurrency, setPrizeCurrency] = useState<"MVR" | "USD">(
    tournament.prize_pool?.currency === "USD" ? "USD" : "MVR",
  );

  const [formError, setFormError] = useState("");
  const [saving, startSave] = useTransition();

  const startEdit = () => {
    setDescription(tournament.description ?? "");
    setBannerUrl(tournament.banner_url ?? "");
    setStreamUrl(tournament.stream_url ?? "");
    setFormatLabel(tournament.format_label ?? "");
    setPrizeAmount(
      tournament.prize_pool?.amount != null ? String(tournament.prize_pool.amount) : "",
    );
    setPrizeCurrency(tournament.prize_pool?.currency === "USD" ? "USD" : "MVR");
    setFormError("");
    setEditing(true);
  };

  const clearPrizePool = () => {
    setPrizeAmount("");
    setPrizeCurrency("MVR");
  };

  const submit = () => {
    setFormError("");

    // Build the sparse PATCH payload — only include fields whose normalised
    // form differs from the loaded tournament. Cuts noise on the wire and
    // makes backend reasoning about "dirty fields" trivial.
    const payload: TournamentUpdatePayload = {};

    const nextDescription = description.trim() === "" ? null : description.trim();
    if (nextDescription !== (tournament.description ?? null)) {
      payload.description = nextDescription;
    }

    const nextBanner = bannerUrl.trim() === "" ? null : bannerUrl.trim();
    if (nextBanner !== (tournament.banner_url ?? null)) {
      payload.banner_url = nextBanner;
    }

    const nextStream = streamUrl.trim() === "" ? null : streamUrl.trim();
    if (nextStream !== (tournament.stream_url ?? null)) {
      payload.stream_url = nextStream;
    }

    const nextFormatLabel = formatLabel.trim() === "" ? null : formatLabel.trim();
    if (nextFormatLabel !== (tournament.format_label ?? null)) {
      payload.format_label = nextFormatLabel;
    }

    // Prize pool: two scalars on the write API. Backend's PATCH coupling is
    // relaxed (commit 24) so we can send just one if only one changed.
    const trimmedAmount = prizeAmount.trim();
    const nextAmount: number | null = trimmedAmount === "" ? null : Number(trimmedAmount);
    if (trimmedAmount !== "" && !Number.isFinite(nextAmount)) {
      setFormError("Prize pool amount must be a number.");
      return;
    }
    const nextCurrency: string | null = trimmedAmount === "" ? null : prizeCurrency;
    const prevAmount = tournament.prize_pool?.amount ?? null;
    const prevCurrency = tournament.prize_pool?.currency ?? null;
    if (nextAmount !== prevAmount) payload.prize_pool_amount = nextAmount;
    if (nextCurrency !== prevCurrency) payload.prize_pool_currency = nextCurrency;

    if (Object.keys(payload).length === 0) {
      // Nothing changed — close edit mode without round-tripping.
      setEditing(false);
      return;
    }

    startSave(async () => {
      try {
        const updated = await updateTournament(tournament.id, payload);
        onUpdated(updated);
        setEditing(false);
        toast.success("Details updated");
      } catch (err) {
        const msg =
          err instanceof ApiError && err.message
            ? err.message
            : err instanceof Error
              ? err.message
              : "Couldn't update details.";
        setFormError(msg);
      }
    });
  };

  const prizeDisplay = formatPrizePool(tournament.prize_pool);

  // Has any optional detail been set? If the row is blank everywhere, we
  // surface an empty-state hint instead of five dashes.
  const hasAnyDetail =
    (tournament.description?.trim() ?? "") !== "" ||
    (tournament.banner_url?.trim() ?? "") !== "" ||
    (tournament.stream_url?.trim() ?? "") !== "" ||
    (tournament.format_label?.trim() ?? "") !== "" ||
    prizeDisplay !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Details</p>
        {editable && !editing ? (
          <button
            type="button"
            aria-label="Edit details"
            onClick={startEdit}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-edit-description">Description</Label>
            <Textarea
              id="t-edit-description"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              placeholder="What's this tournament about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end">
              <p
                className={`text-[0.65rem] tabular-nums ${
                  description.length > DESCRIPTION_MAX - 50
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {description.length} / {DESCRIPTION_MAX}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-edit-format">Format label</Label>
            <Input
              id="t-edit-format"
              maxLength={30}
              placeholder="3v3"
              value={formatLabel}
              onChange={(e) => setFormatLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Freeform team-size hint surfaced on the public tournament page.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label>Prize pool</Label>
              {prizeAmount.trim() !== "" || prizeCurrency !== "MVR" ? (
                <button
                  type="button"
                  onClick={clearPrizePool}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear prize pool
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                id="t-edit-prize-amount"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
              />
              <RadioGroup
                value={prizeCurrency}
                onValueChange={(v) => setPrizeCurrency(v as "MVR" | "USD")}
                className="flex gap-2"
              >
                {(["MVR", "USD"] as const).map((code) => (
                  <Label
                    key={code}
                    htmlFor={`t-edit-prize-currency-${code}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/40 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                  >
                    <RadioGroupItem id={`t-edit-prize-currency-${code}`} value={code} />
                    <span className="text-sm font-medium">{code}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-edit-stream">Stream URL</Label>
            <Input
              id="t-edit-stream"
              type="url"
              maxLength={2048}
              placeholder="https://twitch.tv/..."
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-edit-banner">Banner URL</Label>
            <Input
              id="t-edit-banner"
              type="url"
              maxLength={2048}
              placeholder="https://example.com/banner.png"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : !hasAnyDetail ? (
        <p className="text-sm text-muted-foreground italic">
          {editable
            ? "No details set yet. Add a description, format label, prize pool, stream, or banner."
            : "No details set."}
        </p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {tournament.format_label ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Format</dt>
              <dd className="text-sm">{tournament.format_label}</dd>
            </div>
          ) : null}
          {prizeDisplay ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Prize pool</dt>
              <dd className="text-sm">{prizeDisplay}</dd>
            </div>
          ) : null}
          {tournament.stream_url ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Stream</dt>
              <dd className="text-sm">
                <a
                  href={tournament.stream_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {tournament.stream_url}
                </a>
              </dd>
            </div>
          ) : null}
          {tournament.banner_url ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Banner</dt>
              <dd className="text-sm">
                <a
                  href={tournament.banner_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {tournament.banner_url}
                </a>
              </dd>
            </div>
          ) : null}
          {tournament.description ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Description</dt>
              <dd className="whitespace-pre-wrap text-sm text-muted-foreground">
                {tournament.description}
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}
