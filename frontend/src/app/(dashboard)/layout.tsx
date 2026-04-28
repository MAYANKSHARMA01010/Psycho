"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simple Dashboard Navbar */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold">Z</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Zenora</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${user?.role.toLowerCase()}`} className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition">Dashboard</Link>
              <Link href="#" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition">Profile</Link>
              <Link href="#" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition">Settings</Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</p>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
