"use client";

import { logoutAction, getCurrentUserAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { ThemeToggleSimple } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  LogOut, UserCircle, LayoutDashboard, Building2,
  CreditCard, BarChart3, Settings, Shield, X, MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { href: "/", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/tenants", label: "nav.tenants", icon: Building2 },
  { href: "/subscriptions", label: "nav.subscriptions", icon: CreditCard },
  { href: "/analytics", label: "nav.analytics", icon: BarChart3 },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUserAction().then((r) => {
      if (r.success && r.data) setUserInfo(r.data);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex fixed inset-0 overflow-hidden bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white">
      {/* Desktop Sidebar — dark navy brand */}
      <aside className="w-64 flex-shrink-0 hidden md:flex flex-col" style={{ background: "var(--sidebar-bg)" }}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-nexpo-500/20 flex items-center justify-center">
              <Shield size={20} className="text-nexpo-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">{t("nav.console")}</div>
              <div className="text-[10px] text-surface-400 font-medium">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm",
                  active
                    ? "bg-white/10 text-white"
                    : "text-surface-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} className={active ? "text-nexpo-400" : ""} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-white/10 mt-auto">
          <p className="text-[10px] text-surface-500">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-40 h-14 items-center justify-end gap-2 px-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
          <LanguageSwitcher />
          <ThemeToggleSimple />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-nexpo-500 flex items-center justify-center text-white text-xs font-bold select-none">
                {userInfo?.initials ?? "?"}
              </div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 max-w-[120px] truncate">
                {userInfo?.name ?? ""}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{userInfo?.name}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 truncate mt-0.5">{userInfo?.email}</p>
                </div>
                <div className="p-1.5">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} />
                      {t("common.logout")}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400"
            >
              <div className="flex flex-col gap-1 items-start">
                <div className="w-5 h-0.5 bg-current rounded-full" />
                <div className="w-3 h-0.5 bg-current rounded-full" />
                <div className="w-4 h-0.5 bg-current rounded-full" />
              </div>
            </button>
            <Shield size={22} className="text-nexpo-500" />
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggleSimple />
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-80 max-w-[85%] h-full flex flex-col shadow-2xl" style={{ background: "var(--sidebar-bg)" }}>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-nexpo-400" />
                  <span className="text-white font-bold text-sm">{t("nav.console")}</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-surface-400">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        active ? "bg-white/10 text-white" : "text-surface-400"
                      )}
                    >
                      <item.icon size={18} />
                      {t(item.label)}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-white/10">
                <form action={logoutAction}>
                  <Button variant="ghost" className="w-full justify-start text-surface-400 font-bold gap-3 h-12 rounded-xl hover:bg-red-500/10 hover:text-red-400">
                    <LogOut size={18} />
                    {t("common.logout")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-2xl border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-around px-1 pt-2 pb-7">
            {NAV_ITEMS.slice(0, 4).map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 flex-1 py-1 min-w-0">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    active ? "bg-nexpo-500 text-white shadow-sm shadow-nexpo-500/30" : "text-surface-400 dark:text-surface-500"
                  )}>
                    <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    active ? "text-nexpo-500" : "text-surface-400 dark:text-surface-500"
                  )}>{t(item.label)}</span>
                </Link>
              );
            })}
            <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center gap-1 flex-1 py-1 min-w-0">
              <div className="p-2 rounded-xl text-surface-400 dark:text-surface-500">
                <MoreHorizontal size={20} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">{t("common.more")}</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
