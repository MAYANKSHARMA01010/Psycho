
import Link from "next/link";

export default function Home() {
	return (
		<main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
			<section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
				<h1 className="text-3xl font-semibold text-zinc-900">Welcome</h1>
				<p className="mt-3 text-zinc-600">
					This is dummy information for the landing page. You can use this area for app details,
					announcements, or onboarding notes.
				</p>

				<div className="mt-6">
					<Link
						href="/login"
						className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
					>
						Go to Login
					</Link>
				</div>
			</section>
		</main>
	);
}
  