import type { Metadata } from "next";
import { DistributionsView } from "@/features/distributions/components/distributions-view";

export const metadata: Metadata = { title: "توزيع المراقبين" };

export default function DistributionsPage() {
  return <DistributionsView />;
}
