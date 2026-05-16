"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { formatLabel } from "@/types/stages";
import {
  isStageBuildable,
  type PreviewParticipant,
  type PreviewRound1Slot,
  type PreviewStage,
  type SeedAndBuildPreview,
} from "@/types/seed-preview";
import { Badge } from "@/components/ui/badge";

type Props = {
  preview: SeedAndBuildPreview;
};

// Reusable rendering of the preview payload. Used in both the live preview
// panel (inside the Registrations card during RegistrationClosed) and the
// seed-and-build confirmation dialog. Pure presentation — caller owns fetch.
export function SeedAndBuildPreview({ preview }: Props) {
  if (preview.stages.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        No entry stages to preview.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {preview.stages.map((stage) => (
        <StageBlock key={stage.stage_id} stage={stage} />
      ))}
    </div>
  );
}

function StageBlock({ stage }: { stage: PreviewStage }) {
  const formatLabelText = formatLabel({
    format: stage.format,
    config: isStageBuildable(stage) && stage.format === "round_robin" ? stage.config : undefined,
  });

  return (
    <div className="space-y-3 rounded-md border border-border bg-card/40 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold">{stage.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatLabelText} · {stage.approved_count} approved
          </p>
        </div>
        {isStageBuildable(stage) ? (
          <Badge variant="outline" className="text-[0.65rem] uppercase tracking-widest">
            {stage.matches_total} match{stage.matches_total === 1 ? "" : "es"}
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-[0.65rem] uppercase tracking-widest">
            Not buildable
          </Badge>
        )}
      </header>

      {!isStageBuildable(stage) ? (
        <Unbuildable reason={stage.reason} supportedSizes={stage.supported_sizes} />
      ) : stage.format === "round_robin" ? (
        <RoundRobinBlock stage={stage} />
      ) : stage.format === "single_elim" ? (
        <SingleElimBlock stage={stage} />
      ) : (
        <DoubleElimBlock stage={stage} />
      )}
    </div>
  );
}

function Unbuildable({
  reason,
  supportedSizes,
}: {
  reason: string;
  supportedSizes?: number[];
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p>{reason}</p>
        {supportedSizes && supportedSizes.length > 0 ? (
          <p className="text-muted-foreground">
            Supported sizes: {supportedSizes.join(", ")}.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RoundRobinBlock({
  stage,
}: {
  stage: Extract<PreviewStage, { format: "round_robin"; buildable: true }>;
}) {
  return (
    <div className="space-y-3">
      {stage.groups.map((group) => (
        <div key={group.group_number} className="rounded-md border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Group {group.group_number}
            </p>
            <span className="text-[0.65rem] text-muted-foreground tabular-nums">
              {group.matches_in_group} match{group.matches_in_group === 1 ? "" : "es"}
              {group.has_phantom_bye ? " · bye round" : ""}
            </span>
          </div>
          <ParticipantList participants={group.participants} />
        </div>
      ))}
      {stage.groups.some((g) => g.has_phantom_bye) ? (
        <p className="flex items-start gap-1.5 text-[0.65rem] text-muted-foreground">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="mt-0.5 size-3 shrink-0" />
          Groups with an odd participant count include one bye round per leg.
        </p>
      ) : null}
    </div>
  );
}

function SingleElimBlock({
  stage,
}: {
  stage: Extract<PreviewStage, { format: "single_elim"; buildable: true }>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Bracket size <span className="font-medium tabular-nums text-foreground">{stage.bracket_size}</span>
        {stage.byes > 0 ? (
          <>
            {" "}· <span className="font-medium tabular-nums text-foreground">{stage.byes}</span> bye{stage.byes === 1 ? "" : "s"} to top seed{stage.byes === 1 ? "" : "s"}
          </>
        ) : null}
      </p>
      <Round1List slots={stage.round_1} title="Round 1" />
    </div>
  );
}

function DoubleElimBlock({
  stage,
}: {
  stage: Extract<PreviewStage, { format: "double_elim"; buildable: true }>;
}) {
  const { winners, losers, grand_final } = stage.bracket_counts;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Winners <span className="font-medium tabular-nums text-foreground">{winners}</span>
        {" "}· Losers <span className="font-medium tabular-nums text-foreground">{losers}</span>
        {" "}· Grand final <span className="font-medium tabular-nums text-foreground">{grand_final}</span>
      </p>
      <Round1List slots={stage.winners_round_1} title="Winners round 1" />
    </div>
  );
}

function Round1List({ slots, title }: { slots: PreviewRound1Slot[]; title: string }) {
  if (slots.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
        No round 1 matches.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {slots.map((slot) => (
          <li
            key={slot.position}
            className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 rounded-md border border-border bg-muted/10 px-2 py-1.5 text-xs"
          >
            <Badge variant="secondary" className="font-mono text-[0.6rem]">
              M{slot.position + 1}
            </Badge>
            {slot.kind === "match" ? (
              <>
                <ParticipantInline participant={slot.a} align="right" />
                <span className="text-muted-foreground">vs</span>
                <ParticipantInline participant={slot.b} align="left" />
              </>
            ) : (
              <>
                <ParticipantInline participant={slot.a} align="right" />
                <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  bye
                </span>
                <span className="text-muted-foreground italic">advances</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ParticipantList({ participants }: { participants: PreviewParticipant[] }) {
  return (
    <ul className="space-y-1">
      {participants.map((p) => (
        <li
          key={p.registration_id}
          className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5 text-xs"
        >
          <Badge variant="secondary" className="font-mono text-[0.6rem] tabular-nums">
            {p.seed}
          </Badge>
          <span className="font-medium">{p.name}</span>
        </li>
      ))}
    </ul>
  );
}

function ParticipantInline({
  participant,
  align,
}: {
  participant: PreviewParticipant;
  align: "left" | "right";
}) {
  return (
    <span
      className={`flex items-center gap-1.5 truncate ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      <Badge variant="secondary" className="font-mono text-[0.6rem] tabular-nums">
        {participant.seed}
      </Badge>
      <span className="truncate font-medium">{participant.name}</span>
    </span>
  );
}
