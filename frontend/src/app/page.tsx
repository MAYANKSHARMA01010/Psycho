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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-200 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-200 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl italic">Z</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Zenora</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">Log in</Link>
          <Link href="/login" className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xl hover:bg-slate-800 transition transform hover:scale-105 active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto pb-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-800 border border-cyan-200 mb-8 animate-fade-in">
          Next-Gen Mental Wellness
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
          Modern Care for your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">Mental Well-being</span>
        </h1>
        <p className="mt-8 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
          Connect with professional therapists, track your progress, and join a supportive community. 
          Zenora is your all-in-one platform for a healthier, happier mind.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="w-full sm:w-auto rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-2xl hover:bg-slate-800 transition transform hover:-translate-y-1 active:translate-y-0">
            Start Your Journey
          </Link>
          <button className="w-full sm:w-auto rounded-full bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition">
            How it Works
          </button>
        </div>

        <div className="mt-16 flex items-center gap-8 grayscale opacity-60">
           <span className="font-bold text-xl tracking-tighter">TRUSTED BY 50,000+ USERS</span>
        </div>
      </section>
    </main>
  );
}