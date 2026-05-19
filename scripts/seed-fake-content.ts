/**
 * Seed fake users, posts, events, hangouts, anonymous gossip, reactions, comments
 * for local/dev testing. Idempotent — safe to re-run.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Run with: npm run seed:fake
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Unsplash helpers (free, no key required for these URLs) ──────────────
const u = (id: string, w = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
const portrait = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=256&h=256&q=80&auto=format&fit=crop&crop=faces`;

type Persona = {
  username: string;
  display_name: string;
  profession: string;
  company: string | null;
  bio: string;
  vibes: string[];
  hometown_slug: string;
  current_slug: string;
  avatar_url: string;
};

const PERSONAS: Persona[] = [
  {
    username: "riya",
    display_name: "Riya Sharma",
    profession: "Frontend dev",
    company: "Razorpay",
    bio: "React, chai, mountains. Probably overthinking your CSS.",
    vibes: ["Cafe hopper", "Trekker", "Reader", "Music head"],
    hometown_slug: "mohali",
    current_slug: "mohali",
    avatar_url: portrait("1494790108377-be9c29b29330"),
  },
  {
    username: "arjun",
    display_name: "Arjun Mehta",
    profession: "Product manager",
    company: "Zomato",
    bio: "Building things, eating other things. Mohali → Bangalore → Mohali.",
    vibes: ["Foodie", "Cinephile", "Cricket lover", "Night owl"],
    hometown_slug: "bangalore",
    current_slug: "mohali",
    avatar_url: portrait("1507003211169-0a1dd7228f2d"),
  },
  {
    username: "ananya",
    display_name: "Ananya Iyer",
    profession: "UX designer",
    company: null,
    bio: "Freelance design, yoga, and rescued cats. In that order.",
    vibes: ["Yoga", "Cook", "Anime fan", "Cafe hopper"],
    hometown_slug: "chennai",
    current_slug: "mohali",
    avatar_url: portrait("1438761681033-6461ffad8d80"),
  },
  {
    username: "kabir",
    display_name: "Kabir Singh",
    profession: "Backend engineer",
    company: "Highrise",
    bio: "Distributed systems by day, pickup football by evening.",
    vibes: ["Football fan", "Gym rat", "Gamer", "Early bird"],
    hometown_slug: "delhi",
    current_slug: "mohali",
    avatar_url: portrait("1500648767791-00dcc994a43e"),
  },
  {
    username: "sneha",
    display_name: "Sneha Kapoor",
    profession: "Data scientist",
    company: "Sprinklr",
    bio: "Numbers, treks, terrible at small talk but great at long walks.",
    vibes: ["Trekker", "Reader", "Cycling", "Photography"],
    hometown_slug: "chandigarh",
    current_slug: "mohali",
    avatar_url: portrait("1544005313-94ddf0286df2"),
  },
  {
    username: "dev",
    display_name: "Dev Aggarwal",
    profession: "Founder",
    company: "stealth thing",
    bio: "Building. Mohali kid, Bangalore alum, back home now.",
    vibes: ["Cafe hopper", "Foodie", "Stand-up comedy", "Night owl"],
    hometown_slug: "mohali",
    current_slug: "mohali",
    avatar_url: portrait("1535713875002-d1d0cf377fde"),
  },
  {
    username: "priya",
    display_name: "Priya Nair",
    profession: "Marketing lead",
    company: "Swiggy",
    bio: "Long runs, longer rants. Trying every cafe in Tricity.",
    vibes: ["Cafe hopper", "Foodie", "Music head", "Traveler"],
    hometown_slug: "kochi",
    current_slug: "mohali",
    avatar_url: portrait("1517841905240-472988babdf9"),
  },
  {
    username: "rahul",
    display_name: "Rahul Verma",
    profession: "Financial analyst",
    company: null,
    bio: "Cricket-on-screen, gym-in-mornings, parathas-at-2am kinda guy.",
    vibes: ["Cricket lover", "Gym rat", "Foodie", "Night owl"],
    hometown_slug: "jaipur",
    current_slug: "mohali",
    avatar_url: portrait("1506794778202-cad84cf45f1d"),
  },
];

const POSTS = [
  "Anyone else still recovering from Monday? My brain is buffering.",
  "Best filter coffee in Mohali — go.",
  "Hot take: working from a cafe is a productivity scam but I keep doing it.",
  "Just discovered I can read again. Closing TikTok permanently. (for at least a week.)",
  "Looking for a Sunday morning trek crew. Anyone down?",
  "Standup tonight at Laugh Club Mohali, who's in?",
  "Cricket WC final at someone's place — drop pin if hosting.",
  "Friday plan: dinner + maybe a movie. Open to anything that isn't an action sequel.",
];

const ANON_POSTS = [
  "Boss just scheduled a 'quick sync' for 6pm. Define 'quick'.",
  "Got rejected from a job I didn't even apply to. The hustle is wild.",
  "Therapist said 'you don't have to fix everything tonight.' I'm trying.",
  "Honest q: does anyone actually use their LinkedIn? Or is it just performance art?",
  "Salary discussion in HR went so well I should've recorded it and made it a podcast.",
];

const COMMENTS = [
  "Down for this 100%",
  "Yo this is exactly my mood",
  "+1 to the cafe scam comment",
  "I'm in — DM me",
  "Big mood ☕",
  "Saving this for later",
];

const REACTIONS = ["relatable", "funny", "fire", "mood", "heart"] as const;

// ── Events with high-quality cover images ───────────────────────────────
const EVENTS: Array<{
  title: string;
  description: string;
  type: "trip" | "workcation" | "hangout" | "community_event";
  location: string;
  daysFromNow: number;
  costInr: number;
  maxAttendees: number;
  cover_image_url: string;
}> = [
  {
    title: "Sunday morning trek — Kasauli",
    description:
      "Easy 6km trail. Leaving Mohali at 6am sharp. We'll grab parathas at Aman's on the way back.",
    type: "trip",
    location: "Kasauli base trail",
    daysFromNow: 4,
    costInr: 0,
    maxAttendees: 12,
    // Misty Himalayan ridge
    cover_image_url: u("1464822759023-fed622ff2c3b", 1200),
  },
  {
    title: "Cafe Lota — work-from-cafe day",
    description:
      "Bring your laptop, claim a corner, no zoom calls. Coffee on us if you stay past 4pm.",
    type: "workcation",
    location: "Cafe Lota, Sector 8",
    daysFromNow: 2,
    costInr: 0,
    maxAttendees: 8,
    // Laptop + latte in a cosy cafe
    cover_image_url: u("1521017432531-fbd92d768814", 1200),
  },
  {
    title: "Friday dinner crew — Sector 17",
    description:
      "New Korean BBQ place. Need 6 people min to book. Casual vibe, split the bill.",
    type: "hangout",
    location: "Sector 17, Chandigarh",
    daysFromNow: 5,
    costInr: 800,
    maxAttendees: 10,
    // Korean BBQ on grill
    cover_image_url: u("1583224994076-ae73a4a8d2e6", 1200),
  },
  {
    title: "Weekend trip — Mcleodganj",
    description:
      "Friday night → Sunday evening. Stay sorted (hostel, 4-bed). Carry cash, network is shaky up there.",
    type: "trip",
    location: "Mcleodganj",
    daysFromNow: 12,
    costInr: 4500,
    maxAttendees: 14,
    // Himalayan town
    cover_image_url: u("1626621341517-bbf3d9990a23", 1200),
  },
  {
    title: "Late-night cricket turf — Phase 8",
    description:
      "Two teams. 10pm slot booked. Bring water + your worst trash talk.",
    type: "hangout",
    location: "Phase 8 Stadium",
    daysFromNow: 3,
    costInr: 200,
    maxAttendees: 16,
    // Floodlit night cricket pitch
    cover_image_url: u("1531415074968-036ba1b575da", 1200),
  },
  {
    title: "Sunrise cycling — Sukhna Lake",
    description:
      "Easy loop. 6:15am at the boat club gate. Coffee after.",
    type: "hangout",
    location: "Sukhna Lake, Chandigarh",
    daysFromNow: 1,
    costInr: 0,
    maxAttendees: 8,
    // Cyclists at golden hour
    cover_image_url: u("1517649763962-0c623066013b", 1200),
  },
  {
    title: "Spiti Valley road trip — 5 days",
    description:
      "Self-drive convoy. Kaza → Chandratal → back via Manali. Stay in homestays. Long days, big skies.",
    type: "trip",
    location: "Spiti Valley, HP",
    daysFromNow: 21,
    costInr: 12000,
    maxAttendees: 12,
    cover_image_url: u("1469474968028-56623f02e42e", 1200),
  },
  {
    title: "Rishikesh weekend — yoga + rafting",
    description:
      "Friday night bus → Sunday night back. Beach camp stay. Rafting on Sat morning, sunset aarti at Triveni.",
    type: "trip",
    location: "Rishikesh",
    daysFromNow: 9,
    costInr: 3800,
    maxAttendees: 16,
    cover_image_url: u("1532375810709-75b1da00537c", 1200),
  },
  {
    title: "Manali workcation — 4 days",
    description:
      "Co-working from Old Manali. Strong wifi house, mountain views, hikes on the weekend.",
    type: "workcation",
    location: "Old Manali",
    daysFromNow: 18,
    costInr: 7500,
    maxAttendees: 8,
    cover_image_url: u("1606117331085-5760e3b58520", 1200),
  },
  {
    title: "Standup comedy night — Laugh Club",
    description:
      "5 comics, 90 mins. Tickets ₹350 at the door. Drinks after at the rooftop next door.",
    type: "community_event",
    location: "Laugh Club Mohali, Sector 7",
    daysFromNow: 2,
    costInr: 350,
    maxAttendees: 25,
    cover_image_url: u("1527224857830-43a7acc85260", 1200),
  },
  {
    title: "Saturday brunch crawl",
    description:
      "3 cafes, one morning. Backyard → Sip & Stir → Open Door. Pay-as-you-go.",
    type: "hangout",
    location: "Sector 7 — Sector 26",
    daysFromNow: 6,
    costInr: 600,
    maxAttendees: 10,
    cover_image_url: u("1533089860892-a7c6f0a88666", 1200),
  },
  {
    title: "Board game night — Catan + Codenames",
    description:
      "BYO snacks. Light drinks provided. Games last 3-4 hours, drop in late if you want.",
    type: "hangout",
    location: "Sector 70, host's flat",
    daysFromNow: 4,
    costInr: 0,
    maxAttendees: 12,
    cover_image_url: u("1610890716171-6b1bb98ffd09", 1200),
  },
  {
    title: "Tricity Tech meetup #14",
    description:
      "Lightning talks on databases at scale. Free pizza. Bring questions, leave with friends.",
    type: "community_event",
    location: "Plaksha University, Mohali",
    daysFromNow: 11,
    costInr: 0,
    maxAttendees: 80,
    cover_image_url: u("1540575467063-178a50c2df87", 1200),
  },
  {
    title: "IPL final watch party",
    description:
      "Big projector, full setup, snacks ordered in. Doors open 7pm, match at 8.",
    type: "hangout",
    location: "Beer Cafe, Elante",
    daysFromNow: 8,
    costInr: 450,
    maxAttendees: 30,
    cover_image_url: u("1540747913346-19e32dc3e97e", 1200),
  },
  {
    title: "Goa workcation — 6 days",
    description:
      "North Goa villa, 8 desks, fast wifi, pool, scooters included. Co-cook breakfast, dinners out.",
    type: "workcation",
    location: "Assagao, Goa",
    daysFromNow: 28,
    costInr: 18000,
    maxAttendees: 10,
    cover_image_url: u("1512343879784-a960bf40e7f2", 1200),
  },
  {
    title: "Triund overnight trek",
    description:
      "Easy trek up Sat morning, camp at the top, sunrise tea, back by Sunday afternoon. Tents arranged.",
    type: "trip",
    location: "Triund, McLeodganj",
    daysFromNow: 15,
    costInr: 3200,
    maxAttendees: 14,
    cover_image_url: u("1551632811-561732d1e306", 1200),
  },
  {
    title: "Wine tasting — Sula at Hyatt",
    description:
      "5 pours + cheese board. ₹1500/head. Bring a buddy who knows the difference between merlot and shiraz.",
    type: "hangout",
    location: "Hyatt Regency, Chandigarh",
    daysFromNow: 7,
    costInr: 1500,
    maxAttendees: 12,
    cover_image_url: u("1510812431401-41d2bd2722f3", 1200),
  },
  {
    title: "Founders coffee — open invite",
    description:
      "Monthly meetup. Whoever's building something cool talks for 5 mins, then we just chat. Free coffee.",
    type: "community_event",
    location: "Cafe Lota, Sector 8",
    daysFromNow: 5,
    costInr: 0,
    maxAttendees: 20,
    cover_image_url: u("1556761175-5973dc0f32e7", 1200),
  },
  {
    title: "Pottery class — beginner friendly",
    description:
      "2 hour wheel session. Glaze later, pickup in a week. ₹800 covers everything.",
    type: "hangout",
    location: "Clay Studio, Panchkula",
    daysFromNow: 10,
    costInr: 800,
    maxAttendees: 8,
    cover_image_url: u("1565193566173-7a0ee3dbe261", 1200),
  },
];

// ── Hangouts (v2) ────────────────────────────────────────────────────────
const HANGOUTS: Array<{
  activity: string;
  description: string;
  time_window: string;
  location: string;
  max_joiners: number;
}> = [
  {
    activity: "grab coffee",
    description: "Hoping to finally try Blue Tokai. Lazy Saturday energy.",
    time_window: "Saturday afternoon",
    location: "Blue Tokai, Sector 26",
    max_joiners: 4,
  },
  {
    activity: "find a gym buddy",
    description: "Mornings at Anytime Fitness Sector 70. I'm consistent, I promise.",
    time_window: "Weekdays, 6:30am",
    location: "Anytime Fitness, Sector 70",
    max_joiners: 2,
  },
  {
    activity: "watch the IPL final",
    description: "Big screen at Beer Cafe, table booked for 6. Room for 3 more.",
    time_window: "Sunday night",
    location: "Beer Cafe, Elante",
    max_joiners: 6,
  },
  {
    activity: "study at Starbucks",
    description: "Have a deadline Monday. Need accountability humans around me.",
    time_window: "Saturday all day",
    location: "Starbucks, Sector 35",
    max_joiners: 4,
  },
  {
    activity: "do a pottery workshop",
    description: "Found a 2-hour walk-in class. ₹600 per head. It'll be fun (or chaos).",
    time_window: "This weekend",
    location: "Clay Studio, Panchkula",
    max_joiners: 5,
  },
  {
    activity: "go for a long drive",
    description: "Tricity → Morni Hills → maa-da dhaba. Petrol split. Music TBD.",
    time_window: "Sunday morning",
    location: "Pick up from Sector 17",
    max_joiners: 4,
  },
  {
    activity: "play badminton",
    description: "Court booked at Sector 38. Casual rallies, not Olympics.",
    time_window: "Friday, 7pm",
    location: "Sector 38 sports complex",
    max_joiners: 6,
  },
  {
    activity: "cafe-hop for breakfast",
    description: "3 cafes, one morning. Eggs, coffee, gossip. Be hungry.",
    time_window: "Saturday morning",
    location: "Sector 7 area",
    max_joiners: 5,
  },
  {
    activity: "run 5k together",
    description: "Easy pace, Leisure Valley loop. Coffee after at Backyard.",
    time_window: "Sunday, 6:30am",
    location: "Leisure Valley, Chandigarh",
    max_joiners: 6,
  },
  {
    activity: "catch the new Nolan film",
    description: "IMAX, Elante, evening show. Booking 6 seats together.",
    time_window: "Saturday evening",
    location: "PVR IMAX, Elante",
    max_joiners: 6,
  },
  {
    activity: "code for a Saturday",
    description: "Side-project hack day. BYO laptop + idea. We'll demo at 6pm.",
    time_window: "Saturday 10am-7pm",
    location: "Cafe Lota, Sector 8",
    max_joiners: 8,
  },
  {
    activity: "do yoga in the park",
    description: "Free morning flow. Bring a mat. 45 mins, beginner-friendly.",
    time_window: "Tomorrow, 7am",
    location: "Rose Garden, Sector 16",
    max_joiners: 10,
  },
  {
    activity: "play poker (casual)",
    description: "Small stakes (₹500 buy-in). 5-6 players. Snacks + drinks at host's.",
    time_window: "Friday night",
    location: "Sector 70, host's flat",
    max_joiners: 6,
  },
  {
    activity: "find a tennis partner",
    description: "Intermediate level. Court at PCA, twice a week.",
    time_window: "Weekday evenings",
    location: "PCA Stadium, Mohali",
    max_joiners: 2,
  },
  {
    activity: "open mic — sing or just listen",
    description: "First Thursday of the month. Sign-ups at 7, music starts 8.",
    time_window: "Thursday, 8pm",
    location: "The Willow Cafe, Sector 26",
    max_joiners: 8,
  },
  {
    activity: "grab dinner somewhere new",
    description: "Open to vibes. Voting on a poll if more than 4 join.",
    time_window: "Tonight",
    location: "Sector 17 or Elante",
    max_joiners: 6,
  },
  {
    activity: "do a photography walk",
    description: "Old Chandigarh streets at golden hour. Phone shots welcome.",
    time_window: "Sunday, 5pm",
    location: "Sector 17, Chandigarh",
    max_joiners: 8,
  },
  {
    activity: "watch the F1 race",
    description: "Big screen, breakfast, full setup. Sunday afternoon GP.",
    time_window: "Sunday afternoon",
    location: "Hop's Bar, Sector 26",
    max_joiners: 10,
  },
  {
    activity: "find a swim buddy",
    description: "Mornings at Aqua Pool, Sector 23. Doing 30 laps before work.",
    time_window: "Weekdays, 6:45am",
    location: "Aqua Pool, Sector 23",
    max_joiners: 3,
  },
];

async function ensurePersonas(): Promise<Array<{ id: string; persona: Persona }>> {
  const out: Array<{ id: string; persona: Persona }> = [];

  const { data: cities } = await supabase.from("cities").select("id, slug");
  if (!cities) throw new Error("Run migrations first — cities table is empty.");
  const citySlug = new Map(cities.map((c) => [c.slug, c.id]));

  for (const p of PERSONAS) {
    const email = `${p.username}@adda.test`;
    let userId: string | null = null;

    const created = await supabase.auth.admin.createUser({
      email,
      password: "adda-test-pass-1234",
      email_confirm: true,
    });
    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
      const found = list?.users.find((u) => u.email === email);
      if (!found) {
        console.warn(`Could not create or find ${email}: ${created.error?.message}`);
        continue;
      }
      userId = found.id;
    }
    if (!userId) continue;

    await supabase.from("profiles").upsert({
      id: userId,
      username: p.username,
      display_name: p.display_name,
      profession: p.profession,
      company: p.company,
      bio: p.bio,
      vibe_tags: p.vibes,
      avatar_url: p.avatar_url,
      current_city_id: citySlug.get(p.current_slug) ?? null,
      hometown_city_id: citySlug.get(p.hometown_slug) ?? null,
      is_onboarded: true,
    });

    // Auto-join the city community
    const { data: cityComm } = await supabase
      .from("communities")
      .select("id")
      .eq("type", "city")
      .eq("city_id", citySlug.get(p.current_slug))
      .maybeSingle();
    if (cityComm) {
      await supabase
        .from("community_members")
        .upsert({ community_id: cityComm.id, profile_id: userId });
    }

    out.push({ id: userId, persona: p });
  }

  return out;
}

async function seedFollowGraph(personas: Array<{ id: string; persona: Persona }>) {
  for (const a of personas) {
    for (const b of personas) {
      if (a.id === b.id) continue;
      if (Math.random() > 0.55) continue;
      await supabase
        .from("follows")
        .upsert({ follower_id: a.id, following_id: b.id });
    }
  }
}

/** Join each persona into 3–5 interest communities so /communities and profile pages look populated. */
async function seedCommunityMemberships(
  personas: Array<{ id: string; persona: Persona }>,
) {
  const { data: comms } = await supabase
    .from("communities")
    .select("id, slug, type")
    .eq("is_active", true);
  if (!comms) return;

  const interestComms = comms.filter((c) => c.type !== "city");

  for (const p of personas) {
    const shuffled = [...interestComms].sort(() => Math.random() - 0.5);
    const take = 3 + Math.floor(Math.random() * 3); // 3–5
    for (const c of shuffled.slice(0, take)) {
      await supabase
        .from("community_members")
        .upsert({ community_id: c.id, profile_id: p.id });
    }
  }
}

