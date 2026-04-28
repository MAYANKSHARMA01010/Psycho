"use client";

import { useAuth } from "@/hooks/useAuth";

export default function TherapistDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Professional Dashboard</h1>
          <p className="text-slate-500 mt-1">Hello, {user?.name || "Dr. User"}. Here's what's happening with your practice today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            Manage Schedule
          </button>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Sessions", value: "8", change: "+2 from yesterday", color: "text-indigo-600" },
          { label: "Total Patients", value: "42", change: "1 new this week", color: "text-emerald-600" },
          { label: "Hours Logged", value: "124", change: "Current month", color: "text-amber-600" },
          { label: "Pending Reports", value: "3", change: "Due today", color: "text-rose-600" },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-400 font-medium">{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Upcoming Appointments</h2>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: "Alice Johnson", time: "09:00 AM", type: "Video Call", status: "Confirmed" },
              { name: "Robert Smith", time: "11:30 AM", type: "In-Person", status: "Waitlist" },
              { name: "Elena Gilbert", time: "02:00 PM", type: "Chat Session", status: "Confirmed" },
              { name: "Damon Salvatore", time: "04:30 PM", type: "Video Call", status: "Pending" },
            ].map((appt, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                     {appt.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-900">{appt.name}</p>
                     <p className="text-xs text-slate-500">{appt.type}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{appt.time}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                    appt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                    appt.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes/Notifications */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Clinician Notes</h2>
          <div className="mt-6 space-y-4">
             <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-1 italic">Personal Reminder</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Review Alice's previous session notes before the 9:00 AM call. Focus on the sleep cycle discussion.
                </p>
             </div>
             <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Platform Update</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  New end-to-end encryption features are now live for all chat sessions.
                </p>
             </div>
          </div>
          <button className="w-full mt-6 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600 transition">
            + Add Quick Note
          </button>
        </div>
      </div>
    </div>
  );
}
