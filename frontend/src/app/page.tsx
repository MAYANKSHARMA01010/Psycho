"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      <nav className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 shadow-sm">
            <span className="text-white font-bold text-xl italic">Z</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-zinc-900">Zenora</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900">Log in</Link>
          <Link href="/login" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 shadow-sm">
          Mental Wellness Platform
        </div>
        <h1 className="max-w-4xl text-5xl font-semibold leading-[1.08] tracking-tight text-zinc-950 md:text-7xl">
          Modern care for your mental well-being
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-600 md:text-xl">
          Connect with professional therapists, track your progress, and join a supportive community. 
          Zenora is your all-in-one platform for a healthier, happier mind.
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/login" className="w-full rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto">
            Start Your Journey
          </Link>
          <button className="w-full rounded-md border border-zinc-200 bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 sm:w-auto">
            How it Works
          </button>
        </div>

        <div className="mt-16 border-t border-zinc-200 pt-6">
           <span className="text-sm font-medium uppercase tracking-wide text-zinc-500">Trusted by 50,000+ users</span>
        </div>
      </section>
    </main>
  );
}
