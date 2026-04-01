"use client";

import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
          <Settings size={20} className="text-nexpo-500" />
        </div>
        <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
      </div>
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8 text-center text-surface-500 dark:text-surface-400">
        Platform settings — coming soon
      </div>
    </div>
  );
}