/** A handful of posts seeded inside specific interest communities, with vibe-matched copy. */
async function seedCommunityPosts(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: comms } = await client
    .from("communities")
    .select("id, slug")
    .eq("is_active", true);
  if (!comms) return;
  const bySlug = new Map(comms.map((c) => [c.slug, c.id]));

  type Item = { slug: string; author: string; content: string };
  const ITEMS: Item[] = [
    {
      slug: "cafe-hoppers-tricity",
      author: "ananya",
      content:
        "Tried the new oat-milk latte at Sip & Stir today — 9/10. Their corner couch is the work-from-cafe dream.",
    },
    {
      slug: "cafe-hoppers-tricity",
      author: "priya",
      content:
        "Anyone been to that quiet bookstore-cafe in Sector 26? Looking for a calm Sunday read spot.",
    },
    {
      slug: "tricity-tech",
      author: "kabir",
      content:
        "Hot take: postgres > everything for the first 2 years of any startup. Fight me in the comments.",
    },
    {
      slug: "tricity-tech",
      author: "riya",
      content:
        "Anyone hiring for a junior frontend role? Have a friend from college looking — solid React + Tailwind, 1.5 yrs.",
    },
    {
      slug: "weekend-trekkers-tricity",
      author: "sneha",
      content:
        "Triund this weekend if 4 people commit. Bus from Mohali Friday night, back Sunday eve. ₹2.5k all-in.",
    },
    {
      slug: "burnout-club",
      author: "dev",
      content:
        "Took a real Saturday off. No laptop. No 'just checking slack'. Felt illegal at first.",
    },
    {
      slug: "burnout-club",
      author: "arjun",
      content:
        "Therapist said I'm not lazy, I'm tired. Big breakthrough TBH.",
    },
    {
      slug: "friday-night-plans",
      author: "rahul",
      content:
        "Friday plan: standup at Laugh Club + late dinner. Group of 4 going, room for 2.",
    },
  ];

  const byUser = new Map(personas.map((p) => [p.persona.username, p.id]));
  for (const item of ITEMS) {
    const commId = bySlug.get(item.slug);
    const authorId = byUser.get(item.author);
    if (!commId || !authorId) continue;
    const { data: post } = await client
      .from("posts")
      .insert({
        author_id: authorId,
        content: item.content,
        type: "text",
        community_id: commId,
      })
      .select("id")
      .single();
    if (!post) continue;

    // 1–3 reactions
    const reactors = personas
      .filter((p) => p.id !== authorId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 1 + Math.floor(Math.random() * 3));
    for (const r of reactors) {
      await client
        .from("reactions")
        .upsert({
          post_id: post.id,
          profile_id: r.id,
          type: REACTIONS[Math.floor(Math.random() * REACTIONS.length)],
        });
    }
  }
}

