"use client";

import { useRef, useState } from "react";

type Photo = { url: string; width: number | null; height: number | null };

/** Swipeable photo strip with page dots (CSS scroll snap; no library). */
export function PhotoGallery({
  photos,
  name,
}: {
  photos: Photo[];
  name: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const el = strip.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(i: number) {
    const el = strip.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="w-full">
      <div
        ref={strip}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photos of ${name}`}
        className="no-scrollbar flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto rounded-group bg-surface"
      >
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.url}
            src={p.url}
            alt={`Photo ${i + 1} of ${photos.length} of ${name}`}
            width={p.width ?? undefined}
            height={p.height ?? undefined}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className="size-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {photos.length > 1 ? (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className="relative size-2 rounded-full after:absolute after:-inset-[18px] after:content-['']"
            >
              <span
                aria-hidden="true"
                className={`block size-2 rounded-full ${i === index ? "bg-accent" : "bg-track"}`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
