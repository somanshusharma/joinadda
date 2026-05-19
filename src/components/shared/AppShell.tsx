import { TopBar } from "./TopBar";
import { MobileTopBar } from "./MobileTopBar";
import { BottomNav } from "./BottomNav";
import { FloatingComposer } from "./FloatingComposer";
import { SideNav } from "./SideNav";

export type ShellUser = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  unreadNotifications: number;
  streakCount: number;
} | null;

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopBar user={user} />
      <MobileTopBar user={user} />
      <div className="flex-1 mx-auto w-full max-w-7xl flex gap-6 px-4 md:px-6">
        <SideNav user={user} />
        <main className="flex-1 min-w-0 pb-24 pt-4 md:pt-6">{children}</main>
      </div>
      {user ? <FloatingComposer /> : null}
      <BottomNav />
    </div>
  );
}