/** A couple of polls with realistic vote distributions. */
async function seedPolls(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: cityComm } = await client
    .from("communities")
    .select("id")
    .eq("slug", "mohali-professionals")
    .maybeSingle();

  const POLLS: Array<{
    author: string;
    content: string;
    options: string[];
    distribution: number[]; // weights summing roughly to # of voters
  }> = [
    {
      author: "arjun",
      content: "Best parathas in Mohali for a 2am craving?",
      options: ["Amrik Sukhdev", "Sharma Dhaba", "Kulcha Land"],
      distribution: [2, 4, 1],
    },
    {
      author: "priya",
      content: "Sunday vibe?",
      options: ["Cafe + book", "Long drive", "Stay in pajamas"],
      distribution: [3, 2, 3],
    },
  ];

  const byUser = new Map(personas.map((p) => [p.persona.username, p.id]));

  for (const poll of POLLS) {
    const authorId = byUser.get(poll.author);
    if (!authorId) continue;
    const { data: post } = await client
      .from("posts")
      .insert({
        author_id: authorId,
        content: poll.content,
        type: "poll",
        poll_options: poll.options.map((label, i) => ({ index: i, label })),
        community_id: cityComm?.id ?? null,
      })
      .select("id")
      .single();
    if (!post) continue;

    // Distribute votes
    const voters = personas
      .filter((p) => p.id !== authorId)
      .sort(() => Math.random() - 0.5);
    let voterIdx = 0;
    for (let optIdx = 0; optIdx < poll.distribution.length; optIdx++) {
      for (let k = 0; k < poll.distribution[optIdx]; k++) {
        const v = voters[voterIdx++];
        if (!v) break;
        await client.from("poll_votes").upsert({
          post_id: post.id,
          profile_id: v.id,
          option_index: optIdx,
        });
      }
    }
  }
}

