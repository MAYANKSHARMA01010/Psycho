"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionsApi, assessmentApi, notificationApi } from "@/api/resources";
import type { Session, Assessment, Notification } from "@/api/types";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorMessage, Spinner } from "@/components/ui/Misc";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      sessionsApi.history({ limit: 10 }),
      assessmentApi.mine({ limit: 5 }),
      notificationApi.mine({ limit: 5 }),
    ])
      .then(([sRes, aRes, nRes]) => {
        if (!active) return;
        if (sRes.status === "fulfilled") setSessions(sRes.value.data.items ?? []);
        if (aRes.status === "fulfilled")
          setAssessments(aRes.value.data.items ?? aRes.value.data.assessments ?? []);
        if (nRes.status === "fulfilled")
          setNotifications(nRes.value.data.items ?? nRes.value.data.notifications ?? []);

        const errs = [sRes, aRes, nRes].filter(
          (r) => r.status === "rejected",
        ) as PromiseRejectedResult[];
        if (errs.length === 3) setError(errs[0].reason?.message ?? "Could not load dashboard");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const upcoming = sessions.filter((s) => ["PENDING", "CONFIRMED"].includes(s.status));
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const lastAssessment = assessments[0];

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Hello, {user?.name || "there"}!</h1>
          <p className="mt-2 max-w-md text-zinc-600">
            Track your wellness journey, book sessions, and stay connected with your therapist.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/client/therapists"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              Book a Session
            </Link>
            <Link
              href="/client/assessments"
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
            >
              Take Assessment
            </Link>
          </div>
        </div>
      </section>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Upcoming Sessions"
          value={loading ? "—" : upcoming.length}
          accent="text-zinc-900"
        />
        <StatCard
          label="Completed Sessions"
          value={loading ? "—" : completed.length}
          accent="text-emerald-600"
        />
        <StatCard
          label="Last Assessment"
          value={loading ? "—" : lastAssessment?.severity ?? "Not taken"}
          hint={
            lastAssessment
              ? new Date(lastAssessment.completedAt).toLocaleDateString()
              : "Take one to track progress"
          }
          accent="text-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Upcoming Sessions"
          action={
            <Link
              href="/client/sessions"
              className="text-xs font-medium text-zinc-700 hover:underline"
            >
              View all
            </Link>
          }
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Spinner /> Loading...
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              description="Browse therapists and book your first session."
              action={
                <Link href="/client/therapists">
                  <Button>Find a therapist</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcoming.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {s.therapist?.user.name ?? "Therapist"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(s.scheduledAt).toLocaleString()} · {s.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={s.status === "CONFIRMED" ? "success" : "warn"}>
                      {s.status}
                    </Badge>
                    <Link
                      href={`/client/sessions/${s.id}`}
                      className="text-xs font-medium text-zinc-700 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent activity">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Spinner /> Loading...
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-zinc-500">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                  <p className="text-xs text-zinc-500">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
