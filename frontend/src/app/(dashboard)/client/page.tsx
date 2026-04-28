"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ClientDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Hello, {user?.name || "there"}!</h1>
          <p className="mt-2 text-cyan-100 max-w-md">
            Welcome to your wellness dashboard. Here you can manage your appointments, 
            view your progress, and connect with your therapist.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm hover:bg-cyan-50 transition">
              Book a Session
            </button>
            <button className="rounded-xl bg-cyan-500/20 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm border border-white/20 hover:bg-cyan-500/30 transition">
              View Journal
            </button>
          </div>
        </div>
        
        {/* Abstract shapes for premium feel */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
      </section>

      {/* Stats/Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Upcoming Session", value: "May 12, 4:00 PM", icon: "🗓️", color: "bg-blue-50" },
          { label: "Wellness Progress", value: "On Track", icon: "📈", color: "bg-green-50" },
          { label: "Unread Messages", value: "3 New", icon: "💬", color: "bg-purple-50" },
        ].map((item, i) => (
          <div key={i} className={`rounded-2xl border border-slate-100 p-6 shadow-sm transition hover:shadow-md ${item.color}`}>
            <span className="text-2xl">{item.icon}</span>
            <p className="mt-4 text-sm font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <div className="mt-6 space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  {i === 0 ? "🧘" : i === 1 ? "📝" : "📞"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {i === 0 ? "Meditation session completed" : i === 1 ? "New journal entry added" : "Completed a 30m call with Dr. Sarah"}
                  </p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Daily Mindfulness</h2>
          <div className="mt-6">
             <div className="aspect-video rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition" />
                <button className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10 transition group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-cyan-600 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
             </div>
             <p className="mt-4 text-sm font-medium text-slate-900 italic text-center">"The present moment is the only time over which we have any control."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
