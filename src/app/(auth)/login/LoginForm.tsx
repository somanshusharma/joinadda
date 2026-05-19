"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(error.message);
      return;
    }
    // Hard navigation so the server reads the freshly-set Supabase cookie.
    const nextParam = searchParams.get("next");
    const next =
      nextParam && nextParam.startsWith("/") ? nextParam : "/";
    window.location.assign(next);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@email.com" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
        />
      </Field>
      {serverError ? (
        <p className="text-sm text-danger">{serverError}</p>
      ) : null}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Log in
      </Button>
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
