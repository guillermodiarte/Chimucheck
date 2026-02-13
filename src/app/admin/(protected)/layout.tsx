import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";
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

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
