"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMfaIssuer } from "@/lib/site-url";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export function MfaEnrollForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function enroll() {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "PackRoute Admin",
        issuer: getMfaIssuer(),
      });

      if (cancelled) return;

      if (enrollError || !data) {
        setError(enrollError?.message ?? "Could not start MFA setup.");
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp?.qr_code ?? null);
      setSecret(data.totp?.secret ?? null);
      setLoading(false);
    }

    enroll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) return;

    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Invalid code. Check your authenticator app and try again.");
      setPending(false);
      return;
    }

    router.replace(AUTH_ROUTES.adminHome);
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Preparing authenticator setup…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Scan this QR code with an authenticator app (1Password, Authy, Google
        Authenticator, etc.), then enter the 6-digit code to finish setup.
      </p>

      {qrCode ? (
        <div className="flex justify-center rounded-xl border border-stone-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="TOTP QR code" width={200} height={200} />
        </div>
      ) : null}

      {secret ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
          Manual entry key:{" "}
          <code className="font-mono text-stone-800">{secret}</code>
        </p>
      ) : null}

      <form onSubmit={handleVerify} className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="mfa-code" className="block text-sm font-medium text-stone-700">
            Verification code
          </label>
          <input
            id="mfa-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            disabled={pending}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className={`${primaryButtonClassName} w-full rounded-xl py-3`}
        >
          {pending ? "Verifying…" : "Enable authenticator"}
        </button>
      </form>
    </div>
  );
}
