import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
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
            Hey! Let&apos;s set you up.
          </h1>
          <p className="mt-2 text-ink-secondary">
            Takes 2 minutes. No corporate stuff, promise.
          </p>
          <div className="mt-8">
            <SignupForm />
          </div>
          <p className="mt-6 text-sm text-ink-secondary">
            Already on Adda?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-600 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
