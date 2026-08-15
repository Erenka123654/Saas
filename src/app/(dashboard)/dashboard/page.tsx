"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Loader2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

type Category = { id: string; name: string; type: "GELIR" | "GIDER" };
type Transaction = {
  id: string;
  type: "GELIR" | "GIDER";
  amount: number;
  description: string;
  date: string;
  category: string;
  categoryId: string;
  createdBy: string;
};

function formatTRY(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);
}
function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [form, setForm] = useState({ date: todayStr(), description: "", type: "GELIR" as "GELIR" | "GIDER", categoryId: "", amount: "" });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"hepsi" | "GELIR" | "GIDER">("hepsi");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setTransactions(data.transactions ?? []);
    setOrgName(data.organization?.name ?? "");
    const firstCat = (data.categories ?? []).find((c: Category) => c.type === "GELIR");
    if (firstCat) setForm((f) => ({ ...f, categoryId: firstCat.id }));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleTypeChange(type: "GELIR" | "GIDER") {
    const firstCat = categories.find((c) => c.type === type);
    setForm((f) => ({ ...f, type, categoryId: firstCat?.id ?? "" }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(form.amount.replace(",", "."));
    if (!form.description.trim() || !amt || amt <= 0 || !form.categoryId) {
      setError("Lütfen açıklama, kategori ve geçerli bir tutar girin.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: amt }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "İşlem eklenirken bir sorun oluştu.");
      return;
    }
    setForm((f) => ({ ...f, description: "", amount: "" }));
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    [transactions]
  );
  const withBalance = useMemo(() => {
    let bal = 0;
    return sorted.map((t) => {
      bal += t.type === "GELIR" ? t.amount : -t.amount;
      return { ...t, balance: bal };
    });
  }, [sorted]);

  const totals = useMemo(() => {
    const gelir = transactions.filter((t) => t.type === "GELIR").reduce((s, t) => s + t.amount, 0);
    const gider = transactions.filter((t) => t.type === "GIDER").reduce((s, t) => s + t.amount, 0);
    return { gelir, gider, net: gelir - gider };
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, { type: string; category: string; amount: number }> = {};
    transactions.forEach((t) => {
      const key = `${t.type}:${t.category}`;
      if (!map[key]) map[key] = { type: t.type, category: t.category, amount: 0 };
      map[key].amount += t.amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [transactions]);
  const maxCategoryAmount = Math.max(1, ...categoryTotals.map((c) => c.amount));

  const displayRows = useMemo(() => {
    let rows = [...withBalance].reverse();
    if (filterType !== "hepsi") rows = rows.filter((t) => t.type === filterType);
    if (search.trim()) {
      const q = search.trim().toLocaleLowerCase("tr-TR");
      rows = rows.filter(
        (t) => t.description.toLocaleLowerCase("tr-TR").includes(q) || t.category.toLocaleLowerCase("tr-TR").includes(q)
      );
    }
    return rows;
  }, [withBalance, filterType, search]);

  const currentBalance = withBalance.length ? withBalance[withBalance.length - 1].balance : 0;
  const isPositive = currentBalance >= 0;
  const categoryOptions = categories.filter((c) => c.type === form.type);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Defter açılıyor…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="hidden sm:block absolute -left-5 top-6 bottom-6 w-4"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 8px 16px, #78716c 0px, #78716c 3px, transparent 4px, transparent 32px)",
          opacity: 0.35,
        }}
      />

      <header className="mb-6 border-b-2 border-stone-800 pb-4 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 mb-1">
            <Wallet className="w-5 h-5" />
            <span className="text-xs tracking-[0.2em] uppercase font-semibold">{orgName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900">Nakit Akışı Defteri</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/excel"
            className="flex items-center gap-1.5 text-xs border border-stone-300 hover:border-emerald-700 hover:text-emerald-800 rounded px-3 py-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </a>
          <a
            href="/api/export/pdf"
            className="flex items-center gap-1.5 text-xs border border-stone-300 hover:border-emerald-700 hover:text-emerald-800 rounded px-3 py-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </a>
        </div>
      </header>

      {error && <div className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      <div className="relative bg-white border border-stone-300 rounded-lg p-6 sm:p-8 mb-6 overflow-hidden">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">Güncel Bakiye</div>
            <div className={`font-mono text-4xl sm:text-5xl font-semibold ${isPositive ? "text-emerald-800" : "text-red-800"}`}>
              {formatTRY(currentBalance)}
            </div>
            <div className="text-xs text-stone-400 mt-2">{transactions.length} işlem kayıtlı</div>
          </div>
          {transactions.length > 0 && (
            <div
              className={`select-none border-4 border-double rounded-full w-28 h-28 flex items-center justify-center text-center px-2 ${
                isPositive ? "border-emerald-700 text-emerald-700" : "border-red-800 text-red-800"
              }`}
              style={{ transform: "rotate(-9deg)", opacity: 0.75, mixBlendMode: "multiply" }}
            >
              <span className="text-[11px] font-display font-bold uppercase tracking-wider leading-tight">
                {isPositive ? "Bakiye Pozitif" : "Bakiye Negatif"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-dashed border-stone-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-stone-500">Toplam Gelir</div>
              <div className="font-mono text-lg font-semibold text-emerald-800">{formatTRY(totals.gelir)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-800">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-stone-500">Toplam Gider</div>
              <div className="font-mono text-lg font-semibold text-red-800">{formatTRY(totals.gider)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-800">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-stone-500">Net Nakit Akışı</div>
              <div className={`font-mono text-lg font-semibold ${totals.net >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                {formatTRY(totals.net)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white border border-stone-300 rounded-lg p-5 h-fit">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wide text-stone-700 mb-4">Yeni İşlem Ekle</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("GELIR")}
                className={`flex-1 text-sm py-2 rounded border transition-colors ${
                  form.type === "GELIR" ? "bg-emerald-800 text-white border-emerald-800" : "border-stone-300 text-stone-600"
                }`}
              >
                Gelir
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("GIDER")}
                className={`flex-1 text-sm py-2 rounded border transition-colors ${
                  form.type === "GIDER" ? "bg-red-800 text-white border-red-800" : "border-stone-300 text-stone-600"
                }`}
              >
                Gider
              </button>
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Tarih</label>
              <input
                type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Açıklama</label>
              <input
                type="text" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="ör. Müşteri ödemesi, kira ödemesi…"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Kategori</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Tutar (₺)</label>
              <input
                type="text" inputMode="decimal" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <button
              type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Kaydı Ekle
            </button>
          </form>

          {categoryTotals.length > 0 && (
            <div className="mt-6 pt-5 border-t border-dashed border-stone-300">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">Kategori Dağılımı</h3>
              <div className="space-y-2.5">
                {categoryTotals.map((c) => (
                  <div key={`${c.type}:${c.category}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-600">{c.category}</span>
                      <span className="font-mono text-stone-500">{formatTRY(c.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.type === "GELIR" ? "bg-emerald-700" : "bg-red-800"}`}
                        style={{ width: `${(c.amount / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white border border-stone-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara…"
                className="w-full border border-stone-300 rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-stone-300 rounded px-2.5 py-1.5 text-sm bg-white"
            >
              <option value="hepsi">Hepsi</option>
              <option value="GELIR">Yalnızca Gelir</option>
              <option value="GIDER">Yalnızca Gider</option>
            </select>
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto relative">
            <div className="absolute left-14 top-0 bottom-0 w-px bg-red-200 pointer-events-none" />
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 border-b border-stone-300 text-stone-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Tarih</th>
                  <th className="text-left px-4 py-2.5 font-medium">Açıklama</th>
                  <th className="text-left px-4 py-2.5 font-medium">Kategori</th>
                  <th className="text-right px-4 py-2.5 font-medium">Tutar</th>
                  <th className="text-right px-4 py-2.5 font-medium">Bakiye</th>
                  <th className="px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-stone-400 text-sm">
                      {transactions.length === 0 ? "Henüz kayıt yok. Soldaki formdan ilk işlemi ekleyin." : "Aramanızla eşleşen kayıt bulunamadı."}
                    </td>
                  </tr>
                )}
                {displayRows.map((t, i) => (
                  <tr key={t.id} className={`border-b border-stone-100 ${i % 2 === 0 ? "bg-emerald-50/40" : "bg-white"} group`}>
                    <td className="px-4 py-2.5 font-mono text-stone-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-2.5 text-stone-800">
                      {t.description}
                      <div className="text-[10px] text-stone-400">{t.createdBy}</div>
                    </td>
                    <td className="px-4 py-2.5 text-stone-500 text-xs">{t.category}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-medium whitespace-nowrap ${t.type === "GELIR" ? "text-emerald-800" : "text-red-800"}`}>
                      {t.type === "GELIR" ? "+" : "−"}{formatTRY(t.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-stone-700 whitespace-nowrap">{formatTRY(t.balance)}</td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-800 transition-opacity"
                        aria-label="Kaydı sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
