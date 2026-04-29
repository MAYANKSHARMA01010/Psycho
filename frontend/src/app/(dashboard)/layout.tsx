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
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/85 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Link href={`/${role.toLowerCase()}`} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900">
                  <span className="text-sm font-bold text-white">Z</span>
                </div>
                <span className="text-xl font-semibold tracking-tight text-zinc-900">Zenora</span>
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
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
                className="rounded-md p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
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
                className="hidden flex-col rounded-md px-2 py-1 text-right hover:bg-zinc-100 sm:flex"
                title="My account"
              >
                <span className="text-sm font-medium text-zinc-900">{user?.name || "User"}</span>
                <span className="text-xs capitalize text-zinc-500">{role.toLowerCase()}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
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
          <div className="border-t border-zinc-100 bg-white md:hidden">
            <div className="container mx-auto flex gap-1 overflow-x-auto px-3 py-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
