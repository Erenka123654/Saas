"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2 } from "lucide-react";

type Member = { name: string; email: string; role: string };

export default function AyarlarPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/organizations/members");
    const data = await res.json();
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);
    const res = await fetch("/api/organizations/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Bir sorun oluştu." });
      return;
    }
    setMessage({ type: "ok", text: "Kullanıcı organizasyona eklendi." });
    setEmail("");
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-6">Ekip Ayarları</h1>

      <div className="bg-white border border-stone-300 rounded-lg p-5 mb-6 max-w-lg">
        <h2 className="text-sm font-display font-semibold uppercase tracking-wide text-stone-700 mb-3">
          Üye Ekle
        </h2>
        <p className="text-xs text-stone-500 mb-3">
          Eklemek istediğiniz kişinin bu uygulamada zaten bir hesabı olmalı.
        </p>
        {message && (
          <div className={`mb-3 text-sm rounded px-3 py-2 border ${message.type === "ok" ? "text-emerald-800 bg-emerald-50 border-emerald-200" : "text-red-800 bg-red-50 border-red-200"}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kullanici@sirket.com"
            className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="submit" disabled={inviting}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 rounded transition-colors disabled:opacity-60"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Ekle
          </button>
        </form>
      </div>

      <div className="bg-white border border-stone-300 rounded-lg overflow-hidden max-w-lg">
        <h2 className="text-sm font-display font-semibold uppercase tracking-wide text-stone-700 p-5 pb-3">
          Ekip Üyeleri
        </h2>
        {loading ? (
          <div className="px-5 pb-5 text-sm text-stone-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-t border-stone-100">
                  <td className="px-5 py-3">
                    <div className="text-stone-800">{m.name}</div>
                    <div className="text-xs text-stone-400">{m.email}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-xs uppercase text-stone-500">{m.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
