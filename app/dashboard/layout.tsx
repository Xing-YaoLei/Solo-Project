import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isManager = user.role === ROLES.MANAGER;

  const navItems = [
    { href: "/dashboard", label: "总览", icon: "chart", roles: ["manager", "store_staff"] },
    { href: "/dashboard/analytics", label: "数据分析", icon: "analytics", roles: ["manager", "store_staff"] },
    { href: isManager ? "/dashboard/benefits" : `/dashboard/stores/${user.storeId}/renewal`, label: isManager ? "权益管理" : "续费率明细", icon: isManager ? "benefit" : "renewal", roles: ["manager", "store_staff"] },
    { href: "/dashboard/benefits", label: "权益过期管理", icon: "benefit", roles: ["store_staff"] },
    { href: "/dashboard/import", label: "数据导入", icon: "upload", roles: ["manager"] },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0F0D0B" }}>
      <aside className="w-64 border-r flex flex-col" style={{ backgroundColor: "#12100D", borderColor: "#2D2722" }}>
        <div className="p-6 border-b" style={{ borderColor: "#2D2722" }}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow" style={{ background: "linear-gradient(135deg, #8B6F47, #C9A961)" }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="font-display text-lg font-bold gradient-text">咖啡工坊</div>
              <div className="text-xs" style={{ color: "#8B8378" }}>储值风险监测</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "#2D2722" }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ backgroundColor: "#1A1613" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "#8B6F47", color: "#fff" }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "#E8E0D5" }}>{user.name}</div>
              <div className="text-xs" style={{ color: "#8B8378" }}>
                {isManager ? "管理层" : "门店运营"}
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: "#8B8378" }}
                formAction={async () => {
                  "use server";
                  const { logout } = await import("@/lib/auth");
                  await logout();
                  const { redirect } = await import("next/navigation");
                  redirect("/login");
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-opacity-50 group"
      style={{ color: "#8B8378" }}
    >
      <NavIcon name={icon} />
      <span className="group-hover:text-coffee-text transition-colors" style={{ color: "inherit" }}>
        {label}
      </span>
    </Link>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = "w-5 h-5";
  switch (name) {
    case "chart":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "analytics":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case "benefit":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case "renewal":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case "upload":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    default:
      return null;
  }
}
