import type { Metadata } from "next";
import { ClassroomsView } from "@/features/classrooms/components/classrooms-view";

export const metadata: Metadata = { title: "القاعات" };

export default function ClassroomsPage() {
  return <ClassroomsView />;
}
