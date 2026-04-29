"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { financialApi, paymentsApi, sessionsApi } from "@/api/resources";
import type { Payment, Session, Transaction } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge, EmptyState, ErrorMessage, Spinner } from "@/components/ui/Misc";

const METHODS = ["UPI", "CARD", "NET_BANKING", "WALLET"] as const;

function statusVariant(status: string) {
  if (status === "COMPLETED" || status === "PAID") return "success";
  if (status === "PENDING" || status === "AVAILABLE") return "warn";
  if (status === "FAILED" || status === "REFUNDED") return "danger";
  return "default";
}

export default function ClientPaymentsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("UPI");
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionRes, transactionRes] = await Promise.all([
        sessionsApi.history({ limit: 50 }),
        financialApi.transactions({ limit: 30 }),
      ]);
      const sessionItems = sessionRes.data.items ?? sessionRes.data.sessions ?? [];
      const transactionItems = transactionRes.data.transactions ?? [];
      setSessions(sessionItems);
      setTransactions(transactionItems);
      setSelectedSessionId((current) => current || sessionItems[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const payableSessions = useMemo(
    () => sessions.filter((session) => session.status !== "CANCELLED"),
    [sessions],
  );

  const totalPaid = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === "PAYMENT" && transaction.status === "COMPLETED")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  async function initiatePayment() {
    if (!selectedSessionId) {
      toast.error("Select a session first");
      return;
    }
    setPaying(true);
    try {
      const res = await paymentsApi.initiate({ sessionId: selectedSessionId, method });
      setPendingPayment(res.data.payment);
      toast.success("Payment created. Confirm it to complete the mock gateway flow.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not initiate payment");
    } finally {
      setPaying(false);
    }
  }

  async function confirmPayment() {
    if (!pendingPayment) return;
    setPaying(true);
    try {
      await paymentsApi.confirm({
        paymentId: pendingPayment.id,
        transactionId: `mock_txn_${Date.now()}`,
        gatewayResponse: { source: "client-payments-page" },
      });
      setPendingPayment(null);
      toast.success("Payment confirmed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm payment");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Payments</h1>
        <p className="text-sm text-zinc-500">Pay for sessions and review your transaction history.</p>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Transactions" value={loading ? "-" : transactions.length} />
        <StatCard label="Total paid" value={`INR ${totalPaid.toFixed(2)}`} />
        <StatCard label="Payable sessions" value={loading ? "-" : payableSessions.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Make payment" className="lg:col-span-1">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Spinner /> Loading...
            </div>
          ) : payableSessions.length === 0 ? (
            <EmptyState title="No sessions to pay for" description="Book a session first." />
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Session</span>
                <select
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-200"
                >
                  {payableSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.scheduledAt).toLocaleString()} - {session.type} - {session.status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Method</span>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as (typeof METHODS)[number])}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-200"
                >
                  {METHODS.map((item) => (
                    <option key={item} value={item}>
                      {item.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              {pendingPayment ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">Pending payment created</p>
                  <p className="mt-1 text-xs text-amber-800">
                    INR {pendingPayment.amount.toFixed(2)} for session {pendingPayment.sessionId}
                  </p>
                  <Button className="mt-3 w-full" loading={paying} onClick={confirmPayment}>
                    Confirm payment
                  </Button>
                </div>
              ) : (
                <Button className="w-full" loading={paying} onClick={initiatePayment}>
                  Initiate payment
                </Button>
              )}
            </div>
          )}
        </Card>

        <Card title="Transaction history" className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Spinner /> Loading...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {transactions.map((transaction) => (
                <li key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">{transaction.description}</p>
                      <Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {transaction.type} - {new Date(transaction.date).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {transaction.currency} {transaction.amount.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
