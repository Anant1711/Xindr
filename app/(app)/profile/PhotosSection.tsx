"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { addPhoto, makeMainPhoto, removePhoto } from "@/app/actions/photos";
import { ActionSheet } from "@/components/ios/ActionSheet";
import { Spinner } from "@/components/ios/Button";
import { SectionLabel } from "@/components/ios/ListGroup";
import { useToast } from "@/components/ios/Toast";
import { encodePhoto, PhotoError } from "@/lib/photos/encode";
import { createClient } from "@/lib/supabase/client";

export type OwnPhoto = { id: string; url: string | null; position: number };

const MAX = 4;
const BUCKET = "profile-photos";

export function PhotosSection({
  userId,
  photos,
}: {
  userId: string;
  photos: OwnPhoto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [menuFor, setMenuFor] = useState<OwnPhoto | null>(null);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setUploading(true);
    try {
      const { blob, width, height } = await encodePhoto(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw new PhotoError("Upload failed. Please try again.");
      const res = await addPhoto({ path, width, height });
      if (!res.ok) throw new PhotoError(res.error);
      toast.show("Photo added");
      router.refresh();
    } catch (err) {
      toast.show(
        err instanceof PhotoError
          ? err.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function act(
    action: () => Promise<{ ok: boolean; error?: string }>,
    done: string,
  ) {
    startTransition(async () => {
      const res = await action();
      toast.show(res.ok ? done : (res.error ?? "Something went wrong."));
      if (res.ok) router.refresh();
    });
  }

  const slots = Array.from(
    { length: MAX },
    (_, i) => photos.find((p) => p.position === i) ?? null,
  );
  const nextFree = photos.length;

  return (
    <section className="mb-6">
      <SectionLabel>Photos</SectionLabel>
      <div className="grid grid-cols-4 gap-2 px-5">
        {slots.map((photo, i) =>
          photo ? (
            <button
              key={photo.id}
              type="button"
              onClick={() => setMenuFor(photo)}
              aria-label={
                i === 0 ? "Main photo, options" : `Photo ${i + 1}, options`
              }
              className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
              {i === 0 ? (
                <span className="absolute inset-x-1 bottom-1 rounded-md bg-black/55 py-0.5 text-center text-[10px] font-bold text-white">
                  Main
                </span>
              ) : null}
            </button>
          ) : i === nextFree ? (
            <button
              key="add"
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading}
              aria-label="Add a photo"
              className="flex aspect-[4/5] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#8e9198] text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {uploading ? (
                <Spinner />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
          ) : (
            <div
              key={`empty-${i}`}
              aria-hidden="true"
              className="aspect-[4/5] rounded-[14px] bg-surface"
            />
          ),
        )}
      </div>
      <p className="mx-5 mt-2 text-sub text-secondary">
        Up to 4 photos. Shown to people who can see your profile. Location and
        other hidden data are removed before upload.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        actions={[
          ...(menuFor && menuFor.position !== 0
            ? [
                {
                  label: "Make main photo",
                  onSelect: () =>
                    act(() => makeMainPhoto(menuFor.id), "Main photo updated"),
                },
              ]
            : []),
          ...(menuFor
            ? [
                {
                  label: "Remove photo",
                  destructive: true,
                  onSelect: () =>
                    act(() => removePhoto(menuFor.id), "Photo removed"),
                },
              ]
            : []),
        ]}
      />
    </section>
  );
}
