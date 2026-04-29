"use client";

import { useAuth } from "@/hooks/useAuth";

export default function TherapistDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Professional Dashboard</h1>
          <p className="mt-1 text-zinc-500">Hello, {user?.name || "Dr. User"}. Here&apos;s what&apos;s happening with your practice today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50">
            Manage Schedule
          </button>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800">
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Sessions", value: "8", change: "+2 from yesterday", color: "text-zinc-900" },
          { label: "Total Patients", value: "42", change: "1 new this week", color: "text-emerald-600" },
          { label: "Hours Logged", value: "124", change: "Current month", color: "text-amber-600" },
          { label: "Pending Reports", value: "3", change: "Due today", color: "text-rose-600" },
        ].map((item, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">{item.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
              <p className="text-xs font-medium text-zinc-400">{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments List */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Upcoming Appointments</h2>
            <button className="text-sm font-medium text-zinc-700 hover:text-zinc-900">View All</button>
          </div>
          <div className="divide-y divide-zinc-100">
            {[
              { name: "Alice Johnson", time: "09:00 AM", type: "Video Call", status: "Confirmed" },
              { name: "Robert Smith", time: "11:30 AM", type: "In-Person", status: "Waitlist" },
              { name: "Elena Gilbert", time: "02:00 PM", type: "Chat Session", status: "Confirmed" },
              { name: "Damon Salvatore", time: "04:30 PM", type: "Video Call", status: "Pending" },
            ].map((appt, i) => (
              <div key={i} className="flex cursor-pointer items-center justify-between px-6 py-4 transition hover:bg-zinc-50">
                <div className="flex items-center gap-4">
                   <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700">
                     {appt.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-zinc-900">{appt.name}</p>
                     <p className="text-xs text-zinc-500">{appt.type}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">{appt.time}</p>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${
                    appt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                    appt.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes/Notifications */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Clinician Notes</h2>
          <div className="mt-6 space-y-4">
             <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Personal Reminder</p>
                <p className="text-sm leading-relaxed text-zinc-700">
                  Review Alice&apos;s previous session notes before the 9:00 AM call. Focus on the sleep cycle discussion.
                </p>
             </div>
             <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Platform Update</p>
                <p className="text-sm leading-relaxed text-zinc-700">
                  New end-to-end encryption features are now live for all chat sessions.
                </p>
             </div>
          </div>
          <button className="mt-6 w-full rounded-md border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700">
            + Add Quick Note
          </button>
        </div>
      </div>
    </div>
  );
}
