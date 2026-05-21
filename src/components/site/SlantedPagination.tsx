"use client";

import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

type SlantedPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const wrapVariants = {
  rest: { y: 0, skewX: -6 },
  hover: { y: -2, skewX: -6 },
};

// Standard "first, ellipsis, neighbours, ellipsis, last" range. Returns
// numbers + literal "ellipsis" sentinels.
function pageRange(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range: Array<number | "ellipsis"> = [1];
  if (current > 4) range.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 3) range.push("ellipsis");
  range.push(total);
  return range;
}

type PageButtonProps = {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
};

function PageButton({
  active,
  disabled,
  onClick,
  ariaLabel,
  children,
}: PageButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      initial="rest"
      whileHover={disabled ? undefined : "hover"}
      whileFocus={disabled ? undefined : "hover"}
      animate="rest"
      variants={wrapVariants}
      transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      className={cn(
        "relative inline-flex h-10 min-w-10 items-center justify-center px-3 text-sm font-semibold transition-colors duration-100 outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/30",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border-2 border-primary text-primary hover:bg-primary/10",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      <span
        className="display inline-flex items-center justify-center"
        style={{ transform: "skewX(6deg)" }}
      >
        {children}
      </span>
    </motion.button>
  );
}

export function SlantedPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SlantedPaginationProps) {
  if (totalPages <= 1) return null;

  const range = pageRange(currentPage, totalPages);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex w-full items-center justify-center gap-3", className)}
    >
      <PageButton
        disabled={prevDisabled}
        onClick={() => onPageChange(currentPage - 1)}
        ariaLabel="Previous page"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          strokeWidth={2.5}
          className="size-4"
        />
      </PageButton>

      <ul className="flex items-center gap-2">
        {range.map((entry, i) =>
          entry === "ellipsis" ? (
            <li
              key={`ellipsis-${i}`}
              aria-hidden
              className="font-mono text-sm text-muted-foreground"
            >
              ···
            </li>
          ) : (
            <li key={entry}>
              <PageButton
                active={entry === currentPage}
                onClick={() => onPageChange(entry)}
                ariaLabel={`Page ${entry}`}
              >
                {entry}
              </PageButton>
            </li>
          ),
        )}
      </ul>

      <PageButton
        disabled={nextDisabled}
        onClick={() => onPageChange(currentPage + 1)}
        ariaLabel="Next page"
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2.5}
          className="size-4"
        />
      </PageButton>
    </nav>
  );
}
