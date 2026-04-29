"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { therapistsApi } from "@/api/resources";
import type { Therapist } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorMessage, Spinner } from "@/components/ui/Misc";

export default function TherapistsBrowsePage() {
  const [items, setItems] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    specialization: "",
    language: "",
    minRating: "",
    onlyAvailable: false,
    search: "",
  });

  async function load(query?: typeof filters) {
    setLoading(true);
    setError(null);
    try {
      const q = query ?? filters;
      const res = await therapistsApi.search({
        specialization: q.specialization || undefined,
        language: q.language || undefined,
        minRating: q.minRating ? Number(q.minRating) : undefined,
        hasAvailability: q.onlyAvailable || undefined,
        search: q.search || undefined,
        sortBy: "rating",
        sortOrder: "desc",
        limit: 30,
      });
      setItems(res.data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load therapists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Find a therapist</h1>
        <p className="text-sm text-slate-500">
          Browse verified therapists and book a session that fits your schedule.
        </p>
      </header>

      <Card>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-5" onSubmit={onSubmit}>
          <input
            placeholder="Search name, bio…"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
          <input
            placeholder="Specialization (e.g. anxiety)"
            value={filters.specialization}
            onChange={(e) => setFilters((p) => ({ ...p, specialization: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
          <input
            placeholder="Language (e.g. en)"
            value={filters.language}
            onChange={(e) => setFilters((p) => ({ ...p, language: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
          <select
            value={filters.minRating}
            onChange={(e) => setFilters((p) => ({ ...p, minRating: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.onlyAvailable}
              onChange={(e) => setFilters((p) => ({ ...p, onlyAvailable: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Has availability
          </label>
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" loading={loading}>Apply filters</Button>
          </div>
        </form>
      </Card>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Spinner /> <span className="ml-2">Searching…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No therapists found" description="Try loosening your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.user?.name ?? "Therapist"}</h3>
                  <p className="text-sm text-slate-500">{t.specialization}</p>
                </div>
                {t.isVerified && <Badge variant="success">Verified</Badge>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
                <span><strong className="text-slate-900">{t.rating.toFixed(1)}</strong>★ ({t.totalRatings})</span>
                <span>{t.experience} yr exp</span>
                {t.hourlyRate ? <span>₹{t.hourlyRate}/hr</span> : <span>Pricing TBD</span>}
              </div>
              {t.bio && (
                <p className="mt-3 line-clamp-3 text-xs text-slate-500">{t.bio}</p>
              )}
              <div className="mt-4 flex justify-end">
                <Link href={`/client/therapists/${t.id}`}>
                  <Button size="sm">View & book</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
