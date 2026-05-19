"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { redeemInviteCode } from "@/app/actions/invite";

export function SignupForm() {
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    const redeem = await redeemInviteCode(values.invite_code);
    if (!redeem.ok) {
      setServerError(
        `${redeem.error}. You can still sign in once a code is verified.`,
      );
      return;
    }
    // Hard navigation so the server picks up the new auth cookie.
    window.location.assign("/onboarding");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Invite code" error={errors.invite_code?.message}>
        <Input
          placeholder="ADDA-MOHALI-01"
          autoComplete="off"
          {...register("invite_code")}
        />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@email.com" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
      </Field>
      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Make my account
      </Button>
      <p className="text-xs text-ink-muted text-center">
        Invite-only for now — ask a friend for a code, or join the waitlist.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
