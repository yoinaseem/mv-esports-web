"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";

import type { FieldErrors } from "@/types/auth";
import type { StageFormat } from "@/types/stages";
import type { QualificationRuleType } from "@/types/stage-qualifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export type StageDraft = {
  id: string;
  name: string;
  format: StageFormat;
  thirdPlaceMatch: boolean;
  grandFinalReset: boolean;
  rrGroups: string;
  rrGroupSize: string;
  qualSourceIndex: number | null; // null = entry from registrations
  qualRuleType: QualificationRuleType;
  qualTopN: string;
  qualPerGroup: string;
  // Default series length applied to every match this stage generates. Stored
  // as a string for clean Select binding; coerced to int on submit.
  bestOf: string;
};

export function newStageDraft(overrides: Partial<StageDraft> = {}): StageDraft {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `stage-${Math.random().toString(36).slice(2)}`,
    name: "Stage",
    format: "single_elim",
    thirdPlaceMatch: false,
    grandFinalReset: true,
    rrGroups: "1",
    rrGroupSize: "4",
    qualSourceIndex: null,
    qualRuleType: "all",
    qualTopN: "8",
    qualPerGroup: "2",
    bestOf: "1",
    ...overrides,
  };
}

const BEST_OF_OPTIONS = ["1", "3", "5", "7"] as const;

const FORMAT_OPTIONS: ReadonlyArray<{ value: StageFormat; label: string; description: string }> = [
  {
    value: "single_elim",
    label: "Single elimination",
    description: "One bracket. Handles non-power-of-2 via byes.",
  },
  {
    value: "double_elim",
    label: "Double elimination",
    description: "Winners + losers brackets. Power-of-2 only (4 / 8 / 16 / 32).",
  },
  {
    value: "round_robin",
    label: "Round robin",
    description: "Each participant plays every other. Optionally split into groups.",
  },
];

const ENTRY_RULE_OPTIONS: ReadonlyArray<{ value: QualificationRuleType; label: string; description: string }> = [
  { value: "all", label: "Everyone registered", description: "All approved registrations seed in directly." },
  { value: "manual", label: "Manual", description: "You'll populate participants by hand from the builder." },
];

const STAGE_RULE_OPTIONS: ReadonlyArray<{ value: QualificationRuleType; label: string; description: string }> = [
  { value: "top_n", label: "Top N", description: "The top N finishers from the source stage advance." },
  { value: "top_n_per_group", label: "Top N per group", description: "Top N from each group, with cross-group placement." },
  { value: "all", label: "All", description: "Everyone from the source stage advances." },
  { value: "manual", label: "Manual", description: "You'll populate participants by hand." },
];

type StageFormCardProps = {
  index: number;
  stage: StageDraft;
  previousStages: ReadonlyArray<StageDraft>;
  canRemove: boolean;
  fieldErrors: FieldErrors;
  onChange: (next: Partial<StageDraft>) => void;
  onRemove: () => void;
};

