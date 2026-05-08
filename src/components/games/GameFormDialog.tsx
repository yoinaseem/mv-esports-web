"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import { createGame, updateGame } from "@/lib/api/games";
import { slugify } from "@/lib/slugify";
import type { Game } from "@/types/games";
import type { FieldErrors } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GameFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game | null;
  onSaved: (game: Game) => void;
};

export function GameFormDialog({ open, onOpenChange, game, onSaved }: GameFormDialogProps) {
  const isEdit = game !== null;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset / hydrate form whenever the dialog target changes.
  useEffect(() => {
    if (!open) return;
    if (game) {
      setName(game.name);
      setSlug(game.slug);
      setIconUrl(game.icon_url ?? "");
      setIsActive(game.is_active);
      setSlugTouched(true); // editing: don't overwrite the existing slug from name typing
    } else {
      setName("");
      setSlug("");
      setIconUrl("");
      setIsActive(true);
      setSlugTouched(false);
    }
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
  }, [open, game]);

  const handleNameChange = (next: string) => {
    setName(next);
    if (!slugTouched) {
      setSlug(slugify(next));
    }
  };

  const handleSlugChange = (next: string) => {
    setSlug(next);
    setSlugTouched(true);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      icon_url: iconUrl.trim() || null,
      is_active: isActive,
    };

    try {
      const saved = isEdit && game
        ? await updateGame(game.id, payload)
        : await createGame(payload);
      onSaved(saved);
      onOpenChange(false);
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
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit game" : "New game"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the catalog entry for this game."
              : "Add a game to the catalog. Tournaments can then be created against it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game-name">Name</Label>
            <Input
              id="game-name"
              name="name"
              type="text"
              required
              maxLength={255}
              placeholder="Valorant"
              aria-invalid={fieldErrors.name?.length ? true : undefined}
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
            {fieldErrors.name?.map((message) => (
              <p key={message} className="text-sm text-destructive">{message}</p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="game-slug">Slug</Label>
            <Input
              id="game-slug"
              name="slug"
              type="text"
              required
              maxLength={255}
              placeholder="valorant"
              aria-invalid={fieldErrors.slug?.length ? true : undefined}
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
            />
            {fieldErrors.slug?.map((message) => (
              <p key={message} className="text-sm text-destructive">{message}</p>
            ))}
            <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-derived from the name; edit if you want something different.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game-icon-url">Icon URL <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="game-icon-url"
              name="icon_url"
              type="url"
              maxLength={2048}
              placeholder="https://example.com/icon.png"
              aria-invalid={fieldErrors.icon_url?.length ? true : undefined}
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
            />
            {fieldErrors.icon_url?.map((message) => (
              <p key={message} className="text-sm text-destructive">{message}</p>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="game-is-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="game-is-active" className="cursor-pointer">Active</Label>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create game"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
