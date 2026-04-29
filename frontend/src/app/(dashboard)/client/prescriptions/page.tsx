"use client";

import { useCallback, useEffect, useState } from "react";
import { prescriptionApi } from "@/api/resources";
import type { Prescription } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge, EmptyState, ErrorMessage, Spinner } from "@/components/ui/Misc";

function medicationCount(prescription: Prescription) {
  return Array.isArray(prescription.medications) ? prescription.medications.length : 0;
}

export default function ClientPrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionApi.mine({ limit: 30 });
      const prescriptions = res.data.items ?? res.data.prescriptions ?? [];
      setItems(prescriptions);
      setSelected((current) => current ?? prescriptions[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load prescriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Prescriptions</h1>
        <p className="text-sm text-zinc-500">Review medication instructions shared by your therapist.</p>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total prescriptions" value={loading ? "-" : items.length} />
        <StatCard
          label="Latest issued"
          value={items[0] ? new Date(items[0].issuedAt).toLocaleDateString() : "None"}
        />
        <StatCard label="PDF ready" value={items.filter((item) => item.pdfUrl).length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Prescription list" className="lg:col-span-1">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Spinner /> Loading...
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No prescriptions" description="New prescriptions will appear here." />
          ) : (
            <ul className="space-y-2">
              {items.map((prescription) => {
                const active = selected?.id === prescription.id;
                return (
                  <li key={prescription.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(prescription)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                      }`}
                    >
                      <p className="text-sm font-medium">{medicationCount(prescription)} medication(s)</p>
                      <p className={`mt-1 text-xs ${active ? "text-zinc-300" : "text-zinc-500"}`}>
                        {new Date(prescription.issuedAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Details" className="lg:col-span-2">
          {!selected ? (
            <EmptyState title="Select a prescription" />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Issued {new Date(selected.issuedAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-zinc-500">Prescription ID: {selected.id}</p>
                </div>
                <Badge variant={selected.pdfUrl ? "success" : "default"}>
                  {selected.pdfUrl ? "PDF ready" : "PDF pending"}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-900">Medications</h3>
                <div className="mt-3 space-y-3">
                  {selected.medications.map((medication, index) => (
                    <div key={`${medication.name}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-medium text-zinc-900">{medication.name}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {medication.dosage} - {medication.frequency}
                        {medication.duration ? ` - ${medication.duration}` : ""}
                      </p>
                      {medication.notes && <p className="mt-2 text-xs text-zinc-500">{medication.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-900">Instructions</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  {selected.instructions}
                </p>
              </div>

              {selected.pdfUrl && (
                <a href={selected.pdfUrl} target="_blank" rel="noreferrer">
                  <Button>Open PDF</Button>
                </a>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
