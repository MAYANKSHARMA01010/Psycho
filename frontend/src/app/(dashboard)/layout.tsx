"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  CLIENT: [
    { href: "/client", label: "Overview" },
    { href: "/client/therapists", label: "Therapists" },
    { href: "/client/sessions", label: "My Sessions" },
    { href: "/client/assessments", label: "Assessments" },
    { href: "/client/prescriptions", label: "Prescriptions" },
    { href: "/client/payments", label: "Payments" },
  ],
  THERAPIST: [
    { href: "/therapist", label: "Overview" },
    { href: "/therapist/profile", label: "Profile & KYC" },
    { href: "/therapist/availability", label: "Availability" },
    { href: "/therapist/sessions", label: "Sessions" },
    { href: "/therapist/earnings", label: "Earnings" },
  ],
  ADMIN: [
    { href: "/admin", label: "Analytics" },
    { href: "/admin/therapists", label: "Verifications" },
    { href: "/admin/withdrawals", label: "Withdrawals" },
    { href: "/admin/complaints", label: "Complaints" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const role = user?.role ?? "CLIENT";
  const navItems = NAV_BY_ROLE[role] ?? [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Link href={`/${role.toLowerCase()}`} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold">Z</span>
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">Zenora</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/notifications"
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </Link>
              <Link
                href="/account"
                className="text-right hidden sm:flex flex-col rounded-lg px-2 py-1 hover:bg-slate-100"
                title="My account"
              >
                <span className="text-sm font-semibold text-slate-900">{user?.name || "User"}</span>
                <span className="text-xs text-slate-500 capitalize">{role.toLowerCase()}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
                title="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile-friendly nav */}
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="container mx-auto flex gap-1 overflow-x-auto px-3 py-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
