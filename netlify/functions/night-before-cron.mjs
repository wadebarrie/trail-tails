/** Hourly trigger — calls Next.js cron route with CRON_SECRET (set in Netlify env).
 *  Night-before texts send on the first hourly run at or after each company's configured time.
 */
export const config = {
  schedule: "0 * * * *",
};

export default async function handler() {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;

  if (!base || !secret) {
    return new Response(
      JSON.stringify({ error: "URL or CRON_SECRET not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = `${base}/api/cron/night-before`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
