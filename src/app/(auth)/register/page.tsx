"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kayıt sırasında bir sorun oluştu.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { redirect: false, email: form.email, password: form.password });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4 py-10">
      <div className="w-full max-w-sm bg-white border border-stone-300 rounded-lg p-8">
        <div className="flex items-center gap-2 text-emerald-800 mb-6 justify-center">
          <Wallet className="w-5 h-5" />
          <span className="font-display font-semibold text-lg text-stone-900">Nakit Akışı Defteri</span>
        </div>

        <h1 className="text-xl font-semibold text-stone-900 mb-1">Hesap Oluştur</h1>
        <p className="text-sm text-stone-500 mb-6">Şirketiniz için yeni bir çalışma alanı oluşturun.</p>

        {error && <div className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Ad Soyad</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Şirket / Organizasyon Adı</label>
            <input
              type="text" required value={form.organizationName}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              placeholder="ör. Filementor Studio"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">E-posta</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Şifre</label>
            <input
              type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Hesap Oluştur
          </button>
        </form>

        <p className="text-xs text-stone-500 mt-5 text-center">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-emerald-800 font-medium hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
