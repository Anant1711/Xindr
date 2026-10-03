"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { avatarColor } from "@/components/ios/Avatar";
import { ChevronLeft, ChevronRight, PinIcon } from "@/components/ios/icons";

export type CarouselPerson = {
  id: string;
  name: string; // "Priya S."
  initials: string;
  badge: string; // "Same gym" | "Same area" | "1.5 km"
  subtitle: string; // "Beginner · 1.5 km"
  photo: string | null;
};

const CARD = 240;
const GAP = 16;

export function NearbyCarousel({
  people,
  area,
}: {
  people: CarouselPerson[];
  area: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const current = people[Math.min(active, people.length - 1)];

  function onScroll() {
    const el = strip.current;
    if (el)
      setActive(
        Math.max(
          0,
          Math.min(people.length - 1, Math.round(el.scrollLeft / (CARD + GAP))),
        ),
      );
  }

  function go(i: number) {
    const el = strip.current;
    const target = Math.max(0, Math.min(people.length - 1, i));
    el?.scrollTo({ left: target * (CARD + GAP), behavior: "smooth" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="px-5 text-center text-sub text-secondary">
        Near {area} · distances are approximate
      </p>

      <div className="relative flex flex-1 items-center">
        <div
          ref={strip}
          onScroll={onScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label={`People near ${area}`}
          className="no-scrollbar flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto px-[calc(50%-120px)] pt-6 pb-4"
        >
          {people.map((p, i) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              // Profiles are fully dynamic, so a prefetch carries no data; it would only
              // add a server request for every card swiped into view.
              prefetch={false}
              aria-label={`${p.name}, ${p.subtitle}. Open profile`}
              onFocus={() => go(i)}
              className="group flex w-[240px] shrink-0 snap-center flex-col items-center gap-[18px] rounded-[24px] focus-visible:outline-none"
            >
              <div className="relative h-[300px] w-full rounded-[24px] shadow-[0_14px_28px_rgb(21_22_31/0.18)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-accent">
                <div
                  className="flex size-full items-center justify-center overflow-hidden rounded-[24px]"
                  style={{ backgroundColor: avatarColor(p.id) }}
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo}
                      alt=""
                      loading={i < 3 ? "eager" : "lazy"}
                      decoding="async"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="font-display text-[70px] text-white/95"
                    >
                      {p.initials}
                    </span>
                  )}
                </div>
                <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-[14px] bg-accent px-[15px] py-[7px] text-[12px] font-bold whitespace-nowrap text-white">
                  {p.badge}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="font-display text-[21px] leading-[24px] uppercase">
                  {p.name}
                </span>
                <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-secondary">
                  <PinIcon aria-hidden="true" />
                  {p.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mouse and trackpad users cannot swipe: show arrows only for fine pointers. */}
        {people.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              aria-label="Previous person"
              className="absolute top-[150px] left-2 hidden size-10 items-center justify-center rounded-full bg-white/90 shadow-md disabled:opacity-0 pointer-fine:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              disabled={active === people.length - 1}
              aria-label="Next person"
              className="absolute top-[150px] right-2 hidden size-10 items-center justify-center rounded-full bg-white/90 shadow-md disabled:opacity-0 pointer-fine:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {current ? `${current.name}, ${active + 1} of ${people.length}` : ""}
      </p>
    </div>
  );
}
