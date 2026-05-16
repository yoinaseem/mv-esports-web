"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon } from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { updateTournament } from "@/lib/api/tournaments";
import type { Tournament } from "@/types/tournaments";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const datetimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return datetimeFormatter.format(new Date(iso));
}

// Backend serialises datetimes as UTC-ISO ("2026-05-09T18:31:39.000000Z").
// Our DateTimePicker takes / returns local-form YYYY-MM-DDTHH:mm. Convert.
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function isoToLocalInput(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

type Props = {
  tournament: Tournament;
  onUpdated: (next: Tournament) => void;
  editable: boolean;
};

export function ScheduleSection({ tournament, onUpdated, editable }: Props) {
  const [editingTournament, setEditingTournament] = useState(false);
  const [tStart, setTStart] = useState<string | null>(tournament.start_date);
  const [tEnd, setTEnd] = useState<string | null>(tournament.end_date);

  const [editingRegistration, setEditingRegistration] = useState(false);
  const [rOpens, setROpens] = useState<string | null>(
    isoToLocalInput(tournament.registration_opens_at),
  );
  const [rCloses, setRCloses] = useState<string | null>(
    isoToLocalInput(tournament.registration_closes_at),
  );

  const [saving, startSave] = useTransition();

  const startTournamentEdit = () => {
    setTStart(tournament.start_date);
    setTEnd(tournament.end_date);
    setEditingTournament(true);
  };

  const startRegistrationEdit = () => {
    setROpens(isoToLocalInput(tournament.registration_opens_at));
    setRCloses(isoToLocalInput(tournament.registration_closes_at));
    setEditingRegistration(true);
  };

  const submitTournament = () => {
    if (!tStart || !tEnd) {
      toast.error("Pick both a start and end date.");
      return;
    }
    startSave(async () => {
      try {
        const updated = await updateTournament(tournament.id, {
          start_date: tStart,
          end_date: tEnd,
        });
        onUpdated(updated);
        setEditingTournament(false);
        toast.success("Tournament window updated");
      } catch (err) {
        const msg =
          err instanceof ApiError && err.message
            ? err.message
            : err instanceof Error
              ? err.message
              : "Couldn't update tournament window.";
        toast.error(msg);
      }
    });
  };

  const submitRegistration = () => {
    if (!rOpens || !rCloses) {
      toast.error("Pick both an opens-at and closes-at time.");
      return;
    }
    startSave(async () => {
      try {
        const updated = await updateTournament(tournament.id, {
          registration_opens_at: rOpens,
          registration_closes_at: rCloses,
        });
        onUpdated(updated);
        setEditingRegistration(false);
        toast.success("Registration window updated");
      } catch (err) {
        const msg =
          err instanceof ApiError && err.message
            ? err.message
            : err instanceof Error
              ? err.message
              : "Couldn't update registration window.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Tournament window */}
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Tournament window
          </p>
          {editable && !editingTournament ? (
            <button
              type="button"
              aria-label="Edit tournament window"
              onClick={startTournamentEdit}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          ) : null}
        </div>
        {editingTournament ? (
          <div className="mt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <DatePicker value={tStart} onChange={setTStart} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End</Label>
              <DatePicker value={tEnd} onChange={setTEnd} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={submitTournament} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingTournament(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm">
            {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
          </p>
        )}
      </div>

      {/* Registration window */}
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Registration window
          </p>
          {editable && !editingRegistration ? (
            <button
              type="button"
              aria-label="Edit registration window"
              onClick={startRegistrationEdit}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          ) : null}
        </div>
        {editingRegistration ? (
          <div className="mt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Opens</Label>
              <DateTimePicker value={rOpens} onChange={setROpens} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Closes</Label>
              <DateTimePicker value={rCloses} onChange={setRCloses} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={submitRegistration} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingRegistration(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm">
            {formatDateTime(tournament.registration_opens_at)} →{" "}
            {formatDateTime(tournament.registration_closes_at)}
          </p>
        )}
      </div>
    </div>
  );
}
