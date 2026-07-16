// Deletes the signed-in user's account and all their data.
//
// Required by Apple Guideline 5.1.1(v): an app that lets you create an account
// must let you delete it from inside the app. Also the right thing to do.
//
// Runs with the service role because deleting an auth user is privileged — the
// caller's own JWT can't do it. We verify the JWT first and only ever delete the
// user it belongs to, never an id supplied by the client.
//
// Deploy: supabase functions deploy delete-account
// Secrets needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set by default on Supabase)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Identify the caller from their JWT — never trust a client-supplied id.
    const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await asUser.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(url, serviceKey);
    const userId = user.id;

    // 2. Delete this user's own per-user rows.
    for (const table of ["bill_payments", "bill_skips", "income_early_payments", "period_transfers"]) {
      await admin.from(table).delete().eq("user_id", userId);
    }

    // 3. Household data — only if this user is the sole remaining member.
    //    In a shared household we just remove this member and leave the rest intact.
    const { data: memberships } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId);

    for (const m of memberships ?? []) {
      const { data: others } = await admin
        .from("household_members")
        .select("user_id")
        .eq("household_id", m.household_id)
        .neq("user_id", userId);

      if (!others || others.length === 0) {
        for (const table of ["bills", "income", "accounts", "pay_periods", "categories", "debts"]) {
          await admin.from(table).delete().eq("household_id", m.household_id);
        }
        await admin.from("household_members").delete().eq("household_id", m.household_id);
        await admin.from("households").delete().eq("id", m.household_id);
      } else {
        await admin
          .from("household_members")
          .delete()
          .eq("household_id", m.household_id)
          .eq("user_id", userId);
      }
    }

    // 4. Finally the auth user itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
