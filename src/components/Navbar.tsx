"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Ost Composer
        </Link>
        <div className="flex items-center gap-6">
          {loading ? null : user ? (
            <>
              <Link href="/compose" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Compose
              </Link>
              <Link href="/posts" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                My Posts
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  {user.name || user.email}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
