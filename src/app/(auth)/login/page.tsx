import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link href="/">
          <Logo className="text-xl" />
        </Link>
      </header>
      <main className="flex-1 grid place-items-start md:place-items-center px-6 pb-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Hey, you&apos;re back
          </h1>
          <p className="mt-2 text-ink-secondary">
            Log in and see what your people are up to.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-ink-secondary">
            New here?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary-600 hover:underline"
            >
              Make an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
