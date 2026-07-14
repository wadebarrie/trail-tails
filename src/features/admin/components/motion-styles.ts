/**
 * Shared motion class strings — import alongside button-styles and form-styles.
 * Primitives are defined in src/app/globals.css @layer utilities.
 */

/** Default interactive transition (150ms) — color, shadow, border, opacity. */
export const motionInteractiveClassName = "motion-interactive";

/** Subtle press compress on active (100ms) — pair with motion-interactive on buttons. */
export const motionPressClassName = "motion-press";

/** Card hover — 1px lift + elevation-3 shadow. */
export const motionLiftClassName = "motion-lift";

/** Table row hover wash with smooth background transition. */
export const motionTableRowClassName = "motion-table-row";

/** Text link color / underline transition. */
export const motionLinkClassName = "motion-link";

/** Status toast enter (driver feedback). */
export const motionFeedbackClassName = "motion-feedback";

/** Status toast exit. */
export const motionFeedbackExitClassName = "motion-feedback-exit";

/** Success / confirmation panel enter. */
export const motionFadeInClassName = "motion-fade-in";

/** Softer skeleton pulse (2s, 55% opacity dip). */
export const motionSkeletonClassName = "motion-skeleton";

/** Combined button motion — interactive + press. */
export const motionButtonClassName = `${motionInteractiveClassName} ${motionPressClassName}`;

/** Combined card motion — interactive + lift. */
export const motionCardClassName = `${motionInteractiveClassName} ${motionLiftClassName}`;

/** Driver primary action button — full-width tactile feedback. */
export const driverActionButtonClassName = `${motionButtonClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`;
