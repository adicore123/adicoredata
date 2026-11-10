import type { Metadata } from "next";
import { store } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ניהול" };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin />;
  }
  const [works, categories] = await Promise.all([store.listAll(), store.categories()]);
  return <AdminDashboard initialWorks={works} categories={categories} />;
}
