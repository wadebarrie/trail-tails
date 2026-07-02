import Link from "next/link";
import { PackRouteMark } from "@/features/brand/components/packroute-mark";
import type { PackRouteMarkSize } from "@/features/brand/constants";

type PackRouteLogoProps = {
  href?: string;
  /** Appended after the wordmark, e.g. "Superadmin" or "· Driver". */
  suffix?: string;
  markSize?: PackRouteMarkSize;
  showWordmark?: boolean;
  /** Light text for dark headers (mark stays forest green). */
  variant?: "default" | "light";
  className?: string;
  wordmarkClassName?: string;
  priority?: boolean;
};

const wordmarkColor = {
  default: "text-[var(--color-trail-800)]",
  light: "text-white",
} as const;

export function PackRouteLogo({
  href,
  suffix,
  markSize = "md",
  showWordmark = true,
  variant = "default",
  className = "",
  wordmarkClassName = "",
  priority = false,
}: PackRouteLogoProps) {
  const content = (
    <>
      <PackRouteMark size={markSize} priority={priority} />
      {showWordmark ? (
        <span
          className={`font-semibold tracking-tight ${wordmarkColor[variant]} ${wordmarkClassName}`.trim()}
        >
          PackRoute
          {suffix ? (
            <span
              className={
                variant === "light"
                  ? " font-medium text-white/70"
                  : " font-medium text-stone-500"
              }
            >
              {" "}
              {suffix}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const layoutClass = `inline-flex items-center gap-2 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={`${layoutClass} motion-interactive`}>
        {content}
      </Link>
    );
  }

  return <span className={layoutClass}>{content}</span>;
}