/** A couple of image posts so the visual side of the feed isn't all text. */
async function seedImagePosts(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: cityComm } = await client
    .from("communities")
    .select("id")
    .eq("slug", "mohali-professionals")
    .maybeSingle();

  const ITEMS: Array<{ author: string; content: string; image: string }> = [
    {
      author: "sneha",
      content:
        "Caught this sunrise on the Kasauli ridge. Worth every 5am alarm.",
      image: u("1464822759023-fed622ff2c3b", 1200),
    },
    {
      author: "ananya",
      content:
        "Friday spread at home. Pav bhaji, friends, and absolutely no laptop in sight.",
      image: u("1565958011703-44f9829ba187", 1200),
    },
    {
      author: "dev",
      content:
        "Today's office. The chai is endless and the wifi is shockingly good.",
      image: u("1521017432531-fbd92d768814", 1200),
    },
  ];

  const byUser = new Map(personas.map((p) => [p.persona.username, p.id]));

  for (const item of ITEMS) {
    const authorId = byUser.get(item.author);
    if (!authorId) continue;
    const { data: post } = await client
      .from("posts")
      .insert({
        author_id: authorId,
        content: item.content,
        type: "image",
        image_url: item.image,
        community_id: cityComm?.id ?? null,
      })
      .select("id")
      .single();
    if (!post) continue;

    const reactors = personas
      .filter((p) => p.id !== authorId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));
    for (const r of reactors) {
      await client.from("reactions").upsert({
        post_id: post.id,
        profile_id: r.id,
        type: REACTIONS[Math.floor(Math.random() * REACTIONS.length)],
      });
    }
  }
}

