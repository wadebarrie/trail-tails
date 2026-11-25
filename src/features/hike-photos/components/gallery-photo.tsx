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
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-200">
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
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </a>
      {caption ? <p className="mt-2 text-stone-800">{caption}</p> : null}
      {dogNames.length ? (
        <p className="mt-1 text-sm text-stone-500">{dogNames.join(", ")}</p>
      ) : null}
    </li>
  );
}
