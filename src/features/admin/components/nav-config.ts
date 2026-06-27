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

/** Mobile bottom bar: daily ops + people sheet + requests + more sheet */
export const mobilePrimaryNav: NavItem[] = [
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/route", label: "Routes" },
  {
    href: "/dashboard/pending-requests",
    label: "Requests",
    showRequestBadge: true,
  },
];

export const mobilePeopleNav = navGroups.find((g) => g.id === "people")!;

export const mobileMoreSections: NavGroup[] = [
  {
    id: "schedule",
    label: "Schedule",
    items: [
      { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
      { href: "/dashboard/hikes/tomorrow", label: "Tomorrow" },
    ],
  },
  navGroups.find((g) => g.id === "operations")!,
  navGroups.find((g) => g.id === "business")!,
  navGroups.find((g) => g.id === "activity")!,
];

export function isMobilePeopleActive(pathname: string) {
  return isGroupActive(pathname, mobilePeopleNav);
}

export function isMobileMoreActive(pathname: string) {
  return mobileMoreSections.some((section) => isGroupActive(pathname, section));
}
