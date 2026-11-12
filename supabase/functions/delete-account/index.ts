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
// Secrets needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set by default on
//   Supabase), and — to also disconnect the bank at Plaid — PLAID_CLIENT_ID,
//   PLAID_SECRET and PLAID_ENV (sandbox | development | production).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAID_HOSTS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

// Revoke a single Plaid access token at Plaid (/item/remove). Best-effort: we
// return an error string instead of throwing so one failed revoke never blocks
// the rest of account deletion. Returns null on success.
async function plaidItemRemove(accessToken: string): Promise<string | null> {
  const clientId = Deno.env.get("PLAID_CLIENT_ID");
  const secret = Deno.env.get("PLAID_SECRET");
  const env = (Deno.env.get("PLAID_ENV") || "sandbox").toLowerCase();
  const host = PLAID_HOSTS[env] || PLAID_HOSTS.sandbox;
  if (!clientId || !secret) {
    return "Plaid credentials not configured (PLAID_CLIENT_ID / PLAID_SECRET)";
  }
  try {
    const res = await fetch(`${host}/item/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: accessToken,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      // ITEM_NOT_FOUND / already-removed is effectively success for our purposes.
      if (txt.includes("ITEM_NOT_FOUND")) return null;
      return `Plaid /item/remove ${res.status}: ${txt.slice(0, 300)}`;
    }
    return null;
  } catch (e) {
    return `Plaid /item/remove failed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

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
    const warnings: string[] = [];

    // 2. Disconnect any linked banks at Plaid, THEN delete the stored tokens.
    //    The privacy policy promises the bank connection is removed, so we must
    //    call Plaid /item/remove (which invalidates the access token on Plaid's
    //    side) before dropping our rows — otherwise the link lingers at Plaid.
    //    We read with the service role because access_token is RLS-hidden from
    //    clients. Failures are collected as warnings, not fatal: the user must
    //    still be able to delete their account even if Plaid is unreachable.
    const { data: plaidItems, error: plaidReadErr } = await admin
      .from("plaid_items")
      .select("id, access_token")
      .eq("user_id", userId);
    if (plaidReadErr) {
      warnings.push(`Could not read plaid_items: ${plaidReadErr.message}`);
    }
    for (const item of plaidItems ?? []) {
      if (item.access_token) {
        const err = await plaidItemRemove(item.access_token);
        if (err) warnings.push(err);
      }
    }
    const { error: plaidDelErr } = await admin
      .from("plaid_items")
      .delete()
      .eq("user_id", userId);
    if (plaidDelErr) warnings.push(`Could not delete plaid_items: ${plaidDelErr.message}`);

    // 3. Delete this user's own per-user rows.
    for (const table of ["bill_payments", "bill_skips", "income_early_payments", "period_transfers"]) {
      await admin.from(table).delete().eq("user_id", userId);
    }

    // 4. Household data — only if this user is the sole remaining member.
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

    // 5. Finally the auth user itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: delErr.message }, 500);

    // Account IS deleted even if a Plaid revoke warned; surface warnings so the
    // client/logs can see a bank link may need manual cleanup at Plaid.
    return json(warnings.length ? { success: true, warnings } : { success: true });
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
