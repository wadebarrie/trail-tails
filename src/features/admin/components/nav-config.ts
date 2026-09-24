export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  /** Show pending-request count badge on this link */
  showRequestBadge?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  shortLabel?: string;
  items: NavItem[];
};

/** Daily ops — always visible on desktop */
export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/hikes/tomorrow", label: "Tomorrow" },
  { href: "/dashboard/route", label: "Routes" },
];

export const navGroups: NavGroup[] = [
  {
    id: "people",
    label: "People",
    items: [
      { href: "/dashboard/customers", label: "Customers" },
      { href: "/dashboard/dogs", label: "Dogs" },
      { href: "/dashboard/import", label: "Import" },
      { href: "/dashboard/drivers", label: "Drivers" },
      { href: "/dashboard/vehicles", label: "Vehicles" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: "/dashboard/pending-requests",
        label: "Pending requests",
        showRequestBadge: true,
      },
      { href: "/dashboard/exceptions", label: "Exceptions" },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { href: "/dashboard/billing", label: "Billing" },
      { href: "/dashboard/settings", label: "Settings" },
      { href: "/dashboard/help", label: "Help & guide" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    items: [
      { href: "/dashboard/sms", label: "SMS history" },
      { href: "/dashboard/notifications", label: "Notifications" },
      { href: "/dashboard/logs", label: "System logs" },
    ],
  },
];

export const allNavItems: NavItem[] = [
  ...primaryNav,
  ...navGroups.flatMap((group) => group.items),
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isNavActive(pathname, item.href));
}

/**
 * Mobile bottom bar: day planning first (Today + Tomorrow), then Routes,
 * Requests, and More. People lives in More so Tomorrow stays one tap away.
 */
export const mobilePrimaryNav: NavItem[] = [
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/hikes/tomorrow", label: "Tomorrow", shortLabel: "Tmrw" },
  { href: "/dashboard/route", label: "Routes" },
  {
    href: "/dashboard/pending-requests",
    label: "Requests",
    showRequestBadge: true,
  },
];

export const mobilePeopleNav = navGroups.find((g) => g.id === "people")!;

const mobileOperationsNav: NavGroup = {
  id: "operations",
  label: "Operations",
  items: [
    // Pending requests stay on the bottom bar — only Exceptions here.
    { href: "/dashboard/exceptions", label: "Exceptions" },
  ],
};

export const mobileMoreSections: NavGroup[] = [
  {
    id: "schedule",
    label: "Schedule",
    items: [{ href: "/dashboard", label: "Dashboard", shortLabel: "Home" }],
  },
  mobilePeopleNav,
  mobileOperationsNav,
  navGroups.find((g) => g.id === "business")!,
  navGroups.find((g) => g.id === "activity")!,
];

export function isMobileMoreActive(pathname: string) {
  const primaryHrefs = new Set(mobilePrimaryNav.map((item) => item.href));
  return mobileMoreSections.some((section) =>
    section.items.some(
      (item) =>
        !primaryHrefs.has(item.href) && isNavActive(pathname, item.href)
    )
  );
}
