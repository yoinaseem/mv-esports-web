"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  Edit01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

import { listGames } from "@/lib/api/games";
import type { Game } from "@/types/games";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GameFormDialog } from "@/components/games/GameFormDialog";
import { DeleteGameDialog } from "@/components/games/DeleteGameDialog";

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const list = await listGames({ includeInactive });
      setGames(list);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load games.");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void fetchGames();
  }, [fetchGames]);

  const openCreate = () => {
    setEditingGame(null);
    setFormOpen(true);
  };

  const openEdit = (game: Game) => {
    setEditingGame(game);
    setFormOpen(true);
  };

  const openDelete = (game: Game) => {
    setDeletingGame(game);
    setDeleteOpen(true);
  };

  const handleSaved = (saved: Game) => {
    setGames((prev) => {
      const exists = prev.some((g) => g.id === saved.id);
      const next = exists ? prev.map((g) => (g.id === saved.id ? saved : g)) : [...prev, saved];
      return next.slice().sort((a, b) => a.name.localeCompare(b.name));
    });
    toast.success(editingGame ? `Updated ${saved.name}` : `Added ${saved.name}`);
  };

  const handleDeleted = (deleted: Game) => {
    setGames((prev) => prev.filter((g) => g.id !== deleted.id));
    toast.success(`Deleted ${deleted.name}`);
  };

  const visibleGames = includeInactive ? games : games.filter((g) => g.is_active);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Catalog</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Games</h1>
          <p className="text-sm text-muted-foreground">
            The catalog of titles tournaments can be hosted for. Inactive games stay in the database but can&apos;t be selected for new tournaments.
          </p>
        </div>
        <Button onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          New game
        </Button>
      </header>

      <div className="flex items-center gap-2">
        <Checkbox
          id="include-inactive"
          checked={includeInactive}
          onCheckedChange={(checked) => setIncludeInactive(checked === true)}
        />
        <Label htmlFor="include-inactive" className="cursor-pointer text-sm font-normal">
          Show inactive
        </Label>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-40">Slug</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="size-8 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-destructive">
                  {loadError}{" "}
                  <button type="button" onClick={() => void fetchGames()} className="font-medium text-primary hover:underline">
                    Retry
                  </button>
                </TableCell>
              </TableRow>
            ) : visibleGames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {games.length === 0
                    ? "No games in the catalog yet."
                    : "No matching games. Toggle “Show inactive” to see archived ones."}
                </TableCell>
              </TableRow>
            ) : (
              visibleGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    {game.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.icon_url}
                        alt=""
                        className="size-8 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded-md bg-muted" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <code className="text-xs">{game.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={game.is_active ? "outline" : "secondary"}>
                      {game.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${game.name}`}>
                            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(game)}>
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => openDelete(game)}>
                            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GameFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        game={editingGame}
        onSaved={handleSaved}
      />
      <DeleteGameDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        game={deletingGame}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
