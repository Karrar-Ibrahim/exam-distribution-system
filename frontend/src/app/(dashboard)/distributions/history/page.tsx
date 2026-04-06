import type { Metadata } from "next";
import { HistoryView } from "@/features/distributions/components/history-view";

export const metadata: Metadata = { title: "سجل التوزيعات" };

export default function DistributionsHistoryPage() {
  return <HistoryView />;
}
