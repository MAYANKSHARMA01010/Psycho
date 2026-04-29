"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { assessmentApi } from "@/api/resources";
import type { Assessment } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge, EmptyState, ErrorMessage, Spinner } from "@/components/ui/Misc";

const QUESTIONS = [
  { key: "mood", label: "Mood stability" },
  { key: "sleep", label: "Sleep quality" },
  { key: "stress", label: "Stress level" },
  { key: "focus", label: "Daily focus" },
  { key: "support", label: "Support feeling" },
] as const;

type Scores = Record<(typeof QUESTIONS)[number]["key"], number>;

const initialScores: Scores = {
  mood: 3,
  sleep: 3,
  stress: 3,
  focus: 3,
  support: 3,
};

function severityVariant(severity?: string) {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MODERATE" || severity === "MILD") return "warn";
  return "success";
}

export default function ClientAssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<Scores>(initialScores);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assessmentApi.mine({ limit: 20 });
      setItems(res.data.items ?? res.data.assessments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const average = useMemo(() => {
    const values = Object.values(scores);
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [scores]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const responses = {
        scale: "1-5",
        scores,
        submittedFrom: "client-assessments-page",
      };
      const res = await assessmentApi.submit({ responses });
      setItems((prev) => [res.data.assessment, ...prev]);
      setScores(initialScores);
      toast.success("Assessment submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit assessment");
    } finally {
      setSubmitting(false);
    }
  }

  const latest = items[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Assessments</h1>
        <p className="text-sm text-zinc-500">Submit a quick check-in and review your wellness history.</p>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total assessments" value={loading ? "-" : items.length} />
        <StatCard label="Latest severity" value={loading ? "-" : latest?.severity ?? "Not taken"} />
        <StatCard label="Current draft avg" value={average} hint="1 to 5 scale" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="New check-in" className="lg:col-span-1">
          <form className="space-y-5" onSubmit={submit}>
            {QUESTIONS.map((question) => (
              <label key={question.key} className="block">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700">{question.label}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {scores[question.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={scores[question.key]}
                  onChange={(event) =>
                    setScores((prev) => ({
                      ...prev,
                      [question.key]: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-zinc-900"
                />
              </label>
            ))}

            <Button type="submit" loading={submitting} className="w-full">
              Submit assessment
            </Button>
          </form>
        </Card>

        <Card title="History" className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Spinner /> Loading...
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No assessments yet" description="Submit your first check-in to start tracking." />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map((assessment) => (
                <li key={assessment.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">Score {assessment.score}</p>
                      <Badge variant={severityVariant(assessment.severity)}>{assessment.severity}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Completed {new Date(assessment.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{new Date(assessment.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
