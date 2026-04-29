"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sessionsApi } from "@/api/resources";
import type { Session } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorMessage, PageLoader } from "@/components/ui/Misc";

const STATUS_VARIANT: Record<Session["status"], "success" | "warn" | "info" | "default" | "danger"> = {
  PENDING: "warn",
  CONFIRMED: "info",
  ONGOING: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
  RESCHEDULED: "default",
};

export default function ClientSessionsPage() {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.history({ limit: 50 });
      setItems(res.data.items ?? res.data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function cancelSession(id: string) {
    const reason = window.prompt("Cancellation reason");
    if (!reason) return;
    try {
      await sessionsApi.cancel(id, reason);
      toast.success("Session cancelled");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel session");
    }
  }

  const filtered = filter === "ALL" ? items : items.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">My sessions</h1>
          <p className="text-sm text-zinc-500">
            Upcoming and past therapy sessions, with chat and notes.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </header>

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Book your first session to get started."
          action={
            <Link href="/client/therapists">
              <Button>Browse therapists</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-zinc-100">
            {filtered.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {s.therapist?.user.name ?? "Therapist"}
                    </p>
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {new Date(s.scheduledAt).toLocaleString()} · {s.type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/client/sessions/${s.id}`}
                    className="text-xs font-medium text-zinc-700 hover:underline"
                  >
                    Open
                  </Link>
                  {(s.status === "PENDING" || s.status === "CONFIRMED") && (
                    <Button size="sm" variant="ghost" onClick={() => cancelSession(s.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
