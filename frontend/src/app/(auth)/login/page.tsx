"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { completeOnboardingApi, getGoogleAuthUrl, getOnboardingStatusApi } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";
import type { AuthRole, AuthUser } from "@/context/AuthContext";

type OnboardingProfile = {
  fullName: string;
  careGoal: "stress" | "sleep" | "relationships" | "career" | "other";
  sessionStyle: "video" | "chat" | "mixed";
  reminderChannel: "email" | "whatsapp" | "none";
};

type OnboardingState = {
  fullName: string;
  careGoal: OnboardingProfile["careGoal"];
  sessionStyle: OnboardingProfile["sessionStyle"];
  reminderChannel: OnboardingProfile["reminderChannel"];
};

const defaultOnboardingState: OnboardingState = {
  fullName: "",
  careGoal: "stress",
  sessionStyle: "video",
  reminderChannel: "email",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.6 2.2 12 2.2A9.8 9.8 0 0 0 2.2 12 9.8 9.8 0 0 0 12 21.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path fill="#34A853" d="M3.3 7.4l3.2 2.3C7.3 8 9.5 6.3 12 6.3c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.6 2.2 12 2.2A9.8 9.8 0 0 0 3.3 7.4z" />
      <path fill="#4A90E2" d="M12 21.8c2.5 0 4.7-.8 6.3-2.3l-3-2.4c-.8.6-1.9 1-3.3 1-4 0-5.3-2.6-5.5-3.9l-3.1 2.4A9.8 9.8 0 0 0 12 21.8z" />
      <path fill="#FBBC05" d="M3.3 16.6l3.1-2.4c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.3 8A9.8 9.8 0 0 0 2.2 12c0 1.6.4 3.2 1.1 4.6z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, setSession, forgotPassword, logout, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AuthRole>("CLIENT");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboarding, setOnboarding] = useState<OnboardingState>(defaultOnboardingState);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [pendingTokens, setPendingTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  function beginOnboarding(user: AuthUser, tokens: { accessToken: string; refreshToken: string }) {
    setPendingUser(user);
    setPendingTokens(tokens);
    setOnboarding({
      ...defaultOnboardingState,
      fullName: user.name ?? "",
    });
    setOnboardingStep(1);
    setShowOnboarding(true);
  }

  async function completeLoginFlow(user: AuthUser, tokens: { accessToken: string; refreshToken: string }) {
    if (!user.onboardingCompleted) {
      beginOnboarding(user, tokens);
      return;
    }

    try {
      const status = await getOnboardingStatusApi(tokens.accessToken);

      if (!status.data.onboardingCompleted) {
        beginOnboarding(user, tokens);
        return;
      }
    } catch {
      beginOnboarding(user, tokens);
      return;
    }

    router.push("/");
  }

  async function enforceSelectedRole(user: AuthUser, selectedRole: AuthRole) {
    if (user.role === selectedRole) {
      return true;
    }

    await logout();
    setError(`This account is registered as ${user.role}. Please select ${user.role} to continue.`);
    return false;
  }

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (typeof window === "undefined" || !window.location.hash) {
        return;
      }

      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userRaw = params.get("user");

      if (!accessToken || !refreshToken || !userRaw) {
        return;
      }

      try {
        const user = JSON.parse(userRaw) as { id?: string; name?: string; email: string; role: AuthRole };
        setSession({
          user,
          accessToken,
          refreshToken,
        });
        window.history.replaceState(null, "", window.location.pathname);
        await completeLoginFlow(user, { accessToken, refreshToken });
      } catch {
        setError("Could not complete Google login");
      }
    };

    void handleOAuthCallback();
  }, [router, setSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const session = await login({ email, password, role });
      const isRoleValid = await enforceSelectedRole(session.user, role);
      if (!isRoleValid) {
        return;
      }
      await completeLoginFlow(session.user, {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  function handleOnboardingNext() {
    if (onboardingStep === 1 && !onboarding.fullName.trim()) {
      setError("Please add your name to continue onboarding");
      return;
    }

    setError("");
    setOnboardingStep((prev) => Math.min(prev + 1, 3));
  }

  function handleOnboardingBack() {
    setError("");
    setOnboardingStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleFinishOnboarding() {
    if (!pendingUser || !pendingTokens) {
      return;
    }

    setError("");

    try {
      const response = await completeOnboardingApi({
        accessToken: pendingTokens.accessToken,
        fullName: onboarding.fullName,
        careGoal: onboarding.careGoal,
        sessionStyle: onboarding.sessionStyle,
        reminderChannel: onboarding.reminderChannel,
      });

      setSession({
        user: response.data.user,
        accessToken: pendingTokens.accessToken,
        refreshToken: pendingTokens.refreshToken,
      });
      setShowOnboarding(false);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save onboarding details");
    }
  }

  async function handleSkipOnboarding() {
    if (!pendingUser || !pendingTokens) {
      return;
    }

    setError("");

    try {
      const response = await completeOnboardingApi({
        accessToken: pendingTokens.accessToken,
        fullName: (pendingUser.name ?? pendingUser.email.split("@")[0]).trim(),
        careGoal: onboarding.careGoal,
        sessionStyle: onboarding.sessionStyle,
        reminderChannel: onboarding.reminderChannel,
      });

      setSession({
        user: response.data.user,
        accessToken: pendingTokens.accessToken,
        refreshToken: pendingTokens.refreshToken,
      });
      setShowOnboarding(false);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete onboarding");
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email) {
      setError("Enter your email first");
      return;
    }

    try {
      const responseMessage = await forgotPassword(email);
      setMessage(responseMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forgot password request failed");
    }
  }

  function handleGoogleLogin() {
    window.location.assign(getGoogleAuthUrl(role));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full bg-cyan-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-60 w-60 rounded-full bg-amber-200/45 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Welcome Back</p>
        <h1 className="text-3xl font-semibold leading-tight text-slate-900">Sign in to Zenora</h1>
        <p className="mt-2 text-sm text-slate-600">Continue with your account to access appointments and care history.</p>

        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="mt-4 whitespace-pre-line rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-20 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Login as</span>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "CLIENT", label: "Client" },
                { value: "THERAPIST", label: "Therapist" },
                { value: "ADMIN", label: "Admin" },
              ] as const).map((option) => {
                const isActive = role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative flex justify-center text-xs font-medium uppercase tracking-widest text-slate-400">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center justify-between pt-1 text-sm">
            <button type="button" onClick={handleForgotPassword} className="font-medium text-slate-600 transition hover:text-slate-900">
              Forgot password?
            </button>
            <Link href="/" className="font-medium text-slate-600 transition hover:text-slate-900">
              Back to home
            </Link>
          </div>
        </form>
      </section>

      {showOnboarding ? (
        <section className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">First Login Setup</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Let us personalize your experience</h2>
                <p className="mt-2 text-sm text-slate-600">Step {onboardingStep} of 3</p>
              </div>
              <button
                type="button"
                onClick={handleSkipOnboarding}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                Skip
              </button>
            </div>

            {onboardingStep === 1 ? (
              <div className="space-y-4">
                <label htmlFor="onboarding-name" className="block text-sm font-medium text-slate-700">
                  What should we call you?
                </label>
                <input
                  id="onboarding-name"
                  value={onboarding.fullName}
                  onChange={(event) => setOnboarding((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            ) : null}

            {onboardingStep === 2 ? (
              <div className="space-y-4">
                <label htmlFor="onboarding-goal" className="block text-sm font-medium text-slate-700">
                  Primary care goal
                </label>
                <select
                  id="onboarding-goal"
                  value={onboarding.careGoal}
                  onChange={(event) =>
                    setOnboarding((prev) => ({
                      ...prev,
                      careGoal: event.target.value as OnboardingProfile["careGoal"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="stress">Stress management</option>
                  <option value="sleep">Sleep improvement</option>
                  <option value="relationships">Relationship support</option>
                  <option value="career">Career confidence</option>
                  <option value="other">Something else</option>
                </select>

                <label htmlFor="onboarding-session" className="block text-sm font-medium text-slate-700">
                  Preferred session style
                </label>
                <select
                  id="onboarding-session"
                  value={onboarding.sessionStyle}
                  onChange={(event) =>
                    setOnboarding((prev) => ({
                      ...prev,
                      sessionStyle: event.target.value as OnboardingProfile["sessionStyle"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="video">Video sessions</option>
                  <option value="chat">Chat sessions</option>
                  <option value="mixed">Mix of both</option>
                </select>
              </div>
            ) : null}

            {onboardingStep === 3 ? (
              <div className="space-y-4">
                <label htmlFor="onboarding-reminder" className="block text-sm font-medium text-slate-700">
                  Reminder preference
                </label>
                <select
                  id="onboarding-reminder"
                  value={onboarding.reminderChannel}
                  onChange={(event) =>
                    setOnboarding((prev) => ({
                      ...prev,
                      reminderChannel: event.target.value as OnboardingProfile["reminderChannel"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="email">Email reminders</option>
                  <option value="whatsapp">WhatsApp reminders</option>
                  <option value="none">No reminders</option>
                </select>
                <p className="text-sm text-slate-600">
                  You can change all onboarding preferences later from account settings.
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleOnboardingBack}
                disabled={onboardingStep === 1}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              {onboardingStep < 3 ? (
                <button
                  type="button"
                  onClick={handleOnboardingNext}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="rounded-xl bg-cyan-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
                >
                  Finish Setup
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
