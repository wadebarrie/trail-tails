"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { acceptInviteAction } from "@/features/platform/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { InvitePreview } from "@/features/platform/queries";

type SignupFormProps = {
  token: string;
  preview: InvitePreview;
};

export function SignupForm({ token, preview }: SignupFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(acceptInviteAction, {
    ok: false as const,
    error: "",
  });

  useEffect(() => {
    if (state.ok) {
      router.replace("/login?registered=1");
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />

      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
        <p>
          <span className="font-medium">Company:</span> {preview.companyName}
        </p>
        <p className="mt-1">
          <span className="font-medium">Email:</span> {preview.email}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-stone-500">
          At least 12 characters with a letter and a number.
        </p>
      </div>

      <div>
        <label
          htmlFor="password_confirm"
          className="block text-sm font-medium text-stone-700"
        >
          Confirm password
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <SubmitButton pending={pending} className="w-full rounded-xl py-3">
        Create account
      </SubmitButton>
    </form>
  );
}
