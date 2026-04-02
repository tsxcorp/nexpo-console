"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tag, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { getCoupons, deleteCoupon } from "@/actions/coupon-actions";
import { CouponFormModal } from "@/components/settings/coupon-form-modal";
import type { CouponCode } from "@/types/subscription";
import { cn } from "@/lib/utils";

export default function CouponsPage() {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCoupons({ page, limit: 20, search: search || undefined });
    setCoupons(result.data);
    setTotal(result.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm(t("billing.confirm_delete_coupon"))) return;
    const result = await deleteCoupon(id);
    if (result.success) {
      toast.success(t("billing.coupon_deleted"));
      load();
    } else {
      toast.error(result.error ?? t("common.error"));
    }
  };

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: CouponCode) => { setEditTarget(c); setModalOpen(true); };

  const handleSaved = () => { setModalOpen(false); load(); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <Tag size={18} className="text-nexpo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("billing.coupon_management")}</h2>
            <p className="text-sm text-surface-500">{t("billing.coupon_management_desc")}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-nexpo-500 hover:bg-nexpo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          {t("billing.create_coupon")}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("common.search")}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-nexpo-500" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-surface-400 text-sm">{t("common.no_data")}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                {[t("billing.coupon_code"), t("billing.discount_type"), t("billing.discount_value"), t("billing.valid_until"), t("billing.uses"), t("billing.status"), t("common.actions")].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-surface-100 dark:border-surface-700/50">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{c.code}</td>
                  <td className="px-4 py-3 text-sm capitalize">{c.discount_type}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-500">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-500">
                    {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      c.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400"
                    )}>
                      {c.is_active ? t("billing.active") : t("billing.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors text-surface-400 hover:text-surface-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm text-surface-500">
          <span>{t("common.showing", { from: (page - 1) * 20 + 1, to: Math.min(page * 20, total), total })}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 border border-surface-200 dark:border-surface-600 rounded-lg disabled:opacity-40 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              {t("common.previous")}
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 border border-surface-200 dark:border-surface-600 rounded-lg disabled:opacity-40 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <CouponFormModal
          coupon={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
