import {
  PACKROUTE_MARK_HEIGHT,
  PACKROUTE_MARK_ASPECT,
  type PackRouteMarkSize,
} from "@/features/brand/constants";
import {
  PACKROUTE_MARK_PATH,
  PACKROUTE_MARK_TRANSFORM,
  PACKROUTE_MARK_VIEWBOX,
} from "@/features/brand/packroute-mark-path";

type PackRouteMarkProps = {
  size?: PackRouteMarkSize;
  className?: string;
  /** Kept for API compatibility with next/image usage — no-op for SVG. */
  priority?: boolean;
};

export function PackRouteMark({
  size = "md",
  className = "",
}: PackRouteMarkProps) {
  const height = PACKROUTE_MARK_HEIGHT[size];
  const width = Math.round(height * PACKROUTE_MARK_ASPECT);
  const viewBox = `${PACKROUTE_MARK_VIEWBOX.x} ${PACKROUTE_MARK_VIEWBOX.y} ${PACKROUTE_MARK_VIEWBOX.width} ${PACKROUTE_MARK_VIEWBOX.height}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      aria-hidden
      className={`shrink-0 select-none ${className}`.trim()}
    >
      <g transform={PACKROUTE_MARK_TRANSFORM}>
        <path fill="var(--color-forest)" d={PACKROUTE_MARK_PATH} />
      </g>
    </svg>
  );
}
