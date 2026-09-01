import { useState } from "react";
import { login, getSettings } from "../lib/adminStore";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("admin@bokaloka.com");
  const [password, setPassword] = useState("boka123");
  const [error, setError] = useState("");
  const settings = getSettings();

  const handle = async (e) => {
    e.preventDefault();
    try {
      const admin = await login(email.trim(), password);
      onSuccess(admin);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#fffbf0] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)] ring-1 ring-zinc-200">
        <div className="flex items-center gap-3">
          <img src={settings.logo} alt="Logo" className="h-11 w-auto rounded-xl object-contain ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.style.display='none'}} />
          <div>
            <div className="font-black tracking-tight text-zinc-900">BOKA LOKA</div>
            <div className="text-xs font-bold tracking-[0.14em] text-zinc-500">PAINEL ADMIN</div>
          </div>
        </div>
        <h1 className="mt-6 font-display text-[22px] font-black tracking-tight text-zinc-900">Entrar no painel</h1>
        <p className="mt-1 text-sm text-zinc-500">Acesso restrito a administradores. Use o e-mail cadastrado pelo admin master.</p>

        <div className="mt-4 rounded-xl bg-[#fff9d6] p-3 text-xs leading-relaxed text-zinc-700 ring-1 ring-[#ffc300]/40">
          <div className="font-black text-zinc-900">Acesso padrão</div>
          <div>e-mail: <span className="font-mono font-bold">admin@bokaloka.com</span></div>
          <div>senha: <span className="font-mono font-bold">boka123</span></div>
          <div className="mt-1 text-[11px] text-zinc-500">Troque após o primeiro acesso em “Admins”.</div>
        </div>

        <form onSubmit={handle} className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-black tracking-wide text-zinc-700">E-MAIL</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required placeholder="seu@email.com" className="mt-1 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15" />
          </div>
          <div>
            <label className="text-xs font-black tracking-wide text-zinc-700">SENHA</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15" />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-200">{error}</div>}
          <button type="submit" className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-black text-white hover:bg-black">Entrar</button>
        </form>
        <a href="/" className="mt-4 block text-center text-sm font-bold text-zinc-500 hover:text-zinc-900">← Voltar para o site</a>
      </div>
    </div>
  );
}