/** Threaded comment conversations on top posts. */
async function seedCommentThreads(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: recent } = await client
    .from("posts")
    .select("id, author_id")
    .eq("is_deleted", false)
    .eq("type", "text")
    .order("created_at", { ascending: false })
    .limit(4);
  if (!recent) return;

  const SCRIPTS: string[][] = [
    [
      "okay this is too real lol",
      "every. single. monday.",
      "the buffering metaphor is killing me",
    ],
    [
      "Filter coffee tier list:\n1. Sip & Stir\n2. Blue Tokai\n3. Backyard",
      "controversial take but Backyard's roast hits different",
      "Sip & Stir gang for life",
    ],
    [
      "DM me, I'm in",
      "Same. What time roughly?",
      "Around 6 if everyone's okay with that",
    ],
  ];

  for (let i = 0; i < Math.min(recent.length, SCRIPTS.length); i++) {
    const post = recent[i];
    const lines = SCRIPTS[i];
    const speakers = personas
      .filter((p) => p.id !== post.author_id)
      .sort(() => Math.random() - 0.5);
    for (let l = 0; l < lines.length; l++) {
      const s = speakers[l % speakers.length];
      await client.from("comments").insert({
        post_id: post.id,
        author_id: s.id,
        content: lines[l],
      });
    }
  }
}

