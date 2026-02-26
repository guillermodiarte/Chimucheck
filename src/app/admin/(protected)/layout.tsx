import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Top Bar with Notifications */}
        <div className="sticky top-0 z-40 flex items-center justify-end px-8 py-3 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <NotificationBell />
        </div>
        <div className="w-full p-4 md:p-8 pt-2">{children}</div>
      </main>
    </div>
  );
}
