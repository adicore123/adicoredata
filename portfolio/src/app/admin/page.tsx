import type { Metadata } from "next";
import { store } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ניהול" };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <AdminLogin />
      </div>
    );
  }
  const [works, categories] = await Promise.all([store.listAll(), store.categories()]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <AdminDashboard initialWorks={works} categories={categories} />
    </div>
  );
}
