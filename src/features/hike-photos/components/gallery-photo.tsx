"use client";

import { useState } from "react";

export function GalleryPhoto({
  src,
  alt,
  caption,
  dogNames,
}: {
  src: string;
  alt: string;
  caption?: string | null;
  dogNames: string[];
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <li>
      <a href={src} target="_blank" rel="noreferrer" className="block">
        <div className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
          {!loaded ? (
            <div
              className="absolute inset-0 animate-pulse bg-stone-200"
              aria-hidden
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`max-h-[85vh] w-full object-contain transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </a>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          {caption ? <p className="text-stone-800">{caption}</p> : null}
          {dogNames.length ? (
            <p className="mt-1 text-sm text-stone-500">{dogNames.join(", ")}</p>
          ) : null}
        </div>
        <a
          href={src}
          download
          className="text-sm font-medium text-stone-700 underline-offset-2 hover:underline"
        >
          Save photo
        </a>
      </div>
    </li>
  );
}
