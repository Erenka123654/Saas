"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm bg-white border border-stone-300 rounded-lg p-8">
        <div className="flex items-center gap-2 text-emerald-800 mb-6 justify-center">
          <Wallet className="w-5 h-5" />
          <span className="font-display font-semibold text-lg text-stone-900">Nakit Akışı Defteri</span>
        </div>

        <h1 className="text-xl font-semibold text-stone-900 mb-1">Giriş Yap</h1>
        <p className="text-sm text-stone-500 mb-6">Hesabınıza giriş yaparak devam edin.</p>

        {error && <div className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Şifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Giriş Yap
          </button>
        </form>

        <p className="text-xs text-stone-500 mt-5 text-center">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="text-emerald-800 font-medium hover:underline">
            Kayıt olun
          </Link>
        </p>

        <p className="text-[11px] text-stone-400 mt-4 text-center">
          Demo giriş: demo@example.com / demo1234
        </p>
      </div>
    </div>
  );
}