/** A few realistic DM threads so /chat isn't only event/hangout groups. */
async function seedDMs(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const byUser = new Map(personas.map((p) => [p.persona.username, p]));

  const THREADS: Array<{ a: string; b: string; messages: string[] }> = [
    {
      a: "riya",
      b: "sneha",
      messages: [
        "Hey! Saw you in the Trekkers community — you live in Mohali too?",
        "Yeah, been here a year now! You doing the Triund trip?",
        "Trying to! Are you organizing or joining?",
        "Joining. Cheaper than therapy 😅",
        "lol perfect — let's car-pool from sector 70?",
      ],
    },
    {
      a: "arjun",
      b: "dev",
      messages: [
        "Bro that anonymous post about the 6pm 'quick sync' is wild",
        "ahaha that wasn't even me but I felt it in my bones",
        "what're you up to this Friday?",
        "Beer Cafe at 8? Rahul's coming too",
        "I'm in",
      ],
    },
    {
      a: "ananya",
      b: "priya",
      messages: [
        "Heyy! Loved your cafe rec for Sip & Stir 🙏",
        "Right?? Their oat latte is dangerous",
        "Want to do a co-working day there this week?",
        "YES. Tuesday?",
      ],
    },
  ];

  for (const t of THREADS) {
    const a = byUser.get(t.a);
    const b = byUser.get(t.b);
    if (!a || !b) continue;

    // Look for an existing DM between these two
    const { data: mine } = await client
      .from("conversation_participants")
      .select("conversation_id, conversation:conversation_id(type)")
      .eq("profile_id", a.id);
    const myDmIds = ((mine ?? []) as unknown as {
      conversation_id: string;
      conversation: { type: string } | null;
    }[])
      .filter((r) => r.conversation?.type === "dm")
      .map((r) => r.conversation_id);

    let convId: string | null = null;
    if (myDmIds.length > 0) {
      const { data: theirs } = await client
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", b.id)
        .in("conversation_id", myDmIds);
      convId = (theirs ?? [])[0]?.conversation_id ?? null;
    }

    if (!convId) {
      const { data: conv } = await client
        .from("conversations")
        .insert({ type: "dm" })
        .select("id")
        .single();
      if (!conv) continue;
      convId = conv.id;
      await client
        .from("conversation_participants")
        .insert({ conversation_id: convId, profile_id: a.id });
      await client
        .from("conversation_participants")
        .insert({ conversation_id: convId, profile_id: b.id });
    } else {
      // Already seeded earlier — skip
      continue;
    }

    // Send messages with alternating sender + small staggered timestamps so the order is stable
    const base = Date.now() - 1000 * 60 * 60; // 1h ago
    for (let i = 0; i < t.messages.length; i++) {
      const sender = i % 2 === 0 ? a : b;
      await client.from("messages").insert({
        conversation_id: convId,
        sender_id: sender.id,
        content: t.messages[i],
        created_at: new Date(base + i * 60 * 1000).toISOString(),
      });
    }
  }
}