export function StageFormCard({
  index,
  stage,
  previousStages,
  canRemove,
  fieldErrors,
  onChange,
  onRemove,
}: StageFormCardProps) {
  const isFirst = index === 0;
  const sourceValue =
    stage.qualSourceIndex === null ? "registrations" : `stage-${stage.qualSourceIndex}`;
  const rulesForCurrentSource =
    stage.qualSourceIndex === null ? ENTRY_RULE_OPTIONS : STAGE_RULE_OPTIONS;

  const renderFieldErrors = (key: string) =>
    fieldErrors[key]?.map((message) => (
      <p key={message} className="text-sm text-destructive">{message}</p>
    ));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Stage {index + 1}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {isFirst
                ? "First stage. Participants come straight from registrations."
                : "Pulls participants from a previous stage's standings."}
            </p>
          </div>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label={`Remove stage ${index + 1}`}
            >
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`s-name-${stage.id}`}>Name</Label>
          <Input
            id={`s-name-${stage.id}`}
            required
            maxLength={255}
            value={stage.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {renderFieldErrors("name")}
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <RadioGroup
            value={stage.format}
            onValueChange={(v) => onChange({ format: v as StageFormat })}
            className="grid gap-3"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`fmt-${stage.id}-${opt.value}`}
                className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-border p-3 hover:bg-muted/40 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
              >
                <span className="flex items-center gap-2">
                  <RadioGroupItem id={`fmt-${stage.id}-${opt.value}`} value={opt.value} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {stage.format === "single_elim" ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`cfg-third-${stage.id}`}
              checked={stage.thirdPlaceMatch}
              onCheckedChange={(c) => onChange({ thirdPlaceMatch: c === true })}
            />
            <Label htmlFor={`cfg-third-${stage.id}`} className="cursor-pointer">
              Include third-place match
            </Label>
          </div>
        ) : null}

        {stage.format === "double_elim" ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`cfg-reset-${stage.id}`}
              checked={stage.grandFinalReset}
              onCheckedChange={(c) => onChange({ grandFinalReset: c === true })}
            />
            <Label htmlFor={`cfg-reset-${stage.id}`} className="cursor-pointer">
              Grand final reset (losers must beat winners twice)
            </Label>
          </div>
        ) : null}

        {stage.format === "round_robin" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`cfg-groups-${stage.id}`}>Groups</Label>
              <Input
                id={`cfg-groups-${stage.id}`}
                type="number"
                min={1}
                required
                value={stage.rrGroups}
                onChange={(e) => onChange({ rrGroups: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">1 = single round-robin without grouping.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cfg-size-${stage.id}`}>Group size</Label>
              <Input
                id={`cfg-size-${stage.id}`}
                type="number"
                min={2}
                required
                value={stage.rrGroupSize}
                onChange={(e) => onChange({ rrGroupSize: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Participants per group.</p>
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/20 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Series length
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Default for every match this stage generates. Hosts can override per-match
              from the score dialog (e.g. bumping the grand final to bo7).
            </p>
          </div>
          <Select
            value={stage.bestOf}
            onValueChange={(value) => onChange({ bestOf: value })}
          >
            <SelectTrigger className="w-32">
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

        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Qualification
          </p>

          <div className="space-y-2">
            <Label htmlFor={`qual-src-${stage.id}`}>Participants come from</Label>
            <Select
              value={sourceValue}
              onValueChange={(value) => {
                if (value === "registrations") {
                  // Entry-point: backend allows only `all` or `manual`.
                  const safeRule = stage.qualRuleType === "all" || stage.qualRuleType === "manual"
                    ? stage.qualRuleType
                    : "all";
                  onChange({ qualSourceIndex: null, qualRuleType: safeRule });
                } else {
                  const idx = Number(value.replace("stage-", ""));
                  onChange({ qualSourceIndex: idx });
                }
              }}
              disabled={isFirst}
            >
              <SelectTrigger id={`qual-src-${stage.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registrations">Tournament registrations</SelectItem>
                {previousStages.map((prev, prevIndex) => (
                  <SelectItem key={prev.id} value={`stage-${prevIndex}`}>
                    Stage {prevIndex + 1}: {prev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFirst ? (
              <p className="text-xs text-muted-foreground">
                The first stage always qualifies from registrations.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Rule</Label>
            <RadioGroup
              value={stage.qualRuleType}
              onValueChange={(v) => onChange({ qualRuleType: v as QualificationRuleType })}
              className="grid gap-2"
            >
              {rulesForCurrentSource.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`rule-${stage.id}-${opt.value}`}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-muted/40 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                >
                  <RadioGroupItem id={`rule-${stage.id}-${opt.value}`} value={opt.value} className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {stage.qualRuleType === "top_n" ? (
            <div className="space-y-2">
              <Label htmlFor={`rule-n-${stage.id}`}>How many</Label>
              <Input
                id={`rule-n-${stage.id}`}
                type="number"
                min={1}
                required
                value={stage.qualTopN}
                onChange={(e) => onChange({ qualTopN: e.target.value })}
              />
            </div>
          ) : null}

          {stage.qualRuleType === "top_n_per_group" ? (
            <div className="space-y-2">
              <Label htmlFor={`rule-pg-${stage.id}`}>How many per group</Label>
              <Input
                id={`rule-pg-${stage.id}`}
                type="number"
                min={1}
                required
                value={stage.qualPerGroup}
                onChange={(e) => onChange({ qualPerGroup: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Cross-group placement is applied automatically (1A vs 2B style).
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
