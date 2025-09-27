import { Header } from "@/components/app/header";
import { AdminDashboardWrapper } from "@/components/admin-dashboard-wrapper";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Admin Dashboard" />
      <AdminDashboardWrapper />
    </div>
  );
}