/** Pre-seed a few historical daily matches for one persona so /match has visible history. */
async function seedMatchHistory(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const me = personas.find((p) => p.persona.username === "riya");
  if (!me) return;
  const others = personas.filter((p) => p.id !== me.id);

  const today = new Date();
  const items: Array<{
    daysAgo: number;
    other: (typeof personas)[number];
    reason: string;
    action: "skipped" | "said_hi";
  }> = [
    {
      daysAgo: 1,
      other: others[0],
      reason: "Also into cafe hopping",
      action: "said_hi",
    },
    {
      daysAgo: 2,
      other: others[1],
      reason: "Also a frontend dev",
      action: "skipped",
    },
    {
      daysAgo: 4,
      other: others[2],
      reason: "Also from Mohali",
      action: "said_hi",
    },
  ];

  for (const item of items) {
    const d = new Date(today.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    await client.from("daily_matches").upsert(
      {
        user_id: me.id,
        matched_user_id: item.other.id,
        match_date: dateStr,
        match_reason: item.reason,
        match_score: 0.45,
        action: item.action,
      },
      { onConflict: "user_id,match_date" },
    );
    await client.from("match_history").upsert(
      {
        user_id: me.id,
        matched_user_id: item.other.id,
        last_matched_at: d.toISOString(),
      },
      { onConflict: "user_id,matched_user_id" },
    );
  }
}

async function seedPosts(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: cityComm } = await client
    .from("communities")
    .select("id")
    .eq("slug", "mohali-professionals")
    .maybeSingle();

  // Regular posts
  for (let i = 0; i < POSTS.length; i++) {
    const author = personas[i % personas.length];
    const { data: post } = await client
      .from("posts")
      .insert({
        author_id: author.id,
        content: POSTS[i],
        type: "text",
        community_id: cityComm?.id ?? null,
      })
      .select("id")
      .single();
    if (!post) continue;

    const reactors = personas
      .filter((p) => p.id !== author.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 1);
    for (const r of reactors) {
      const type = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      await client
        .from("reactions")
        .upsert({ post_id: post.id, profile_id: r.id, type });
    }

    const numComments = Math.floor(Math.random() * 3);
    for (let c = 0; c < numComments; c++) {
      const commenter = personas[Math.floor(Math.random() * personas.length)];
      await client.from("comments").insert({
        post_id: post.id,
        author_id: commenter.id,
        content: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
      });
    }
  }

  // Anonymous gossip posts
  for (let i = 0; i < ANON_POSTS.length; i++) {
    const author = personas[(i + 2) % personas.length];
    const { data: post } = await client
      .from("posts")
      .insert({
        author_id: author.id,
        content: ANON_POSTS[i],
        type: "text",
        is_anonymous: true,
        community_id: cityComm?.id ?? null,
      })
      .select("id")
      .single();
    if (!post) continue;

    // Anonymous posts get MORE reactions (to bubble up in "Office gossip today")
    const reactors = personas
      .filter((p) => p.id !== author.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 3);
    for (const r of reactors) {
      const type = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      await client
        .from("reactions")
        .upsert({ post_id: post.id, profile_id: r.id, type });
    }
  }
}

