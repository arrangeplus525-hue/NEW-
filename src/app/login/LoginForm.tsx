"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">メールアドレス</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">パスワード</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
