/** Every 15 minutes — calls Next.js cron route with CRON_SECRET (set in Netlify env).
 *  Night-before texts send on the first run at or after each company's local reminder time.
 *  A top-of-hour UTC schedule made 7:30 PM Pacific look like 3:00 AM in UTC logs.
 */
export const config = {
  schedule: "*/15 * * * *",
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
