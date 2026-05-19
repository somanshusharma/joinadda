export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const AVATAR_BG = [
  "bg-primary-200 text-primary-900",
  "bg-accent-100 text-amber-900",
  "bg-emerald-100 text-emerald-900",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-900",
  "bg-violet-100 text-violet-900",
  "bg-orange-100 text-orange-900",
  "bg-teal-100 text-teal-900",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function suggestUsername(email: string): string {
  return email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) ?? "";
}
