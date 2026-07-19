import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <section className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Multi-platform composer
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Compose once. Publish everywhere.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Ost Composer helps you draft, validate, schedule, and manage social
          media posts for X, Reddit, LinkedIn, and more. Customers create posts;
          admins can claim and control them.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-slate-900 px-6 py-3 text-base font-medium text-white hover:bg-slate-800"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-white px-6 py-3 text-base font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Multi-platform", desc: "Select one or more platforms from a dropdown with per-platform validation." },
          { title: "Smart validation", desc: "Character limits are checked automatically for every selected network." },
          { title: "Scheduling", desc: "Pick a date and time, and posts are published automatically when due." },
          { title: "Edit & delete", desc: "Update or remove posts from the post stream at any time." },
          { title: "Role-based access", desc: "Customer accounts create posts; admins can claim and control them." },
          { title: "Post stream", desc: "See every post you have created in one clean, filterable timeline." },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
