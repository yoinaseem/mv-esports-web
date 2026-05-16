"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import { listGames } from "@/lib/api/games";
import { createStage } from "@/lib/api/stages";
import { createStageQualification } from "@/lib/api/stage-qualifications";
import {
  createTournamentApplication,
  createTournamentDraft,
} from "@/lib/api/tournaments";
import { slugify } from "@/lib/slugify";
import type { FieldErrors } from "@/types/auth";
import type { Game } from "@/types/games";
import type {
  QualificationConfig,
  QualificationRuleType,
} from "@/types/stage-qualifications";
import type { StageConfig } from "@/types/stages";
import type { ParticipantType, RegistrationType } from "@/types/tournaments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  newStageDraft,
  StageFormCard,
  type StageDraft,
} from "@/components/tournaments/builder/StageFormCard";

const PARTICIPANT_OPTIONS: ReadonlyArray<{ value: ParticipantType; label: string }> = [
  { value: "team", label: "Teams" },
  { value: "player", label: "Solo players" },
];

const REGISTRATION_OPTIONS: ReadonlyArray<{ value: RegistrationType; label: string; description: string }> = [
  { value: "open", label: "Open", description: "Anyone can register their team or player." },
  { value: "invite_only", label: "Invite only", description: "You invite participants directly." },
  { value: "signed_only", label: "Signed only", description: "Only signed team members may register." },
];

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoNowPlusHours(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildStageConfig(stage: StageDraft): StageConfig {
  // Backend defaults to bo1 when the key is absent. Only emit when the host
  // picked something else — keeps the payload minimal.
  const parsedBestOf = Number(stage.bestOf);
  const bestOf = Number.isFinite(parsedBestOf) && parsedBestOf > 1 ? parsedBestOf : undefined;
  const withBestOf = <T extends Record<string, unknown>>(base: T): T =>
    bestOf !== undefined ? ({ ...base, best_of: bestOf } as T) : base;

  if (stage.format === "single_elim") {
    const base = stage.thirdPlaceMatch ? { third_place_match: true } : {};
    return withBestOf(base) as StageConfig;
  }
  if (stage.format === "double_elim") {
    return withBestOf({ grand_final_reset: stage.grandFinalReset }) as StageConfig;
  }
  if (stage.format === "round_robin") {
    const base: Record<string, unknown> = {
      groups: Number(stage.rrGroups) || 1,
      group_size: Number(stage.rrGroupSize) || 2,
    };
    if (stage.rrAllowDraws) base.allow_draws = true;
    // Backend defaults to legs=1 (single round-robin). Only emit when > 1 so
    // the payload stays minimal and matches the convention used for best_of.
    const parsedLegs = Number(stage.rrLegs);
    if (Number.isFinite(parsedLegs) && parsedLegs > 1) base.legs = parsedLegs;
    return withBestOf(base) as StageConfig;
  }
  return {};
}

function buildQualificationConfig(
  ruleType: QualificationRuleType,
  stage: StageDraft,
): QualificationConfig {
  if (ruleType === "top_n") return { n: Number(stage.qualTopN) || 1 };
  if (ruleType === "top_n_per_group") {
    return { per_group: Number(stage.qualPerGroup) || 1, placement_strategy: "cross_group" };
  }
  return {};
}

export function TournamentCreateForm() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const isManager = hasRole("system_manager") || hasRole("superadmin");

  // Tournament basics
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [gameId, setGameId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [participantType, setParticipantType] = useState<ParticipantType>("team");
  const [registrationType, setRegistrationType] = useState<RegistrationType>("open");

  // Schedule
  const [startDate, setStartDate] = useState(todayPlusDays(14));
  const [endDate, setEndDate] = useState(todayPlusDays(15));
  const [registrationOpensAt, setRegistrationOpensAt] = useState(isoNowPlusHours(1));
  const [registrationClosesAt, setRegistrationClosesAt] = useState(isoNowPlusHours(72));
  const [maxParticipants, setMaxParticipants] = useState("8");

  // Optional links
  const [streamUrl, setStreamUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Stages — at least one, multiple allowed
  const [stages, setStages] = useState<StageDraft[]>(() => [
    newStageDraft({ name: "Main" }),
  ]);

  // Games for the select
  const [games, setGames] = useState<Game[]>([]);
  const [gamesError, setGamesError] = useState("");
  const [gamesPending, startGamesTransition] = useTransition();

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stageErrors, setStageErrors] = useState<Record<number, FieldErrors>>({});
  const [formError, setFormError] = useState("");
  const [submitting, startSubmitting] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startGamesTransition(async () => {
      try {
        const list = await listGames();
        if (cancelled) return;
        setGames(list);
        setGamesError("");
      } catch (error) {
        if (cancelled) return;
        setGamesError(error instanceof Error ? error.message : "Couldn't load games.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNameChange = (next: string) => {
    setName(next);
    if (!slugTouched) setSlug(slugify(next));
  };

  const updateStage = (index: number, update: Partial<StageDraft>) => {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const addStage = () => {
    setStages((prev) => {
      const lastIndex = prev.length - 1;
      const next = newStageDraft({
        name: prev.length === 1 ? "Playoffs" : `Stage ${prev.length + 1}`,
        // Common multi-stage default: pull from the immediately previous stage.
        qualSourceIndex: lastIndex,
        qualRuleType: "top_n_per_group",
      });
      return [...prev, next];
    });
  };

  const removeStage = (index: number) => {
    setStages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-anchor any later stages whose qualSourceIndex pointed at or past the removed one.
      return filtered.map((s, i) => {
        if (s.qualSourceIndex === null) return s;
        if (s.qualSourceIndex === index) {
          // Source disappeared — fall back to entry-from-registrations.
          return { ...s, qualSourceIndex: null, qualRuleType: "all" };
        }
        if (s.qualSourceIndex > index) {
          return { ...s, qualSourceIndex: s.qualSourceIndex - 1 };
        }
        return s;
      }).map((s, i) => ({
        ...s,
        // First stage's source must be null; defensive in case removal made stage 0 a non-first.
        ...(i === 0 ? { qualSourceIndex: null } : {}),
      }));
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setStageErrors({});
    setFormError("");

    if (!gameId) {
      setFieldErrors({ game_id: ["Pick a game."] });
      return;
    }

    // Frontend cross-validation that mirrors the backend's Draft-phase write-
    // path rule: cap and max must be equal at design time. RR entry stages
    // use groups × group_size; DE entry stages have no separate capacity, so
    // max itself must be one of the supported bracket sizes. Both decouple
    // (cap-vs-max only) once registration opens — but in the create form we
    // are always in Draft, so the strict rule always applies here.
    const maxParticipantsNum = maxParticipants ? Number(maxParticipants) : null;
    if (maxParticipantsNum != null && maxParticipantsNum > 0) {
      const firstStage = stages[0];
      if (firstStage && firstStage.format === "round_robin") {
        const groups = Math.max(1, Number(firstStage.rrGroups) || 0);
        const groupSize = Math.max(0, Number(firstStage.rrGroupSize) || 0);
        const capacity = groups * groupSize;
        if (capacity !== maxParticipantsNum) {
          setFormError(
            `Stage 1's capacity (${capacity}) must equal the tournament cap of ${maxParticipantsNum} while in Draft. Adjust groups, group size, or max participants so they match.`,
          );
          return;
        }
      } else if (firstStage && firstStage.format === "double_elim") {
        // DE has no separate capacity knob; max_participants itself must be
        // one of the supported bracket sizes. Persists past Draft too.
        const DE_VALID_SIZES: ReadonlySet<number> = new Set([4, 8, 16, 32]);
        if (!DE_VALID_SIZES.has(maxParticipantsNum)) {
          setFormError(
            `Stage 1 is double-elimination, which requires max participants of 4, 8, 16, or 32. Currently ${maxParticipantsNum}. Change either max participants or the stage format.`,
          );
          return;
        }
      }
    }

    const tournamentPayload = {
      name: name.trim(),
      slug: slug.trim(),
      game_id: Number(gameId),
      participant_type: participantType,
      registration_type: registrationType,
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate,
      registration_opens_at: registrationOpensAt,
      registration_closes_at: registrationClosesAt,
      stream_url: streamUrl.trim() || null,
      banner_url: bannerUrl.trim() || null,
      max_participants: maxParticipants ? Number(maxParticipants) : null,
    };

    startSubmitting(async () => {
      let tournamentId: number | null = null;
      try {
        const tournament = isManager
          ? await createTournamentDraft(tournamentPayload)
          : await createTournamentApplication(tournamentPayload);
        tournamentId = tournament.id;

        // Form-index → server stage id, so qualification source FKs resolve.
        const stageIdByIndex = new Map<number, number>();
        let firstStageError: { index: number; errors: FieldErrors; message: string } | null = null;

        for (let i = 0; i < stages.length; i++) {
          const draft = stages[i];
          try {
            const stage = await createStage(tournament.id, {
              name: draft.name.trim() || `Stage ${i + 1}`,
              format: draft.format,
              sort_order: i,
              config: buildStageConfig(draft),
            });
            stageIdByIndex.set(i, stage.id);

            const sourceStageId =
              draft.qualSourceIndex === null
                ? null
                : (stageIdByIndex.get(draft.qualSourceIndex) ?? null);

            await createStageQualification(tournament.id, stage.id, {
              source_stage_id: sourceStageId,
              rule_type: draft.qualRuleType,
              rule_config: buildQualificationConfig(draft.qualRuleType, draft),
            });
          } catch (innerError) {
            const errors =
              innerError instanceof ApiError && innerError.status === 422
                ? getValidationErrors(innerError)
                : {};
            const message =
              innerError instanceof Error && innerError.message
                ? innerError.message
                : "Stage configuration failed.";
            firstStageError = { index: i, errors, message };
            break;
          }
        }

        if (firstStageError) {
          setStageErrors({ [firstStageError.index]: firstStageError.errors });
          toast.warning(
            `Tournament created but stage ${firstStageError.index + 1} failed — finish from the builder.`,
          );
          router.replace(`/host/tournaments/${tournament.id}`);
          return;
        }

        toast.success(
          isManager ? `Created draft ${tournament.name}` : `Submitted ${tournament.name} for review`,
        );
        router.replace(`/host/tournaments/${tournament.id}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          const validationErrors = getValidationErrors(error);
          setFieldErrors(validationErrors);
          if (Object.keys(validationErrors).length === 0) {
            setFormError("Please review your input and try again.");
          }
          return;
        }
        if (error instanceof Error && error.message.trim()) {
          setFormError(error.message);
          return;
        }
        setFormError("Couldn't create the tournament. Try again.");
      }
    });
  };

  const renderFieldErrors = (key: string) =>
    fieldErrors[key]?.map((message) => (
      <p key={message} className="text-sm text-destructive">
        {message}
      </p>
    ));

  const busy = submitting;

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Name, game, and what kind of tournament this is.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-name">Name</Label>
            <Input
              id="t-name"
              required
              maxLength={255}
              placeholder="Demo Cup 2026"
              aria-invalid={fieldErrors.name?.length ? true : undefined}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            {renderFieldErrors("name")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-slug">Slug</Label>
            <Input
              id="t-slug"
              required
              maxLength={255}
              placeholder="demo-cup-2026"
              aria-invalid={fieldErrors.slug?.length ? true : undefined}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            {renderFieldErrors("slug")}
            <p className="text-xs text-muted-foreground">URL-friendly. Auto-derived from the name; edit if you want.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-game">Game</Label>
            <Select value={gameId} onValueChange={setGameId} disabled={gamesPending}>
              <SelectTrigger id="t-game" aria-invalid={fieldErrors.game_id?.length ? true : undefined}>
                <SelectValue placeholder={gamesPending ? "Loading…" : "Select a game"} />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={String(game.id)}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gamesError ? <p className="text-sm text-destructive">{gamesError}</p> : null}
            {renderFieldErrors("game_id")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="t-description"
              rows={3}
              placeholder="What's this tournament about?"
              aria-invalid={fieldErrors.description?.length ? true : undefined}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {renderFieldErrors("description")}
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <RadioGroup
              value={participantType}
              onValueChange={(v) => setParticipantType(v as ParticipantType)}
              className="grid grid-cols-2 gap-3"
            >
              {PARTICIPANT_OPTIONS.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`pt-${opt.value}`}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted/40 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                >
                  <RadioGroupItem id={`pt-${opt.value}`} value={opt.value} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
            {renderFieldErrors("participant_type")}
          </div>

          <div className="space-y-2">
            <Label>Registration</Label>
            <RadioGroup
              value={registrationType}
              onValueChange={(v) => setRegistrationType(v as RegistrationType)}
              className="grid gap-3 sm:grid-cols-3"
            >
              {REGISTRATION_OPTIONS.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`rt-${opt.value}`}
                  className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-border p-3 hover:bg-muted/40 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                >
                  <span className="flex items-center gap-2">
                    <RadioGroupItem id={`rt-${opt.value}`} value={opt.value} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </Label>
              ))}
            </RadioGroup>
            {renderFieldErrors("registration_type")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            Registration must close on or before the tournament start. Times are in your local timezone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-start">Start date</Label>
              <Input
                id="t-start"
                type="date"
                required
                aria-invalid={fieldErrors.start_date?.length ? true : undefined}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {renderFieldErrors("start_date")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-end">End date</Label>
              <Input
                id="t-end"
                type="date"
                required
                aria-invalid={fieldErrors.end_date?.length ? true : undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {renderFieldErrors("end_date")}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-reg-open">Registration opens</Label>
              <Input
                id="t-reg-open"
                type="datetime-local"
                required
                aria-invalid={fieldErrors.registration_opens_at?.length ? true : undefined}
                value={registrationOpensAt}
                onChange={(e) => setRegistrationOpensAt(e.target.value)}
              />
              {renderFieldErrors("registration_opens_at")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-reg-close">Registration closes</Label>
              <Input
                id="t-reg-close"
                type="datetime-local"
                required
                aria-invalid={fieldErrors.registration_closes_at?.length ? true : undefined}
                value={registrationClosesAt}
                onChange={(e) => setRegistrationClosesAt(e.target.value)}
              />
              {renderFieldErrors("registration_closes_at")}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-max">Max participants <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="t-max"
              type="number"
              min={2}
              placeholder="8"
              aria-invalid={fieldErrors.max_participants?.length ? true : undefined}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />
            {renderFieldErrors("max_participants")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Optional. Stream and banner can be added or changed later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-stream">Stream URL</Label>
            <Input
              id="t-stream"
              type="url"
              maxLength={2048}
              placeholder="https://twitch.tv/..."
              aria-invalid={fieldErrors.stream_url?.length ? true : undefined}
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
            {renderFieldErrors("stream_url")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-banner">Banner URL</Label>
            <Input
              id="t-banner"
              type="url"
              maxLength={2048}
              placeholder="https://example.com/banner.png"
              aria-invalid={fieldErrors.banner_url?.length ? true : undefined}
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
            {renderFieldErrors("banner_url")}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Stages</h2>
            <p className="text-sm text-muted-foreground">
              At least one. Add more for multi-stage tournaments (e.g. group stage → playoffs).
            </p>
          </div>
        </div>

        {stages.map((stage, index) => (
          <StageFormCard
            key={stage.id}
            index={index}
            stage={stage}
            previousStages={stages.slice(0, index)}
            canRemove={stages.length > 1}
            fieldErrors={stageErrors[index] ?? {}}
            onChange={(update) => updateStage(index, update)}
            onRemove={() => removeStage(index)}
            tournamentMaxParticipants={maxParticipants ? Number(maxParticipants) : null}
          />
        ))}

        <Button type="button" variant="outline" onClick={addStage} className="w-full">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add another stage
        </Button>
      </div>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={busy}>
          {busy
            ? "Creating…"
            : isManager
              ? "Create draft"
              : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