async function seedEvents(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: cities } = await client.from("cities").select("id, slug");
  const mohaliId = cities?.find((c) => c.slug === "mohali")?.id;
  if (!mohaliId) return;

  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const organizer = personas[i % personas.length];
    const starts = new Date(Date.now() + e.daysFromNow * 24 * 60 * 60 * 1000);
    starts.setHours(9, 0, 0, 0);

    const { data: ev } = await client
      .from("events")
      .insert({
        organizer_id: organizer.id,
        city_id: mohaliId,
        title: e.title,
        description: e.description,
        type: e.type,
        location: e.location,
        starts_at: starts.toISOString(),
        max_attendees: e.maxAttendees,
        cost_per_person_inr: e.costInr,
        cover_image_url: e.cover_image_url,
      })
      .select("id")
      .single();
    if (!ev) continue;

    const goers = personas
      .filter((p) => p.id !== organizer.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(personas.length - 1, Math.floor(Math.random() * 4) + 2));
    for (const g of goers) {
      await client
        .from("event_rsvps")
        .upsert({ event_id: ev.id, profile_id: g.id, status: "going" });
    }
  }
}

async function seedHangouts(
  personas: Array<{ id: string; persona: Persona }>,
  client: SupabaseClient,
) {
  const { data: cities } = await client.from("cities").select("id, slug");
  const mohaliId = cities?.find((c) => c.slug === "mohali")?.id;
  if (!mohaliId) return;

  for (let i = 0; i < HANGOUTS.length; i++) {
    const h = HANGOUTS[i];
    const host = personas[i % personas.length];

    const { data: hangout } = await client
      .from("hangouts")
      .insert({
        host_id: host.id,
        city_id: mohaliId,
        activity: h.activity,
        description: h.description,
        time_window: h.time_window,
        location: h.location,
        max_joiners: h.max_joiners,
        visibility: "city",
      })
      .select("id")
      .single();
    if (!hangout) continue;

    // A couple of randos join (excluding the host)
    const joiners = personas
      .filter((p) => p.id !== host.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(h.max_joiners - 1, Math.floor(Math.random() * 3)));
    for (const j of joiners) {
      await client
        .from("hangout_joiners")
        .upsert({ hangout_id: hangout.id, profile_id: j.id, status: "going" });
    }
  }
}

async function main() {
  console.log("→ ensuring fake personas (with HQ avatars)…");
  const personas = await ensurePersonas();
  console.log(`  ✓ ${personas.length} personas`);

  console.log("→ seeding follow graph…");
  await seedFollowGraph(personas);

  console.log("→ joining personas into interest communities…");
  await seedCommunityMemberships(personas);

  console.log("→ seeding posts (regular + anonymous gossip)…");
  await seedPosts(personas, supabase);

  console.log("→ seeding posts inside interest communities…");
  await seedCommunityPosts(personas, supabase);

  console.log("→ seeding poll posts…");
  await seedPolls(personas, supabase);

  console.log("→ seeding image posts…");
  await seedImagePosts(personas, supabase);

  console.log("→ seeding comment threads on top posts…");
  await seedCommentThreads(personas, supabase);

  console.log("→ seeding events (with cover images)…");
  await seedEvents(personas, supabase);

  console.log("→ seeding hangouts…");
  await seedHangouts(personas, supabase);

  console.log("→ seeding DM threads…");
  await seedDMs(personas, supabase);

  console.log("→ seeding daily-match history (for riya)…");
  await seedMatchHistory(personas, supabase);

  console.log("\nDone. Fake users use password: adda-test-pass-1234");
  console.log("Emails:");
  for (const p of PERSONAS) console.log(`  - ${p.username}@adda.test`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
