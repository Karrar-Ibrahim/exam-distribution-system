import type { Metadata } from "next";
import { ExamsView } from "@/features/exams/components/exams-view";

export const metadata: Metadata = { title: "الامتحانات" };

export default function ExamsPage() {
  return <ExamsView />;
}
