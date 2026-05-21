"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { SlantedCard } from "@/components/site/SlantedCard";
import { SlantedInput } from "@/components/site/SlantedInput";
import { SlantedPagination } from "@/components/site/SlantedPagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SlantedSelectTrigger,
} from "@/components/site/SlantedSelect";
import {
  SlantedDateRangePicker,
  type SlantedDateRangeValue,
} from "@/components/site/SlantedDateRangePicker";
import type { Game } from "@/types/games";
import type { Tournament } from "@/types/tournaments";

const PAGE_SIZE = 12;

function isLive(t: Tournament): boolean {
  return (t.live_match_count ?? 0) > 0;
}

function statusLabelFor(t: Tournament): string {
  if (isLive(t)) return "Live now";
  if (t.status === "completed") return "Completed";
  if (t.status === "cancelled") return "Cancelled";
  return format(new Date(t.start_date), "MMM d");
}

function tagFor(t: Tournament): string | undefined {
  const game = t.game?.name;
  const ptype = t.participant_type === "team" ? "TEAM" : "PLAYER";
  if (!game) return ptype;
  return `${game} · ${ptype}`;
}

const EMPTY_RANGE: SlantedDateRangeValue = { from: null, to: null };

type FilterableTournamentListProps = {
  tournaments: ReadonlyArray<Tournament>;
  games: ReadonlyArray<Game>;
};

export function FilterableTournamentList({
  tournaments,
  games,
}: FilterableTournamentListProps) {
  const [keyword, setKeyword] = useState("");
  const [gameSlug, setGameSlug] = useState<string>("all");
  const [dateRange, setDateRange] = useState<SlantedDateRangeValue>(EMPTY_RANGE);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return tournaments.filter((t) => {
      if (kw && !t.name.toLowerCase().includes(kw)) return false;
      if (gameSlug !== "all" && t.game?.slug !== gameSlug) return false;

      if (dateRange.from || dateRange.to) {
        // start_date is YYYY-MM-DD from backend — direct string compare works.
        if (dateRange.from && t.start_date < dateRange.from) return false;
        if (dateRange.to && t.start_date > dateRange.to) return false;
      }

      return true;
    });
  }, [tournaments, keyword, gameSlug, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever filters narrow the dataset out from under us.
  useEffect(() => {
    setPage(1);
  }, [keyword, gameSlug, dateRange]);

  const hasFilters =
    keyword.trim() !== "" ||
    gameSlug !== "all" ||
    dateRange.from !== null ||
    dateRange.to !== null;

  function clearFilters() {
    setKeyword("");
    setGameSlug("all");
    setDateRange(EMPTY_RANGE);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_16rem_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="tournament-keyword" className="kicker">
            Search
          </label>
          <SlantedInput
            id="tournament-keyword"
            placeholder="TOURNAMENT NAME…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="kicker">Game</span>
          <Select value={gameSlug} onValueChange={setGameSlug}>
            <SlantedSelectTrigger>
              <SelectValue />
            </SlantedSelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {games.map((g) => (
                <SelectItem key={g.slug} value={g.slug}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="kicker">Date range</span>
          <SlantedDateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          aria-label="Clear filters"
          title="Clear filters"
          className="group inline-flex size-12 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-30 lg:self-end"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2.5}
            className="size-5"
          />
        </button>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        Showing {filtered.length} of {tournaments.length}
      </p>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {paged.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="block focus-visible:outline-none"
              >
                <SlantedCard
                  title={t.name}
                  tag={tagFor(t)}
                  statusLabel={statusLabelFor(t)}
                  live={isLive(t)}
                />
              </Link>
            ))}
          </div>

          <SlantedPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-4"
          />
        </>
      ) : (
        <div className="border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No tournaments match these filters.
          </p>
        </div>
      )}
    </div>
  );
}
