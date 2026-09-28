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
        label: "Customer texts",
        shortLabel: "Texts",
        showRequestBadge: true,
      },
      { href: "/dashboard/exceptions", label: "Time off" },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { href: "/dashboard/import", label: "Import spreadsheet" },
      { href: "/dashboard/billing", label: "Hike report" },
      { href: "/dashboard/settings", label: "Settings" },
      { href: "/dashboard/help", label: "Help & guide" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    items: [
      { href: "/dashboard/sms", label: "Texts sent" },
      { href: "/dashboard/notifications", label: "Notifications" },
      { href: "/dashboard/logs", label: "Problem log" },
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
 * Customer texts, and More.
 */
export const mobilePrimaryNav: NavItem[] = [
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/hikes/tomorrow", label: "Tomorrow", shortLabel: "Tmrw" },
  { href: "/dashboard/route", label: "Routes" },
  {
    href: "/dashboard/pending-requests",
    label: "Texts",
    showRequestBadge: true,
  },
];

export const mobilePeopleNav = navGroups.find((g) => g.id === "people")!;

const mobileOperationsNav: NavGroup = {
  id: "operations",
  label: "Operations",
  items: [
    // Customer texts stay on the bottom bar — only Time off here.
    { href: "/dashboard/exceptions", label: "Time off" },
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
