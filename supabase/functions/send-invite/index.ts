// SAM: emails a team invite through Resend. Deployed in Supabase as "send-invite" (web address: /functions/v1/clever-action).
// Secrets (Supabase > Edge Functions > Secrets):
//   RESEND_API_KEY  - required
//   SAM_FROM        - optional, e.g. "SAM <invites@yourdomain.com.au>". Until a domain is verified in Resend,
//                     leave it out: Resend's test sender only delivers to your own Resend email address.
//   SAM_APP_URL     - optional, defaults to the GitHub Pages address
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { team_id, email } = await req.json();
    if (!team_id || !email) return json({ error: "Missing team or email" }, 400);

    // Act as the signed-in user, so the database security rules apply
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, req.headers.get("apikey") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: "Please log in again" }, 401);

    // Only members of the team can see (and so send) its invites
    const { data: invite } = await sb.from("team_invites").select("email, teams(name)")
      .eq("team_id", team_id).ilike("email", email).maybeSingle();
    if (!invite) return json({ error: "Invite not found" }, 404);
    const { data: me } = await sb.from("profiles").select("name, email").eq("id", user.id).single();

    const team = (invite as any).teams?.name ?? "a team";
    const from = me?.name || me?.email || "A colleague";
    const appUrl = Deno.env.get("SAM_APP_URL") ?? "https://joes2525.github.io/SAM/";
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#102a43">
      <div style="background:#102a43;padding:18px 24px;border-radius:12px 12px 0 0;color:#fff;font-size:20px;font-weight:bold">SAM <span style="color:#ff6b35">Register</span></div>
      <div style="border:1px solid #e3e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
        <p>Hi,</p>
        <p><b>${esc(from)}</b> has invited you to join <b>${esc(team)}</b> on SAM (Smoke Alarm Maintenance), where the team keeps its smoke alarm records.</p>
        <p><b>To join:</b></p>
        <ol><li>Create your SAM account using this email address (<b>${esc(invite.email)}</b>). Already have an account? Just log in.</li>
        <li>Open <b>Teams</b> and click <b>Join team</b>.</li></ol>
        <p style="text-align:center;margin:28px 0"><a href="${appUrl}#/signup" style="background:#ff6b35;color:#fff;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:bold">Join ${esc(team)} on SAM</a></p>
        <p style="font-size:13px;color:#52677b">Not expecting this? You can ignore this email.</p>
      </div></div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("SAM_FROM") ?? "SAM <onboarding@resend.dev>",
        to: [invite.email],
        reply_to: me?.email,
        subject: `${from} invited you to join ${team} on SAM`,
        html,
      }),
    });
    const out = await res.json();
    if (!res.ok) return json({ error: out?.message ?? "Email could not be sent" }, 502);
    return json({ sent: true, id: out.id });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
