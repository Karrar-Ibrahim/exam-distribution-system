import {
  LayoutDashboard,
  GraduationCap,
  DoorOpen,
  BookOpen,
  CalendarCheck,
  Users,
  Settings,
  BarChart3,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title:       string;
  href:        string;
  icon:        LucideIcon;
  badge?:      string;
  /** module name to check against userAbilities — undefined = always visible */
  permission?: string;
}

export interface NavSection {
  title?: string;
  items:  NavItem[];
}

export const navigation: NavSection[] = [
  {
    // ── الرئيسية ──────────────────────────────────────────
    items: [
      {
        title: "لوحة التحكم",
        href:  "/dashboard",
        icon:  LayoutDashboard,
        // always visible
      },
    ],
  },
  {
    title: "إدارة الكوادر",
    items: [
      {
        title:      "التدريسيون",
        href:       "/teachers",
        icon:       GraduationCap,
        permission: "teaching_management",
      },
      {
        title:      "القاعات",
        href:       "/classrooms",
        icon:       DoorOpen,
        permission: "classroom",
      },
      {
        title:      "الامتحانات",
        href:       "/exams",
        icon:       BookOpen,
        permission: "exams",
      },
    ],
  },
  {
    title: "التوزيع",
    items: [
      {
        title:      "التوزيع",
        href:       "/distributions",
        icon:       CalendarCheck,
        permission: "teachers_divide",
      },
      {
        title:      "إحصائيات المراقبين",
        href:       "/statistics",
        icon:       BarChart3,
        permission: "teachers_divide",
      },
      {
        title:      "استثناءات المراقبين",
        href:       "/exclusions",
        icon:       UserX,
        permission: "teaching_management",
      },
    ],
  },
  {
    title: "النظام",
    items: [
      {
        title:      "المستخدمون",
        href:       "/users",
        icon:       Users,
        permission: "users",
      },
      {
        title: "الإعدادات",
        href:  "/settings",
        icon:  Settings,
        // visible to all authenticated users
      },
    ],
  },
];

/** Flat list — used by Navbar breadcrumb lookup */
export const flatNavItems: NavItem[] = navigation.flatMap((s) => s.items);
