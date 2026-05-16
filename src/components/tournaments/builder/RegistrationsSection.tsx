"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete01Icon,
  DragDropVerticalIcon,
  MoreHorizontalIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ApiError } from "@/lib/api-client";
import {
  bulkUpdateSeeds,
  deleteRegistration,
  updateRegistration,
} from "@/lib/api/registrations";
import { participantDisplayName } from "@/types/participants";
import type {
  RegistrationStatus,
  TournamentRegistration,
} from "@/types/registrations";
import type { SeedAndBuildPreview } from "@/types/seed-preview";
import type { TournamentStatus } from "@/types/tournaments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeedAndBuildPreview as SeedAndBuildPreviewView } from "@/components/tournaments/builder/SeedAndBuildPreview";

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

const SEED_DEBOUNCE_MS = 300;

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

// Stable seed-aware sort. Null seeds (newly-approved rows the host hasn't
// positioned yet) trail at the bottom, ordered by registered_at so new
// arrivals append predictably.
function sortApproved(approved: ReadonlyArray<TournamentRegistration>): TournamentRegistration[] {
  return approved.slice().sort((a, b) => {
    const aSeed = a.seed;
    const bSeed = b.seed;
    if (aSeed != null && bSeed != null) return aSeed - bSeed;
    if (aSeed != null) return -1;
    if (bSeed != null) return 1;
    return a.registered_at.localeCompare(b.registered_at);
  });
}

type RegistrationsSectionProps = {
  tournamentId: number;
  tournamentStatus: TournamentStatus;
  registrations: ReadonlyArray<TournamentRegistration>;
  onChange: (next: TournamentRegistration[]) => void;
  defaultTab?: FilterValue;
  locked?: boolean;
  // Preview state owned by the parent (so the seed-and-build confirmation
  // dialog can read the same payload). RegistrationsSection renders it
  // inline on the approved tab when status is registration_closed.
  preview?: SeedAndBuildPreview | null;
  previewLoading?: boolean;
  previewError?: string;
  // Fired after a successful bulk-seed PATCH so the parent refetches preview.
  onSeedsApplied?: () => void;
};

