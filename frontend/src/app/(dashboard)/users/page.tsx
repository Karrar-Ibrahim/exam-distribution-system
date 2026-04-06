import type { Metadata } from "next";
import { UsersView } from "@/features/users/components/users-view";

export const metadata: Metadata = { title: "المستخدمون" };

export default function UsersPage() {
  return <UsersView />;
}
