"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  discardUploadedPhotoAction,
  recordHikePhotoAction,
} from "@/features/hike-photos/actions";
import { compressImageForUpload } from "@/features/hike-photos/compress-image";
import {
  HIKE_PHOTOS_BUCKET,
  PHOTO_CAPTION_MAX_LENGTH,
  PHOTO_MAX_BYTES,
  buildPhotoStoragePath,
} from "@/features/hike-photos/constants";

type TaggableDog = { id: string; name: string };

type Props = {
  hikeId: string;
  companyId: string;
  dogs: TaggableDog[];
};

export function HikePhotoUpload({ hikeId, companyId, dogs }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  function toggleDog(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(
      selected.size === dogs.length ? new Set() : new Set(dogs.map((d) => d.id))
    );
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const dogIds = [...selected];
    let done = 0;
    const failures: string[] = [];

    for (const [index, file] of files.entries()) {
      const step = `${index + 1} of ${files.length}`;
      setProgress(`Compressing ${step}…`);
      let storagePath: string | null = null;
      try {
        const blob = await compressImageForUpload(file);
        if (blob.size > PHOTO_MAX_BYTES) {
          throw new Error("Photo is too large.");
        }

        setProgress(`Uploading ${step}…`);
        storagePath = buildPhotoStoragePath(
          companyId,
          hikeId,
          crypto.randomUUID()
        );
        const { error: uploadError } = await supabase.storage
          .from(HIKE_PHOTOS_BUCKET)
          .upload(storagePath, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw new Error("Upload failed. Check your signal.");

        setProgress(`Saving ${step}…`);
        const result = await recordHikePhotoAction({
          hikeId,
          storagePath,
          caption: caption || null,
          dogIds,
        });
        if (!result.ok) {
          await discardUploadedPhotoAction(storagePath).catch(() => undefined);
          throw new Error(result.error);
        }
        done += 1;
      } catch (err) {
        failures.push(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    }

    setUploadedCount((n) => n + done);
    setProgress(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (failures.length) {
      setError(
        `${failures.length} of ${files.length} didn't upload: ${failures[0]}`
      );
    } else {
      setCaption("");
    }
  }

  return (
    <div className="surface-glass-dark rounded-[var(--radius-card)] border border-white/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between text-left"
      >
        <span className="text-base font-semibold text-white/90">
          Hike photos
          {uploadedCount > 0 ? (
            <span className="ml-2 text-sm font-normal text-white/60">
              {uploadedCount} added
            </span>
          ) : null}
        </span>
        <span aria-hidden className="text-white/60">
          {open ? "–" : "+"}
        </span>
      </button>

      {open ? (
        <div className="mt-3 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Tag the dogs in the photo so their owners get it.
              </p>
              {dogs.length > 1 ? (
                <button
                  type="button"
                  onClick={selectAll}
                  className="min-h-11 px-2 text-sm text-white/80 underline-offset-2 hover:underline"
                >
                  {selected.size === dogs.length ? "Clear" : "Everyone"}
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {dogs.map((dog) => {
                const on = selected.has(dog.id);
                return (
                  <button
                    key={dog.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDog(dog.id)}
                    className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
                      on
                        ? "bg-white text-stone-900"
                        : "bg-white/10 text-white/85 hover:bg-white/15"
                    }`}
                  >
                    {dog.name}
                  </button>
                );
              })}
              {!dogs.length ? (
                <p className="text-sm text-white/50">No dogs on this hike yet.</p>
              ) : null}
            </div>
          </div>

          <label className="block">
            <span className="sr-only">Caption (optional)</span>
            <input
              type="text"
              value={caption}
              maxLength={PHOTO_CAPTION_MAX_LENGTH}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="min-h-11 w-full rounded-[var(--radius-surface)] border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </label>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []))}
          />
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={() => inputRef.current?.click()}
            className="min-h-12 w-full rounded-[var(--radius-surface)] bg-white px-4 text-base font-semibold text-stone-900 disabled:opacity-60"
          >
            {busy ? (progress ?? "Uploading…") : "Take or choose photos"}
          </button>

          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {!error && uploadedCount > 0 && !busy ? (
            <p role="status" className="text-sm text-white/70">
              Saved. Tagged owners can see them in their photo link.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