export function RegistrationsSection({
  tournamentId,
  tournamentStatus,
  registrations,
  onChange,
  defaultTab = "pending",
  locked = false,
  preview,
  previewLoading,
  previewError,
  onSeedsApplied,
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

      {filter === "approved" ? (
        <ApprovedSortableList
          tournamentId={tournamentId}
          tournamentStatus={tournamentStatus}
          registrations={registrations}
          approved={filtered}
          locked={locked}
          onChange={onChange}
          onSetStatus={setStatus}
          onDelete={handleDelete}
          pendingActionId={pendingActionId}
          preview={preview ?? null}
          previewLoading={previewLoading}
          previewError={previewError}
          onSeedsApplied={onSeedsApplied}
        />
      ) : (
        <NonApprovedTable
          registrations={registrations}
          filtered={filtered}
          filter={filter}
          locked={locked}
          onSetStatus={setStatus}
          onDelete={handleDelete}
          pendingActionId={pendingActionId}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approved tab — drag-and-drop sortable list driving the bulk-seed endpoint.
// ---------------------------------------------------------------------------

type ApprovedSortableListProps = {
  tournamentId: number;
  tournamentStatus: TournamentStatus;
  registrations: ReadonlyArray<TournamentRegistration>;
  approved: ReadonlyArray<TournamentRegistration>;
  locked: boolean;
  onChange: (next: TournamentRegistration[]) => void;
  onSetStatus: (registration: TournamentRegistration, status: RegistrationStatus) => Promise<void>;
  onDelete: (registration: TournamentRegistration) => Promise<void>;
  pendingActionId: number | null;
  preview: SeedAndBuildPreview | null;
  previewLoading?: boolean;
  previewError?: string;
  onSeedsApplied?: () => void;
};

function ApprovedSortableList({
  tournamentId,
  tournamentStatus,
  registrations,
  approved,
  locked,
  onChange,
  onSetStatus,
  onDelete,
  pendingActionId,
  preview,
  previewLoading,
  previewError,
  onSeedsApplied,
}: ApprovedSortableListProps) {
  const sortedApproved = sortApproved(approved);
  // SortableContext takes a stable items array — registration ids.
  const sortableIds = sortedApproved.map((r) => r.id);

  const sensors = useSensors(
    // pointer activation threshold prevents accidental drags on small clicks
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Debounced bulk PATCH: coalesces rapid drags into one network call.
  const patchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bulkPending, setBulkPending] = useState(false);

  useEffect(() => {
    return () => {
      if (patchTimeoutRef.current) clearTimeout(patchTimeoutRef.current);
    };
  }, []);

  const triggerBulkPatch = (orderedApproved: ReadonlyArray<TournamentRegistration>) => {
    if (patchTimeoutRef.current) clearTimeout(patchTimeoutRef.current);
    const snapshot = orderedApproved.slice();
    patchTimeoutRef.current = setTimeout(async () => {
      patchTimeoutRef.current = null;
      setBulkPending(true);
      try {
        const assignments = snapshot.map((r, i) => ({
          registration_id: r.id,
          seed: i + 1,
        }));
        const updated = await bulkUpdateSeeds(tournamentId, assignments);
        // Reconcile: server returns the approved set ordered by seed.
        // Replace the corresponding rows in the parent's full list.
        const byId = new Map(updated.map((r) => [r.id, r]));
        const next = registrations.map((r) => byId.get(r.id) ?? r);
        onChange(next);
        onSeedsApplied?.();
      } catch (error) {
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : error instanceof Error
              ? error.message
              : "Couldn't update seeds.";
        toast.error(message);
        // Parent state is whatever it was before the optimistic update —
        // we already pushed the optimistic order via onChange. On failure,
        // we restore by handing back the registrations the parent showed
        // us (which we still have via the prop closure).
        onChange(registrations.slice());
      } finally {
        setBulkPending(false);
      }
    }, SEED_DEBOUNCE_MS);
  };

  const applyOptimisticReorder = (reordered: TournamentRegistration[]) => {
    // Stamp 1..N seeds onto the reordered approved list, then merge into the
    // parent's full registrations array (preserving non-approved rows).
    const reorderedWithSeeds = reordered.map((r, i) => ({ ...r, seed: i + 1 }));
    const byId = new Map(reorderedWithSeeds.map((r) => [r.id, r]));
    const next = registrations.map((r) => byId.get(r.id) ?? r);
    onChange(next);
    triggerBulkPatch(reorderedWithSeeds);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedApproved.findIndex((r) => r.id === active.id);
    const newIndex = sortedApproved.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sortedApproved, oldIndex, newIndex);
    applyOptimisticReorder(reordered);
  };

  const handleShuffle = () => {
    if (sortedApproved.length < 2) return;
    const arr = sortedApproved.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    applyOptimisticReorder(arr);
  };

  const showPreview = tournamentStatus === "registration_closed";
  const canReorder = !locked && sortedApproved.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {sortedApproved.length === 0
            ? "No approved registrations yet."
            : locked
              ? "Seeding is locked — the bracket has been built."
              : "Drag rows to reorder. Seeds apply 1..N from top."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShuffle}
          disabled={!canReorder || bulkPending}
        >
          <HugeiconsIcon icon={ShuffleIcon} strokeWidth={2} />
          Shuffle
        </Button>
      </div>

      {sortedApproved.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          {registrations.length === 0 ? "No registrations yet." : "No approved registrations."}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-3 border-b border-border bg-muted/30 px-3 py-2 text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
            <span className="sr-only">Handle</span>
            <span>Seed</span>
            <span>Participant</span>
            <span>Status</span>
            <span>Registered</span>
            <span className="sr-only">Actions</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-border">
                {sortedApproved.map((reg) => (
                  <SortableApprovedRow
                    key={reg.id}
                    registration={reg}
                    locked={locked}
                    actionInFlight={pendingActionId === reg.id}
                    onSetStatus={onSetStatus}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {showPreview ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Bracket preview
            </p>
            {previewLoading ? (
              <span className="text-[0.65rem] text-muted-foreground">Refreshing…</span>
            ) : null}
          </div>
          {previewError ? (
            <p className="text-xs text-destructive">{previewError}</p>
          ) : preview ? (
            <SeedAndBuildPreviewView preview={preview} />
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </div>
      ) : tournamentStatus === "registration_open" && sortedApproved.length > 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Bracket preview becomes available once registration closes.
        </p>
      ) : null}
    </div>
  );
}

type SortableApprovedRowProps = {
  registration: TournamentRegistration;
  locked: boolean;
  actionInFlight: boolean;
  onSetStatus: (registration: TournamentRegistration, status: RegistrationStatus) => Promise<void>;
  onDelete: (registration: TournamentRegistration) => Promise<void>;
};

function SortableApprovedRow({
  registration,
  locked,
  actionInFlight,
  onSetStatus,
  onDelete,
}: SortableApprovedRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: registration.id,
    disabled: locked,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const name = participantDisplayName(registration.participant ?? null);
  const seedLabel = registration.seed != null ? String(registration.seed) : "—";
  const needsSeed = registration.seed == null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-3 bg-card px-3 py-2 text-sm"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className={`flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
          locked ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
        }`}
        {...attributes}
        {...listeners}
        disabled={locked}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} className="size-4" />
      </button>
      <Badge variant={needsSeed ? "destructive" : "secondary"} className="font-mono tabular-nums">
        {seedLabel}
      </Badge>
      <span className="truncate font-medium">{name}</span>
      <Badge variant="outline">{STATUS_LABELS.approved}</Badge>
      <span className="text-xs text-muted-foreground">{formatRegisteredAt(registration.registered_at)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${name}`}
            disabled={actionInFlight}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!locked ? (
            <DropdownMenuItem onSelect={() => void onSetStatus(registration, "withdrawn")}>
              <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
              Mark withdrawn
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem variant="destructive" onSelect={() => void onDelete(registration)}>
            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Pending / All tabs — table layout (unchanged from prior shape).
// ---------------------------------------------------------------------------

type NonApprovedTableProps = {
  registrations: ReadonlyArray<TournamentRegistration>;
  filtered: ReadonlyArray<TournamentRegistration>;
  filter: FilterValue;
  locked: boolean;
  onSetStatus: (registration: TournamentRegistration, status: RegistrationStatus) => Promise<void>;
  onDelete: (registration: TournamentRegistration) => Promise<void>;
  pendingActionId: number | null;
};

function NonApprovedTable({
  registrations,
  filtered,
  filter,
  locked,
  onSetStatus,
  onDelete,
  pendingActionId,
}: NonApprovedTableProps) {
  return (
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
              const isPending = reg.status === "pending";
              const actionInFlight = pendingActionId === reg.id;
              return (
                <TableRow key={reg.id}>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{reg.seed ?? "—"}</span>
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
                            onClick={() => void onSetStatus(reg, "approved")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actionInFlight}
                            onClick={() => void onSetStatus(reg, "rejected")}
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
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => void onDelete(reg)}
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
  );
}
