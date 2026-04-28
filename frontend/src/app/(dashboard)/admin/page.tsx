"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md border border-cyan-500/30 mb-4">
            System Control
          </div>
          <h1 className="text-4xl font-bold">Zenora Command Center</h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Global system health: <span className="text-emerald-400 font-semibold">All systems operational</span>. 
            Monitoring traffic, user registrations, and platform-wide security.
          </p>
        </div>
        
        {/* Decorative Grid Effect */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Management</h3>
             <nav className="space-y-1">
                {['User Registry', 'Therapist Verification', 'Financial Audits', 'System Logs', 'Security Keys'].map((item, i) => (
                  <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-between group">
                    {item}
                    <span className="opacity-0 group-hover:opacity-100 transition">→</span>
                  </button>
                ))}
             </nav>
          </div>
          
          <div className="rounded-2xl bg-slate-100 p-6 border border-slate-200">
             <p className="text-xs font-bold text-slate-500 uppercase mb-2">Memory Usage</p>
             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 w-[65%]" />
             </div>
             <p className="mt-2 text-xs font-semibold text-slate-600">65% used of 32GB</p>
          </div>
        </div>

        {/* Data Visualization / Main Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900">1,284</p>
             </div>
             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Server Latency</p>
                <p className="text-3xl font-bold text-slate-900">14ms</p>
             </div>
             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">New Tickets</p>
                <p className="text-3xl font-bold text-rose-600">12</p>
             </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent System Events</h2>
              <button className="text-xs font-bold text-cyan-600 uppercase tracking-widest hover:text-cyan-700">Export Logs</button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { time: "2026-04-28 22:50:12", source: "Auth Service", event: "Google OAuth Callback Success", status: "Resolved" },
                    { time: "2026-04-28 22:48:34", source: "API Gateway", event: "Internal Server Error - validate.ts", status: "Critical" },
                    { time: "2026-04-28 22:45:00", source: "DB Connector", event: "Weekly backup completed", status: "Success" },
                    { time: "2026-04-28 22:30:15", source: "Redis Cluster", event: "Node 3 re-balanced", status: "Resolved" },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition cursor-default">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.time}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{log.source}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{log.event}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          log.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
