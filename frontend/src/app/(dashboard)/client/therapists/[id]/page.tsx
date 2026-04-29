"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { availabilityApi, sessionsApi, therapistsApi } from "@/api/resources";
import type { AvailabilitySlot, Therapist } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorMessage, PageLoader } from "@/components/ui/Misc";

type SessionType = "VIDEO" | "VOICE" | "CHAT";

export default function TherapistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<SessionType>("VIDEO");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.allSettled([therapistsApi.getById(id), availabilityApi.forTherapist(id)])
      .then(([tRes, aRes]) => {
        if (!active) return;
        if (tRes.status === "fulfilled") {
          setTherapist(tRes.value.data.therapist);
          setUser(tRes.value.data.user);
        } else {
          setError(tRes.reason?.message ?? "Could not load therapist");
        }
        if (aRes.status === "fulfilled") setSlots(aRes.value.data.slots ?? []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function book() {
    if (!id || !selectedSlot) return;
    setBooking(true);
    try {
      const res = await sessionsApi.book({ therapistId: id, slotId: selectedSlot, type });
      toast.success("Session booked");
      router.push(`/client/sessions/${res.data.session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not book session");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error || !therapist) {
    return (
      <div className="space-y-4">
        <Link href="/client/therapists" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          ← Back to therapists
        </Link>
        <ErrorMessage message={error ?? "Therapist not found"} />
      </div>
    );
  }

  const futureOpenSlots = slots
    .filter((s) => !s.isBooked && new Date(s.startTime).getTime() > Date.now())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      <Link
        href="/client/therapists"
        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Back to therapists
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{user?.name ?? "Therapist"}</h1>
              <p className="text-sm text-zinc-500">{therapist.specialization}</p>
              <p className="mt-1 text-xs text-zinc-400">{user?.email}</p>
            </div>
            {therapist.isVerified && <Badge variant="success">Verified</Badge>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-zinc-600">
            <span>
              <strong className="text-zinc-900">{therapist.rating.toFixed(1)}</strong>★ (
              {therapist.totalRatings} reviews)
            </span>
            <span>{therapist.experience} years experience</span>
            <span>{therapist.hourlyRate ? `₹${therapist.hourlyRate}/hour` : "Pricing TBD"}</span>
          </div>
          {therapist.languages?.length ? (
            <p className="mt-3 text-xs text-zinc-600">
              Languages: <strong>{therapist.languages.join(", ")}</strong>
            </p>
          ) : null}
          {therapist.bio && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
              {therapist.bio}
            </div>
          )}
        </Card>

        <Card title="Book a session">
          <label className="mb-2 block text-xs font-medium text-zinc-600">Type</label>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["VIDEO", "VOICE", "CHAT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                  type === t
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-xs font-medium text-zinc-600">Available slots</label>
          {futureOpenSlots.length === 0 ? (
            <EmptyState title="No open slots" description="Check back later." />
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {futureOpenSlots.slice(0, 50).map((s) => {
                const start = new Date(s.startTime);
                const end = new Date(s.endTime);
                const active = selectedSlot === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(s.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="font-semibold">
                        {start.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>{" "}
                      ·{" "}
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
                      {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4">
            <Button className="w-full" disabled={!selectedSlot} loading={booking} onClick={book}>
              {selectedSlot ? "Confirm booking" : "Select a slot"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
