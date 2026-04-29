"use client";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600">
            System Control
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Zenora Command Center</h1>
          <p className="mt-2 max-w-xl text-zinc-600">
            Global system health: <span className="font-medium text-emerald-700">All systems operational</span>. 
            Monitoring traffic, user registrations, and platform-wide security.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
             <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Management</h3>
             <nav className="space-y-1">
                {['User Registry', 'Therapist Verification', 'Financial Audits', 'System Logs', 'Security Keys'].map((item, i) => (
                  <button key={i} className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900">
                    {item}
                    <span className="opacity-0 group-hover:opacity-100 transition">→</span>
                  </button>
                ))}
             </nav>
          </div>
          
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
             <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Memory Usage</p>
             <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full w-[65%] bg-zinc-900" />
             </div>
             <p className="mt-2 text-xs font-medium text-zinc-600">65% used of 32GB</p>
          </div>
        </div>

        {/* Data Visualization / Main Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Active Sessions</p>
                <p className="text-3xl font-semibold text-zinc-900">1,284</p>
             </div>
             <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Server Latency</p>
                <p className="text-3xl font-semibold text-zinc-900">14ms</p>
             </div>
             <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">New Tickets</p>
                <p className="text-3xl font-semibold text-rose-600">12</p>
             </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-6 py-4">
              <h2 className="font-semibold text-zinc-900">Recent System Events</h2>
              <button className="text-xs font-medium uppercase tracking-wide text-zinc-600 hover:text-zinc-900">Export Logs</button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Timestamp</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Source</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Event</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    { time: "2026-04-28 22:50:12", source: "Auth Service", event: "Google OAuth Callback Success", status: "Resolved" },
                    { time: "2026-04-28 22:48:34", source: "API Gateway", event: "Internal Server Error - validate.ts", status: "Critical" },
                    { time: "2026-04-28 22:45:00", source: "DB Connector", event: "Weekly backup completed", status: "Success" },
                    { time: "2026-04-28 22:30:15", source: "Redis Cluster", event: "Node 3 re-balanced", status: "Resolved" },
                  ].map((log, i) => (
                    <tr key={i} className="cursor-default transition hover:bg-zinc-50/70">
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.time}</td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-700">{log.source}</td>
                      <td className="px-6 py-4 text-xs text-zinc-600">{log.event}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${
                          log.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
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
