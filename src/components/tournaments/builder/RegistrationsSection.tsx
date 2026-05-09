"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import {
  deleteRegistration,
  updateRegistration,
} from "@/lib/api/registrations";
import { participantDisplayName } from "@/types/participants";
import type {
  RegistrationStatus,
  TournamentRegistration,
} from "@/types/registrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FilterValue = "pending" | "approved" | "all";

const TAB_VALUES: ReadonlyArray<FilterValue> = ["pending", "approved", "all"];
const TAB_LABELS: Record<FilterValue, string> = {
  pending: "Pending",
  approved: "Approved",
  all: "All",
};

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function statusBadgeVariant(status: RegistrationStatus): "default" | "outline" | "destructive" | "secondary" {
  if (status === "pending") return "default";
  if (status === "approved") return "outline";
  if (status === "rejected" || status === "withdrawn") return "destructive";
  return "secondary";
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatRegisteredAt(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

type SeedCellProps = {
  registration: TournamentRegistration;
  onUpdate: (updated: TournamentRegistration) => void;
  disabled: boolean;
};

function SeedCell({ registration, onUpdate, disabled }: SeedCellProps) {
  const [value, setValue] = useState<string>(registration.seed?.toString() ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(registration.seed?.toString() ?? "");
  }, [registration.seed]);

  const commit = async () => {
    const trimmed = value.trim();
    const next: number | null = trimmed === "" ? null : Number(trimmed);
    if (next === registration.seed) return;
    if (Number.isNaN(next as number)) {
      setValue(registration.seed?.toString() ?? "");
      return;
    }
    setPending(true);
    try {
      const updated = await updateRegistration(
        registration.tournament_id,
        registration.id,
        { seed: next },
      );
      onUpdate(updated);
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't update seed.";
      toast.error(message);
      setValue(registration.seed?.toString() ?? "");
    } finally {
      setPending(false);
    }
  };

  return (
    <Input
      type="number"
      min={1}
      placeholder="—"
      className="h-8 w-20"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={disabled || pending}
    />
  );
}

type RegistrationsSectionProps = {
  tournamentId: number;
  registrations: ReadonlyArray<TournamentRegistration>;
  onChange: (next: TournamentRegistration[]) => void;
  // Default tab to land on. Parent picks based on tournament status — Pending
  // makes sense while registration is open (host clears the queue), Approved
  // makes sense once registration is closed (host fine-tunes seeds).
  defaultTab?: FilterValue;
  // Seeds become locked once the bracket is built. Lock means: still visible,
  // but no inline editing of seed values or status.
  locked?: boolean;
};

export function RegistrationsSection({
  tournamentId,
  registrations,
  onChange,
  defaultTab = "pending",
  locked = false,
}: RegistrationsSectionProps) {
  const [filter, setFilter] = useState<FilterValue>(defaultTab);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const counts = {
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    all: registrations.length,
  };

  const filtered = registrations.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const replace = (updated: TournamentRegistration) => {
    onChange(registrations.map((r) => (r.id === updated.id ? updated : r)));
  };

  const remove = (deletedId: number) => {
    onChange(registrations.filter((r) => r.id !== deletedId));
  };

  const setStatus = async (registration: TournamentRegistration, status: RegistrationStatus) => {
    setPendingActionId(registration.id);
    try {
      const updated = await updateRegistration(tournamentId, registration.id, { status });
      replace(updated);
      toast.success(
        status === "approved"
          ? `Approved ${participantDisplayName(registration.participant ?? null)}`
          : status === "rejected"
            ? `Rejected ${participantDisplayName(registration.participant ?? null)}`
            : `Updated ${participantDisplayName(registration.participant ?? null)}`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't update registration.";
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (registration: TournamentRegistration) => {
    setPendingActionId(registration.id);
    try {
      await deleteRegistration(tournamentId, registration.id);
      remove(registration.id);
      toast.success(`Removed ${participantDisplayName(registration.participant ?? null)}`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't remove registration.";
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
        <TabsList>
          {TAB_VALUES.map((value) => (
            <TabsTrigger key={value} value={value}>
              <span>{TAB_LABELS[value]}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">{counts[value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Seed</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">Registered</TableHead>
              <TableHead className="w-44">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {registrations.length === 0
                    ? "No registrations yet."
                    : `No ${filter} registrations.`}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((reg) => {
                const isApproved = reg.status === "approved";
                const isPending = reg.status === "pending";
                const actionInFlight = pendingActionId === reg.id;
                return (
                  <TableRow key={reg.id}>
                    <TableCell>
                      {isApproved ? (
                        <SeedCell
                          registration={reg}
                          onUpdate={replace}
                          disabled={locked}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{reg.seed ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {participantDisplayName(reg.participant ?? null)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(reg.status)}>
                        {STATUS_LABELS[reg.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRegisteredAt(reg.registered_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {isPending && !locked ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionInFlight}
                              onClick={() => void setStatus(reg, "approved")}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actionInFlight}
                              onClick={() => void setStatus(reg, "rejected")}
                            >
                              <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
                              Reject
                            </Button>
                          </>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${participantDisplayName(reg.participant ?? null)}`}
                              disabled={actionInFlight}
                            >
                              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isApproved && !locked ? (
                              <DropdownMenuItem onSelect={() => void setStatus(reg, "withdrawn")}>
                                <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
                                Mark withdrawn
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => void handleDelete(reg)}
                            >
                              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
