import type { Metadata } from "next";
import { TeachersView } from "@/features/teachers/components/teachers-view";

export const metadata: Metadata = { title: "المدرّسون" };

export default function TeachersPage() {
  return <TeachersView />;
}
