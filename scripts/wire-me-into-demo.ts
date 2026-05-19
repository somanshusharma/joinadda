/**
 * Connect a real user (yours) into the seeded demo world so everything's populated.
 *
 * - Sets your current city to Mohali (where the seed lives)
 * - Follows all fake personas (riya, arjun, …)
 * - Joins you into ALL active communities (interest + city)
 * - RSVPs you to a few upcoming events
 * - Joins you to a few hangouts
 * - Sends you one DM thread so /chat isn't empty
 *
 * Usage:
 *   npx tsx scripts/wire-me-into-demo.ts somanshu@yopmail.com
 *
 * Safe to re-run.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    // ignore
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error(
    "Usage: npx tsx scripts/wire-me-into-demo.ts your-email@example.com",
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1) Find the user by email
  console.log(`→ looking up ${email}…`);
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const me = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!me) {
    console.error(`No auth user with email ${email}. Sign up first via the app.`);
    process.exit(1);
  }
  console.log(`  ✓ user id ${me.id}`);

  // 2) Make sure a profile exists (in case they didn't finish onboarding)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", me.id)
    .maybeSingle();

  // 3) Lookup Mohali + set as current city
  const { data: mohali } = await supabase
    .from("cities")
    .select("id, name")
    .eq("slug", "mohali")
    .single();
  if (!mohali) {
    console.error("Mohali city not found. Run base migrations + seed first.");
    process.exit(1);
  }

  if (!existing) {
    const fallbackName =
      email.split("@")[0].replace(/[^a-z0-9]/gi, " ").trim() || "Friend";
    const fallbackHandle = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    console.log("→ no profile yet, creating one…");
    const { error: upErr } = await supabase.from("profiles").upsert({
      id: me.id,
      username: fallbackHandle || `user${me.id.slice(0, 6)}`,
      display_name: fallbackName,
      bio: "Just here for the chai and good plans.",
      profession: "Building things",
      vibe_tags: ["Cafe hopper", "Foodie", "Traveler"],
      current_city_id: mohali.id,
      hometown_city_id: mohali.id,
      is_onboarded: true,
    });
    if (upErr) {
      console.error("Failed to create profile:", upErr.message);
      process.exit(1);
    }
  } else {
    console.log("→ updating your city to Mohali + ensuring onboarded…");
    await supabase
      .from("profiles")
      .update({ current_city_id: mohali.id, is_onboarded: true })
      .eq("id", me.id);
  }

  // 4) Find all fake personas (anyone @adda.test) and follow them
  const fakeEmails = list!.users
    .filter((u) => u.email?.endsWith("@adda.test"))
    .map((u) => u.id);
  console.log(`→ following ${fakeEmails.length} seeded personas…`);
  for (const otherId of fakeEmails) {
    if (otherId === me.id) continue;
    await supabase
      .from("follows")
      .upsert({ follower_id: me.id, following_id: otherId });
    // And some of them follow you back for visible follower count
    if (Math.random() > 0.4) {
      await supabase
        .from("follows")
        .upsert({ follower_id: otherId, following_id: me.id });
    }
  }

  // 5) Join all active communities
  const { data: communities } = await supabase
    .from("communities")
    .select("id, slug, name")
    .eq("is_active", true);
  console.log(`→ joining ${(communities ?? []).length} communities…`);
  for (const c of communities ?? []) {
    await supabase
      .from("community_members")
      .upsert({ community_id: c.id, profile_id: me.id });
  }

  // 6) RSVP to up to 3 upcoming events
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(3);
  console.log(`→ RSVPing to ${(events ?? []).length} events…`);
  for (const e of events ?? []) {
    await supabase
      .from("event_rsvps")
      .upsert({ event_id: e.id, profile_id: me.id, status: "going" });
  }

  // 7) Join up to 3 open hangouts
  const { data: hangouts } = await supabase
    .from("hangouts")
    .select("id, activity")
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(3);
  console.log(`→ joining ${(hangouts ?? []).length} hangouts…`);
  for (const h of hangouts ?? []) {
    await supabase
      .from("hangout_joiners")
      .upsert({ hangout_id: h.id, profile_id: me.id, status: "going" });
  }

  // 8) Start a DM thread with one persona so /chat has content
  const { data: riyaList } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const riya = riyaList?.users.find((u) => u.email === "riya@adda.test");
  if (riya && riya.id !== me.id) {
    // Look for an existing DM
    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversation:conversation_id(type)")
      .eq("profile_id", me.id);
    const myDmIds = ((mine ?? []) as unknown as {
      conversation_id: string;
      conversation: { type: string } | null;
    }[])
      .filter((r) => r.conversation?.type === "dm")
      .map((r) => r.conversation_id);

    let convId: string | null = null;
    if (myDmIds.length > 0) {
      const { data: theirs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", riya.id)
        .in("conversation_id", myDmIds);
      convId = (theirs ?? [])[0]?.conversation_id ?? null;
    }

    if (!convId) {
      console.log("→ starting a DM thread with riya…");
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ type: "dm" })
        .select("id")
        .single();
      if (conv) {
        convId = conv.id;
        await supabase
          .from("conversation_participants")
          .insert({ conversation_id: convId, profile_id: me.id });
        await supabase
          .from("conversation_participants")
          .insert({ conversation_id: convId, profile_id: riya.id });
        const base = Date.now() - 1000 * 60 * 30;
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: riya.id,
          content: "Hey! Saw you joined Adda — welcome 👋",
          created_at: new Date(base).toISOString(),
        });
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: riya.id,
          content: "Few of us are doing the Triund trek next weekend — you in?",
          created_at: new Date(base + 60 * 1000).toISOString(),
        });
      }
    }
  }

  console.log("\nDone. Refresh the app — / should be alive now.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
