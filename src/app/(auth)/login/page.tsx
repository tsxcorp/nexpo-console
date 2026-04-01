"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { ThemeToggleSimple } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Mail, Lock, AlertCircle, ArrowRight, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [state, formAction, isPending] = useActionState(loginAction, null as unknown);

  const errorKey = (state as { error?: string })?.error
    || (urlError === "unauthorized" ? "error_unauthorized" : null);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      {/* Top controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggleSimple />
      </div>

      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-nexpo-500/5 dark:bg-nexpo-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-nexpo-500/10 dark:bg-nexpo-500/20 flex items-center justify-center border border-nexpo-200 dark:border-nexpo-500/30">
            <Shield size={32} className="text-nexpo-500" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("auth.sign_in_title")}
        </h2>
        <p className="mt-2 text-center text-sm text-surface-500 dark:text-surface-400">
          {t("auth.sign_in_subtitle")}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px] relative z-10">
        <div className="bg-white dark:bg-surface-800/70 backdrop-blur-md border border-surface-200 dark:border-surface-700 px-6 py-10 shadow-xl rounded-2xl w-full">
          <form action={formAction as unknown as string} className="space-y-6">
            {errorKey && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-500 text-sm">
                <AlertCircle className="shrink-0" size={18} />
                <p>{t(`auth.${errorKey}`)}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-surface-700 dark:text-surface-300">
                {t("auth.email")}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-surface-400 dark:text-surface-500" size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t("auth.email_placeholder")}
                  className="block w-full rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700/50 py-2.5 pl-10 pr-3 text-surface-900 dark:text-white shadow-sm sm:text-sm placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-surface-700 dark:text-surface-300">
                {t("auth.password")}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-surface-400 dark:text-surface-500" size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder={t("auth.password_placeholder")}
                  className="block w-full rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700/50 py-2.5 pl-10 pr-3 text-surface-900 dark:text-white shadow-sm sm:text-sm placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all outline-none"
                />
              </div>
            </div>

            <Button type="submit" className="w-full flex items-center justify-center gap-2 group" disabled={isPending}>
              {isPending ? t("auth.signing_in") : t("auth.sign_in")}
              {!isPending && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 dark:bg-surface-900" />}>
      <LoginForm />
    </Suspense>
  );
}
