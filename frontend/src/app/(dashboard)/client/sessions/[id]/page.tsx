"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { chatApi, sessionsApi } from "@/api/resources";
import type { ChatMessage, Session } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, ErrorMessage, PageLoader } from "@/components/ui/Misc";

export default function ClientSessionDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSession = useCallback(async () => {
    if (!id) return;
    try {
      const res = await sessionsApi.getById(id);
      setSession(res.data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load session");
    }
  }, [id]);

  const loadChat = useCallback(async () => {
    if (!id) return;
    try {
      const res = await chatApi.history(id, { limit: 100 });
      setMessages(res.data.messages ?? []);
    } catch {
      // not fatal
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadSession(), loadChat()]).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadSession, loadChat]);

  // Lightweight polling for chat (Socket.io upgrade can come later)
  useEffect(() => {
    if (!id) return;
    const t = setInterval(loadChat, 5000);
    return () => clearInterval(t);
  }, [id, loadChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!id || !draft.trim()) return;
    setSending(true);
    try {
      const res = await chatApi.send(id, draft.trim());
      setDraft("");
      setMessages((prev) => [...prev, res.data.message]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function cancelSession() {
    if (!id) return;
    const reason = window.prompt("Cancellation reason");
    if (!reason) return;
    try {
      await sessionsApi.cancel(id, reason);
      toast.success("Session cancelled");
      await loadSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel");
    }
  }

  if (loading) return <PageLoader />;
  if (!session) return <ErrorMessage message={error ?? "Session not found"} />;

  return (
    <div className="space-y-6">
      <Link
        href="/client/sessions"
        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Back to sessions
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                {session.therapist?.user.name ?? "Therapist"}
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(session.scheduledAt).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Type: {session.type}</p>
            </div>
            <Badge
              variant={
                session.status === "COMPLETED"
                  ? "success"
                  : session.status === "CANCELLED"
                    ? "danger"
                    : "info"
              }
            >
              {session.status}
            </Badge>
          </div>
          {session.notes && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-700">Therapist notes</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600">{session.notes}</p>
            </div>
          )}
          {session.cancellationReason && (
            <p className="mt-3 text-xs text-rose-700">Cancelled: {session.cancellationReason}</p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {(session.status === "PENDING" || session.status === "CONFIRMED") && (
              <Button variant="danger" size="sm" onClick={cancelSession}>
                Cancel session
              </Button>
            )}
          </div>
        </Card>

        <Card title="Conversation" className="lg:col-span-2 flex flex-col">
          <div ref={scrollRef} className="max-h-[60vh] min-h-[40vh] flex-1 space-y-2 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-500">No messages yet. Say hello!</p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                        mine ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-zinc-300" : "text-zinc-500"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="mt-3 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-200"
            />
            <Button type="submit" loading={sending} disabled={!draft.trim()}>
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
