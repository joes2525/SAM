// SAM: one-off import of the SAM Register test data from Airtable (properties, alarms, tenants, checks and photos).
// Secret needed: AIRTABLE_TOKEN (read-only personal access token for the SAM Register base).
// Only the admin account below can run it. Safe to run again: rows are matched on their Airtable record id.
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "joes25@gmail.com";
const BASE = "appUIPKab2nbCAoFS";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function all(table: string) {
  const out: any[] = []; let offset = "";
  do {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}?pageSize=100${offset ? "&offset=" + offset : ""}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("AIRTABLE_TOKEN")}` } });
    const j = await r.json(); if (!r.ok) throw new Error(`Airtable ${table}: ${j?.error?.message ?? r.status}`);
    out.push(...j.records); offset = j.offset ?? "";
  } while (offset);
  return out;
}
const sel = (v: any) => (v && typeof v === "object" ? v.name : v) ?? null;
const POWER: Record<string, string> = {
  "10-year lithium battery": "10-year sealed lithium battery", "Hardwired (240V)": "240V hardwired",
  "9V lithium battery": "9V replaceable battery", "9V battery": "9V replaceable battery",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const asUser = createClient(url, req.headers.get("apikey") ?? "", { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return json({ error: "Only the SAM admin can run the import" }, 403);
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const log: string[] = [];

    async function photo(att: any, path: string) {
      if (!att?.[0]?.url) return null;
      const img = await fetch(att[0].thumbnails?.large?.url ?? att[0].url);
      if (!img.ok) { log.push(`photo failed: ${path}`); return null; }
      const { error } = await db.storage.from("photos").upload(path, await img.arrayBuffer(), { contentType: att[0].type ?? "image/jpeg", upsert: true });
      if (error) { log.push(`photo upload failed: ${path} ${error.message}`); return null; }
      return path;
    }

    // Properties
    const propId: Record<string, string> = {};
    for (const r of await all("Properties")) {
      const f = r.fields; if (!f["Street"]) continue;
      const row = { airtable_id: r.id, user_id: user.id, street: f["Street"], suburb: f["Suburb"] ?? null, state: sel(f["State"]) ?? "QLD",
        postcode: f["Postcode"] ?? null, property_type: sel(f["Property Type"]), bedrooms: f["Bedrooms"] ?? null, storeys: f["Stories"] ?? null,
        access_notes: f["Access Notes"] ?? null, owner_name: f["Owner"] ?? null, subscription_end: f["SubscriptionEndDate"] ?? null };
      const { data, error } = await db.from("properties").upsert(row, { onConflict: "airtable_id" }).select("id").single();
      if (error) { log.push(`property ${f["Street"]}: ${error.message}`); continue; }
      propId[r.id] = data.id;
      const p = await photo(f["Property Photo"], `${data.id}/property.jpg`);
      if (p) await db.from("properties").update({ photo_path: p }).eq("id", data.id);
    }
    // Alarms
    let alarms = 0;
    for (const r of await all("Alarms")) {
      const f = r.fields; const pid = propId[f["Property"]?.[0]]; if (!pid || !f["Location"]) continue;
      const month = parseInt(String(sel(f["Manufacture Month"]) ?? ""), 10);
      const row = { airtable_id: r.id, property_id: pid, location: f["Location"], alarm_type: sel(f["Type"]),
        power_source: POWER[sel(f["Power Source"]) ?? ""] ?? sel(f["Power Source"]), interconnected: sel(f["Interconnected"]),
        manufacture_month: isNaN(month) ? null : month, manufacture_year: parseInt(String(sel(f["Manufacture Year"]) ?? ""), 10) || null,
        brand: f["Brand"] ?? null, model: f["Model"] ?? null, as3786: sel(f["AS 3786-2014"]) };
      const { data, error } = await db.from("alarms").upsert(row, { onConflict: "airtable_id" }).select("id").single();
      if (error) { log.push(`alarm ${f["Location"]}: ${error.message}`); continue; }
      alarms++;
      const p = await photo(f["Photo"], `${pid}/alarm-${data.id}.jpg`);
      if (p) await db.from("alarms").update({ photo_path: p }).eq("id", data.id);
    }
    // Tenants
    let tenants = 0;
    for (const r of await all("Tenants")) {
      const f = r.fields; const pid = propId[f["Property"]?.[0]]; if (!pid || !f["Name"]) continue;
      const emails = ["Email", "Email 2", "Email 3", "Email 4"].map((k) => f[k]).filter(Boolean);
      const { error } = await db.from("tenants").upsert({ airtable_id: r.id, property_id: pid, name: f["Name"], phone: f["Phone"] ?? null, emails,
        lease_start: f["Lease Start"] ?? null, lease_end: f["Lease End"] ?? null, vacate_date: f["Vacate Date"] ?? null, notes: f["Notes"] ?? null },
        { onConflict: "airtable_id" });
      if (error) log.push(`tenant ${f["Name"]}: ${error.message}`); else tenants++;
    }
    // Checks
    let checks = 0;
    for (const r of await all("Inspections")) {
      const f = r.fields; const pid = propId[f["Property"]?.[0]]; if (!pid) continue;
      const submitted = f["Submitted At"] ?? r.createdTime;
      const assess = sel(f["Inspector Assessment"]);
      const { error } = await db.from("inspections").upsert({ airtable_id: r.id, property_id: pid, inspected_by: user.id,
        inspection_date: f["Inspection Date"] ?? String(submitted).slice(0, 10), submitted_at: submitted,
        check_type: sel(f["Check Type"])?.toLowerCase().includes("licen") ? "licensed" : "manager",
        assessment: assess === "Compliant" || assess === "Not compliant" ? assess : null,
        inspector_override: !!f["Inspector Override"],
        notes: [f["Inspector Notes"], f["Name"] ? `Checked by: ${f["Name"]} (imported from Airtable)` : "Imported from Airtable"].filter(Boolean).join("\n") },
        { onConflict: "airtable_id" });
      if (error) log.push(`check: ${error.message}`); else checks++;
    }
    return json({ properties: Object.keys(propId).length, alarms, tenants, checks, problems: log });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
