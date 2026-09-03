import { useEffect, useMemo, useState } from "react";
import { getProducts, saveProducts, softDeleteProduct, getSettings, saveSettings, getAdmins, addAdmin, removeAdmin, getDiscounts, saveDiscounts, clearSession, getSession, getAccounts, addAccount, updateAccount, removeAccount, getTrash, restoreTrash, hardDeleteTrash, clearTrash, restoreProduct, purgeExpiredProducts } from "../lib/adminStore";
import { LogOut, Plus, Trash2, Pencil, Save, Image as ImageIcon, Percent, MapPin, Phone, Link2, ShoppingBag, Shield, Settings, Users, Gift, Upload, User, ArchiveRestore, Trash, History, Clock, Calendar, AlertTriangle, Eye } from "lucide-react";
import AdminLogin from "./AdminLogin";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
async function compressImage(file, max = 800, quality = 0.7) {
  // se for SVG, não comprime
  if (file.type.includes("svg")) return fileToDataUrl(file);
  try {
    const dataUrl = await fileToDataUrl(file);
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    let { width, height } = img;
    if (width > max || height > max) {
      const ratio = Math.min(max / width, max / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return fileToDataUrl(file);
  }
}

export default function AdminPanel() {
  const [session, setSession] = useState(() => getSession());
  const [tab, setTab] = useState("produtos");
  const [products, setProducts] = useState(() => getProducts());
  const [settings, setSettings] = useState(() => getSettings());
  const [admins, setAdmins] = useState(() => getAdmins());
  const [discounts, setDiscounts] = useState(() => getDiscounts());
  const [accounts, setAccounts] = useState(() => { try { return getAccounts(); } catch { return []; } });
  const [trash, setTrash] = useState({ products: [], productsLast30: [], admins: [], discounts: [], accounts: [] });
  const [toast, setToast] = useState(null);

  // keep in sync with localStorage events from other tabs
  useEffect(() => {
    const h = () => {
      setProducts(getProducts());
      setSettings(getSettings());
      setAdmins(getAdmins());
      setDiscounts(getDiscounts());
      try { setAccounts(getAccounts()); } catch {}
      loadTrash();
    };
    window.addEventListener("boka:products", h);
    window.addEventListener("boka:settings", h);
    window.addEventListener("boka:admins", h);
    window.addEventListener("boka:discounts", h);
    window.addEventListener("boka:accounts", h);
    window.addEventListener("boka:deleted_history", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("boka:products", h);
      window.removeEventListener("boka:settings", h);
      window.removeEventListener("boka:admins", h);
      window.removeEventListener("boka:discounts", h);
      window.removeEventListener("boka:accounts", h);
      window.removeEventListener("boka:deleted_history", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  // hidrata do SQL se /api estiver vivo
  useEffect(() => {
    import("../lib/adminStore").then(m => {
      m.fetchProductsFromSql().then(d=> d && setProducts(d)).catch(()=>{});
      m.fetchSettingsFromSql().then(d=> d && setSettings(d)).catch(()=>{});
      m.fetchAdminsFromSql().then(d=> d && setAdmins(d)).catch(()=>{});
      m.fetchDiscountsFromSql().then(d=> d && setDiscounts(d)).catch(()=>{});
      m.fetchAccountsFromSql().then(d=> d && setAccounts(d)).catch(()=>{});
    });
  }, []);
  const loadTrash = async () => {
    try { const data = await getTrash(); if (data) setTrash({ products: data.products || [], productsLast30: data.productsLast30 || data.products || [], admins: data.admins || [], discounts: data.discounts || [], accounts: data.accounts || [] }); } catch {}
  };
  useEffect(() => { loadTrash(); }, []);
  useEffect(() => { if (tab === "lixeira" || tab === "historico") loadTrash(); }, [tab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!session) {
    return <AdminLogin onSuccess={(a) => setSession({ email: a.email, name: a.name, id: a.id })} />;
  }

  const historicoCount = trash.productsLast30?.length ?? 0;
  const lixeiraTotal = (trash.products?.length || 0) + (trash.admins?.length || 0) + (trash.discounts?.length || 0) + (trash.accounts?.length || 0);

  return (
    <div className="min-h-screen bg-[#fffbf0] text-zinc-900">
      {/* top */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={settings.logo} alt="Logo" className="h-9 w-auto rounded-lg object-contain ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.style.display='none'}} />
            <div>
              <div className="text-sm font-black tracking-tight">BOKA LOKA • ADMIN</div>
              <div className="text-xs font-medium text-zinc-500">{session.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="hidden rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-black sm:inline-flex">Ver site</a>
            <button onClick={() => { clearSession(); setSession(null); }} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-black text-white hover:bg-black"><LogOut className="h-4 w-4" /> Sair</button>
          </div>
        </div>
        {/* tabs + lixeira destacada */}
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-thin">
            {[
              { id: "produtos", label: "Produtos", icon: ShoppingBag },
              { id: "historico", label: `Histórico`, icon: History, badge: historicoCount },
              { id: "descontos", label: "Descontos", icon: Percent },
              { id: "config", label: "Loja", icon: Settings },
              { id: "logo", label: "Logo", icon: ImageIcon },
              { id: "admins", label: "Admins", icon: Users },
              { id: "contas", label: "Contas", icon: User },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 transition ${tab===t.id ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"}`}>
                <t.icon className="h-4 w-4" /> {t.label} {t.badge > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab===t.id ? "bg-white text-zinc-900" : "bg-amber-400 text-zinc-900"}`}>{t.badge}</span>}
              </button>
            ))}
            <button onClick={() => setTab("lixeira")} className={`ml-2 inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 transition ${tab==="lixeira" ? "bg-red-600 text-white ring-red-600" : "bg-red-50 text-red-700 ring-red-200 hover:bg-red-100"}`}>
              <Trash className="h-4 w-4" /> Lixeira {lixeiraTotal > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab==="lixeira" ? "bg-white text-red-600" : "bg-red-600 text-white"}`}>{lixeiraTotal}</span>}
            </button>
          </div>
          <div className="pb-1 text-xs font-bold text-zinc-500">↔️ Arraste as abas para ver todas • <button onClick={()=>setTab("historico")} className="font-black text-amber-600 underline">Histórico 30 dias de produtos excluídos</button> • <button onClick={()=>setTab("lixeira")} className="font-black text-red-600 underline">Lixeira geral</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {tab === "produtos" && <ProdutosTab products={products} setProducts={setProducts} showToast={showToast} loadTrash={loadTrash} trash={trash} setTab={setTab} />}
        {tab === "historico" && <HistoricoProdutosTab trash={trash} loadTrash={loadTrash} setProducts={setProducts} showToast={showToast} />}
        {tab === "descontos" && <DescontosTab products={products} discounts={discounts} setDiscounts={setDiscounts} showToast={showToast} loadTrash={loadTrash} />}
        {tab === "config" && <ConfigTab settings={settings} setSettings={setSettings} showToast={showToast} />}
        {tab === "logo" && <LogoTab settings={settings} setSettings={setSettings} showToast={showToast} />}
        {tab === "admins" && <AdminsTab admins={admins} setAdmins={setAdmins} showToast={showToast} loadTrash={loadTrash} />}
        {tab === "contas" && <ContasTab accounts={accounts} setAccounts={setAccounts} showToast={showToast} loadTrash={loadTrash} />}
        {tab === "lixeira" && <LixeiraTab trash={trash} loadTrash={loadTrash} setProducts={setProducts} setAdmins={setAdmins} setDiscounts={setDiscounts} setAccounts={setAccounts} showToast={showToast} />}
      </main>

      {toast && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

// ---------------- Produtos ----------------
function ProdutosTab({ products, setProducts, showToast, loadTrash, trash, setTab }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", desc: "", price: "", category: "Clássicos", image: "", badge: "Clássico", popular: false });
  const [imageMode, setImageMode] = useState("url"); // url | upload
  const categories = useMemo(() => [...new Set(products.map(p=>p.category))], [products]);
  const historicoCount = trash?.productsLast30?.length ?? trash?.products?.filter(p=> p.deletedAt && (Date.now() - new Date(p.deletedAt).getTime()) <= 30*24*60*60*1000).length ?? 0;

  const reset = () => {
    setEditing(null);
    setForm({ name: "", desc: "", price: "", category: "Clássicos", image: "", badge: "Clássico", popular: false });
    setImageMode("url");
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, desc: p.desc, price: String(p.price), category: p.category, image: p.image, badge: p.badge || "", popular: !!p.popular });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price || !form.image.trim()) {
      showToast("Preencha nome, preço e imagem");
      return;
    }
    const price = Number(String(form.price).replace(",", "."));
    if (Number.isNaN(price)) { showToast("Preço inválido"); return; }
    if (editing) {
      const next = products.map(p => p.id===editing ? { ...p, name: form.name.trim(), desc: form.desc.trim(), price, category: form.category.trim() || "Clássicos", image: form.image.trim(), badge: form.badge.trim(), popular: form.popular } : p);
      saveProducts(next); setProducts(next); showToast("Produto atualizado");
    } else {
      const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36).slice(0,4);
      const next = [...products, { id, name: form.name.trim(), desc: form.desc.trim(), price, category: form.category.trim() || "Clássicos", image: form.image.trim(), badge: form.badge.trim() || "Novo", popular: form.popular }];
      saveProducts(next); setProducts(next); showToast("Produto adicionado");
    }
    reset();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este produto? Ele vai para o Histórico (30 dias) e poderá ser recuperado.")) return;
    try { await softDeleteProduct(id); } catch (e) { console.error(e); }
    // garante que sqlBrowser terminou (import dinâmico pode demorar)
    await new Promise(r=>setTimeout(r, 150));
    setProducts(getProducts());
    await loadTrash?.();
    showToast("Produto movido para Histórico 30 dias");
  };

  const onFile = async (file) => {
    if (!file) return;
    if (file.size > 400_000) {
      // tenta comprimir
      const url = await compressImage(file);
      setForm(f=>({ ...f, image: url }));
    } else {
      const url = await fileToDataUrl(file);
      setForm(f=>({ ...f, image: url }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800 ring-1 ring-amber-200 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2"><History className="h-4 w-4" /> Produtos excluídos ficam 30 dias no Histórico e podem ser recuperados</span>
        <button onClick={()=>setTab?.("historico")} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-black text-white hover:bg-amber-600">
          <Eye className="h-3.5 w-3.5" /> Ver Histórico {historicoCount>0 && `(${historicoCount})`}
        </button>
      </div>
      {historicoCount>0 && (
        <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200 flex items-center justify-between">
          <div className="text-sm"><span className="font-black">{historicoCount} produto{historicoCount!==1?"s":""} excluído{historicoCount!==1?"s":""}</span> nos últimos 30 dias — <span className="text-zinc-500">você pode recuperar a qualquer momento</span></div>
          <button onClick={()=>setTab?.("historico")} className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-black text-white">Abrir Histórico</button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-black tracking-tight">Produtos</h2>
          <p className="text-sm text-zinc-500">{products.length} itens • edição ao vivo refletida no site</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-zinc-200">{categories.join(" • ")}</div>
      </div>

      {/* form */}
      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-black"><Pencil className="h-4 w-4" />{editing ? "Editar produto" : "Adicionar produto"}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-black tracking-wide text-zinc-600">Nome *</span>
            <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Ex: X-Bacon Supremo" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black tracking-wide text-zinc-600">Preço (R$) *</span>
            <input value={form.price} onChange={e=>setForm({...form, price: e.target.value})} placeholder="34.90" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black tracking-wide text-zinc-600">Categoria *</span>
            <input list="cat-list" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} placeholder="Clássicos" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
            <datalist id="cat-list">{categories.map(c=><option key={c} value={c} />)}</datalist>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black tracking-wide text-zinc-600">Badge</span>
            <input value={form.badge} onChange={e=>setForm({...form, badge: e.target.value})} placeholder="Mais pedido / Clássico" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="sm:col-span-2 space-y-1">
            <span className="text-xs font-black tracking-wide text-zinc-600">Descrição</span>
            <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} rows={2} placeholder="Ingredientes e detalhes" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>

          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-zinc-600">Imagem *</span>
              <div className="ml-auto flex gap-1 rounded-full bg-zinc-100 p-1">
                <button type="button" onClick={()=>setImageMode("url")} className={`rounded-full px-3 py-1 text-xs font-black ${imageMode==="url" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>URL</button>
                <button type="button" onClick={()=>setImageMode("upload")} className={`rounded-full px-3 py-1 text-xs font-black ${imageMode==="upload" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>Upload</button>
              </div>
            </div>
            {imageMode==="url" ? (
              <input value={form.image} onChange={e=>setForm({...form, image: e.target.value})} placeholder="https://... ou /boka-loka-logo.svg" className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
            ) : (
              <label className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3">
                <Upload className="h-5 w-5 text-zinc-500" />
                <input type="file" accept="image/*" onChange={(e)=> onFile(e.target.files?.[0])} className="text-sm" />
                <span className="text-xs text-zinc-500">PNG/JPG/WebP — vira base64 e salva no navegador</span>
              </label>
            )}
            {form.image && <img src={form.image} alt="preview" className="mt-2 h-24 w-24 rounded-xl object-cover ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.style.display='none'}} />}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.popular} onChange={e=>setForm({...form, popular: e.target.checked})} className="h-4 w-4" />
            <span className="text-sm font-bold">Popular</span>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-full bg-[#e30613] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b8050f]"><Save className="h-4 w-4" />{editing ? "Salvar" : "Adicionar"}</button>
          {editing && <button onClick={reset} className="rounded-full bg-white px-5 py-2.5 text-sm font-black ring-1 ring-zinc-200">Cancelar</button>}
        </div>
      </div>

      {/* list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(p=> (
          <div key={p.id} className="flex flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-zinc-200">
            <img src={p.image} alt={p.name} className="h-36 w-full object-cover" loading="lazy" onError={(e)=>{e.currentTarget.src="https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400&q=60&auto=format&fit=crop"}} />
            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-black leading-none text-zinc-900">{p.name}</div>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black">{p.category}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.desc}</div>
              <div className="mt-2 text-sm font-black text-[#e30613]">R$ {Number(p.price).toFixed(2).replace(".", ",")} {p.popular && <span className="ml-2 rounded-full bg-[#ffc300] px-2 py-0.5 text-[10px] text-zinc-900">POPULAR</span>}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>startEdit(p)} className="flex-1 rounded-full bg-zinc-900 py-2 text-xs font-black text-white">Editar</button>
                <button onClick={()=>handleDelete(p.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Histórico de Produtos Excluídos (30 dias) ----------------
function HistoricoProdutosTab({ trash, loadTrash, setProducts, showToast }) {
  const [filter, setFilter] = useState("");
  // usa productsLast30 se disponível, senão filtra manualmente
  const rawProducts = trash.products || [];
  const productsLast30 = useMemo(() => {
    if (trash.productsLast30 && trash.productsLast30.length) return trash.productsLast30;
    const now = Date.now();
    const THIRTY = 30*24*60*60*1000;
    return rawProducts.filter(p => {
      if (!p.deletedAt) return false;
      return (now - new Date(p.deletedAt).getTime()) <= THIRTY;
    });
  }, [trash.products, trash.productsLast30, rawProducts]);
  const expiredProducts = useMemo(() => {
    const now = Date.now();
    const THIRTY = 30*24*60*60*1000;
    return rawProducts.filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) > THIRTY);
  }, [rawProducts]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return productsLast30;
    const q = filter.toLowerCase();
    return productsLast30.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q));
  }, [productsLast30, filter]);

  const handleRestore = async (id) => {
    try {
      // tenta endpoint dedicado de produto primeiro, fallback para trash genérico
      try { await restoreProduct(id); } catch { await restoreTrash("products", id); }
      showToast("✅ Produto recuperado — voltou para o cardápio");
      await loadTrash();
      const m = await import("../lib/adminStore");
      const d = await m.fetchProductsFromSql();
      if (d) setProducts(d); else setProducts(m.getProducts());
    } catch (e) { showToast(e.message || "Erro ao recuperar"); }
  };
  const handleHardDelete = async (id) => {
    if (!confirm("Excluir permanentemente? Não poderá recuperar depois de 30 dias mesmo.")) return;
    try {
      await hardDeleteTrash("products", id);
      showToast("Excluído permanentemente");
      loadTrash();
    } catch (e) { showToast(e.message); }
  };
  const handlePurgeExpired = async () => {
    if (!confirm(`Remover permanentemente ${expiredProducts.length} produto(s) expirado(s) há mais de 30 dias?`)) return;
    try {
      const res = await purgeExpiredProducts();
      showToast(res?.purged ? `${res.purged} expirados removidos` : "Expirados removidos");
      // também hard delete manual dos expirados se API não purgou
      for (const p of expiredProducts) { try { await hardDeleteTrash("products", p.id); } catch {} }
      loadTrash();
    } catch (e) { showToast(e.message); }
  };

  const calcRemaining = (deletedAt) => {
    if (!deletedAt) return null;
    const diff = Date.now() - new Date(deletedAt).getTime();
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const remaining = 30 - days;
    return { days, hours, remaining: Math.max(0, remaining) };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-amber-600" />
            <h2 className="font-display text-[22px] font-black tracking-tight">Histórico — Produtos Excluídos</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200">30 dias • recuperável</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Todo produto excluído fica aqui por <b>30 dias</b>. Dentro desse prazo você pode <b>recuperar com 1 clique</b>. Após 30 dias é removido automaticamente.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTrash} className="rounded-full bg-white px-4 py-2 text-xs font-black ring-1 ring-zinc-200 hover:bg-zinc-50">Atualizar</button>
          {expiredProducts.length>0 && <button onClick={handlePurgeExpired} className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700">Limpar expirados ({expiredProducts.length})</button>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <div className="text-xs font-black tracking-wide text-zinc-500 flex items-center gap-2"><Clock className="h-4 w-4" /> ATIVOS NO HISTÓRICO</div>
          <div className="mt-1 text-2xl font-black">{productsLast30.length}</div>
          <div className="text-xs text-zinc-500">nos últimos 30 dias</div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <div className="text-xs font-black tracking-wide text-zinc-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> TOTAL NA LIXEIRA</div>
          <div className="mt-1 text-2xl font-black">{rawProducts.length}</div>
          <div className="text-xs text-zinc-500">produtos com deleted=1</div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <div className="text-xs font-black tracking-wide text-zinc-500 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> EXPIRADOS &gt;30 DIAS</div>
          <div className="mt-1 text-2xl font-black text-red-600">{expiredProducts.length}</div>
          <div className="text-xs text-zinc-500">serão removidos</div>
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-black">Buscar no histórico</div>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Nome, categoria ou ID..." className="w-full sm:w-72 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white" />
        </div>
        <div className="mt-2 text-xs text-zinc-500">{filtered.length} resultado(s) • ordenado por data de exclusão (recente primeiro)</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center ring-1 ring-zinc-200">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600"><History className="h-6 w-6" /></div>
          <div className="mt-3 font-black">Nenhum produto excluído nos últimos 30 dias</div>
          <div className="mt-1 text-sm text-zinc-500">Quando você excluir um produto em <b>Produtos → 🗑️</b>, ele aparecerá aqui e poderá ser recuperado.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p=> {
            const info = calcRemaining(p.deletedAt);
            const remaining = info?.remaining ?? p.daysRemaining ?? 0;
            const isUrgent = remaining <= 5;
            const isWarning = remaining <= 10 && remaining >5;
            return (
              <div key={p.id} className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 sm:flex-row sm:items-center sm:justify-between ${isUrgent ? "ring-red-200 bg-red-50/50" : isWarning ? "ring-amber-200 bg-amber-50/40" : "ring-zinc-200"}`}>
                <div className="flex gap-3 min-w-0 flex-1">
                  <img src={p.image} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.src="https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=200&q=60&auto=format&fit=crop"}} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black truncate">{p.name}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black ring-1 ring-zinc-200">{p.category}</span>
                      {p.badge && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black ring-1 ring-zinc-200">{p.badge}</span>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">{p.desc || p.description || "Sem descrição"} • R$ {Number(p.price).toFixed(2).replace(".",",")}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono text-zinc-500"><Calendar className="h-3 w-3" /> Excluído em {p.deletedAt ? new Date(p.deletedAt).toLocaleString("pt-BR") : "—"}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ring-1 ${isUrgent ? "bg-red-600 text-white ring-red-600" : isWarning ? "bg-amber-400 text-zinc-900 ring-amber-400" : "bg-emerald-100 text-emerald-700 ring-emerald-200"}`}>
                        <Clock className="h-3 w-3" /> {remaining} dia{remaining!==1?"s":""} restante{remaining!==1?"s":""} {info && `(${info.days}d ${info.hours}h atrás)`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200">
                      <div className={`h-full ${isUrgent ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.max(5, (remaining/30)*100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                  <button onClick={()=>handleRestore(p.id)} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700">
                    <ArchiveRestore className="h-4 w-4" /> Recuperar
                  </button>
                  <button onClick={()=>handleHardDelete(p.id)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50" title="Excluir permanentemente">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expiredProducts.length>0 && (
        <div className="rounded-[20px] bg-white p-4 ring-1 ring-red-200">
          <div className="flex items-center gap-2 font-black text-red-700"><AlertTriangle className="h-4 w-4" /> Expirados há mais de 30 dias ({expiredProducts.length})</div>
          <p className="mt-1 text-xs text-zinc-500">Foram excluídos há mais de 30 dias. Não são mais recuperáveis pelo histórico de 30 dias, mas ainda estão na Lixeira geral até limpeza. Você pode removê-los permanentemente aqui.</p>
          <div className="mt-3 grid gap-2">
            {expiredProducts.slice(0,5).map(p=> (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                <span className="font-bold text-sm truncate">{p.name} • {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("pt-BR"): ""}</span>
                <button onClick={()=>handleHardDelete(p.id)} className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">Excluir definitivamente</button>
              </div>
            ))}
            {expiredProducts.length>5 && <div className="text-xs text-zinc-500">+ {expiredProducts.length-5} outros • vá na Lixeira para ver todos</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Descontos ----------------
function DescontosTab({ products, discounts, setDiscounts, showToast, loadTrash }) {
  const [form, setForm] = useState({ label: "", percent: "", category: "Todos", productId: "", active: true });
  const categories = useMemo(() => ["Todos", ...new Set(products.map(p=>p.category))], [products]);

  const add = async () => {
    const percent = Number(String(form.percent).replace(",", "."));
    if (!form.label.trim() || Number.isNaN(percent) || percent<=0 || percent>=90) { showToast("Informe nome e % 1-89"); return; }
    const payload = { label: form.label.trim(), percent, category: form.category, productId: form.productId || null, active: !!form.active };
    try {
      const r = await fetch("/api/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.ok) {
        const created = await r.json();
        const next = [...discounts, { ...created, active: !!created.active }];
        saveDiscounts(next); setDiscounts(next);
      } else {
        const next = [...discounts, { id: Date.now().toString(), ...payload }];
        saveDiscounts(next); setDiscounts(next);
      }
      showToast("Desconto criado (SQL)");
    } catch {
      const next = [...discounts, { id: Date.now().toString(), ...payload }];
      saveDiscounts(next); setDiscounts(next); showToast("Desconto criado (local)");
    }
    setForm({ label: "", percent: "", category: "Todos", productId: "", active: true });
  };
  const toggle = async (id) => {
    const target = discounts.find(d=>d.id===id);
    if (!target) return;
    const updated = { ...target, active: !target.active };
    try {
      const r = await fetch(`/api/discounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: updated.active }) });
      if (r.ok) {
        const saved = await r.json();
        const next = discounts.map(d=> d.id===id ? { ...d, ...saved, active: !!saved.active } : d);
        saveDiscounts(next); setDiscounts(next); return;
      }
    } catch {}
    const next = discounts.map(d=> d.id===id ? { ...d, active: !d.active } : d);
    saveDiscounts(next); setDiscounts(next);
  };
  const remove = async (id) => {
    if (!confirm("Remover desconto? Vai para a Lixeira.")) return;
    try { await fetch(`/api/discounts/${id}`, { method: "DELETE" }); } catch {}
    const next = discounts.filter(d=>d.id!==id);
    saveDiscounts(next); setDiscounts(next); loadTrash?.(); showToast("Desconto movido para Lixeira");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[22px] font-black tracking-tight">Descontos</h2>
        <p className="text-sm text-zinc-500">Crie % por categoria ou produto específico. Applica automaticamente no cardápio e carrinho.</p>
      </div>

      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-black">Nome / Cupom *</span>
            <input value={form.label} onChange={e=>setForm({...form, label: e.target.value})} placeholder="Ex: BOKA10" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black">% Desconto *</span>
            <input value={form.percent} onChange={e=>setForm({...form, percent: e.target.value})} placeholder="10" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black">Categoria</span>
            <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900">
              {categories.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black">Produto específico (opcional)</span>
            <select value={form.productId} onChange={e=>setForm({...form, productId: e.target.value})} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900">
              <option value="">Todos da categoria</option>
              {products.map(p=> <option key={p.id} value={p.id}>{p.name} — R$ {p.price}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} className="h-4 w-4" />
            <span className="text-sm font-bold">Ativo</span>
          </label>
        </div>
        <button onClick={add} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e30613] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b8050f]"><Gift className="h-4 w-4" /> Criar desconto</button>
      </div>

      <div className="grid gap-3">
        {discounts.length===0 ? <div className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhum desconto yet.</div> : discounts.map(d=> (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <div>
              <div className="font-black">{d.label} — {d.percent}% {d.active ? "• Ativo" : "• Inativo"}</div>
              <div className="text-xs text-zinc-500">Categoria: {d.category} {d.productId ? "• Produto: "+(products.find(p=>p.id===d.productId)?.name || d.productId) : "• Todos produtos"}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>toggle(d.id)} className={`rounded-full px-4 py-2 text-xs font-black ${d.active ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200"}`}>{d.active ? "Desativar" : "Ativar"}</button>
              <button onClick={()=>remove(d.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Config ----------------
function ConfigTab({ settings, setSettings, showToast }) {
  const [form, setForm] = useState(settings);
  useEffect(()=> setForm(settings), [settings]);

  const save = () => {
    const next = saveSettings(form);
    setSettings(next);
    showToast("Configurações salvas");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-[22px] font-black tracking-tight">Configurações da loja</h2>
      <div className="grid gap-4 rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <label className="space-y-1">
          <span className="flex items-center gap-2 text-xs font-black"><MapPin className="h-4 w-4" />Endereço completo *</span>
          <input value={form.address} onChange={e=>setForm({...form, address: e.target.value})} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black">Link Google Maps</span>
          <input value={form.gmapsLink} onChange={e=>setForm({...form, gmapsLink: e.target.value})} placeholder="https://www.google.com/maps/search/?api=1&query=..." className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <span className="text-xs text-zinc-500">Se vazio, será gerado automaticamente do endereço.</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="flex items-center gap-2 text-xs font-black"><Phone className="h-4 w-4" />Telefone exibição</span>
            <input value={form.phoneDisplay} onChange={e=>setForm({...form, phoneDisplay: e.target.value})} placeholder="(48) 3622-3376" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black">Telefone tel: (+55...)</span>
            <input value={form.phoneTel} onChange={e=>setForm({...form, phoneTel: e.target.value})} placeholder="+554836223376" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
        </div>
        <label className="space-y-1">
          <span className="text-xs font-black">WhatsApp (apenas números, com DDD)</span>
          <input value={form.whatsappNumber} onChange={e=>setForm({...form, whatsappNumber: e.target.value.replace(/\D/g,"")})} placeholder="554836223376" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-2 text-xs font-black"><Link2 className="h-4 w-4" />Instagram URL</span>
          <input value={form.instagramUrl} onChange={e=>setForm({...form, instagramUrl: e.target.value})} placeholder="https://instagram.com/bokalokalanchestb" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-2 text-xs font-black"><Link2 className="h-4 w-4" />iFood URL</span>
          <input value={form.ifoodUrl} onChange={e=>setForm({...form, ifoodUrl: e.target.value})} placeholder="https://www.ifood.com.br/..." className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-black">Hora abre (0-23)</span>
            <input type="number" min={0} max={23} value={form.openHour} onChange={e=>setForm({...form, openHour: Number(e.target.value)})} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-black">Hora fecha (0-23, 0=meia-noite)</span>
            <input type="number" min={0} max={23} value={form.closeHour} onChange={e=>setForm({...form, closeHour: Number(e.target.value)})} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </label>
        </div>

        <button onClick={save} className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-black text-white hover:bg-black"><Save className="h-4 w-4" /> Salvar configurações</button>
      </div>
    </div>
  );
}

// ---------------- Logo ----------------
function LogoTab({ settings, setSettings, showToast }) {
  const [logo, setLogo] = useState(settings.logo);
  useEffect(()=> setLogo(settings.logo), [settings.logo]);

  const onFile = async (file) => {
    if (!file) return;
    // SVG mantém vetor, outros comprimem
    if (file.type.includes("svg")) {
      const data = await fileToDataUrl(file);
      setLogo(data);
    } else {
      const data = await compressImage(file, 400, 0.8);
      setLogo(data);
    }
  };
  const save = () => {
    const next = saveSettings({ logo });
    setSettings(next);
    showToast("Logo atualizada — já refletindo no site");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-[22px] font-black tracking-tight">Logo</h2>
      <p className="text-sm text-zinc-500">Troque a logo do header/footer. Aceita URL ou upload (vira base64). Recomendado: SVG ou PNG com fundo transparente / vermelho Boka.</p>
      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-xs font-black">URL da logo</label>
            <input value={logo?.startsWith("data:") ? "" : logo} onChange={e=>setLogo(e.target.value)} placeholder="/boka-loka-logo.svg ou https://..." className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
            <div className="text-xs text-zinc-500">Ou faça upload:</div>
            <label className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3">
              <Upload className="h-5 w-5 text-zinc-500" />
              <input type="file" accept="image/*,.svg" onChange={e=>onFile(e.target.files?.[0])} className="text-sm" />
            </label>
            <button onClick={save} className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-black text-white hover:bg-black">Salvar logo</button>
            <button onClick={()=>{ setLogo("/boka-loka-logo.svg"); saveSettings({ logo: "/boka-loka-logo.svg" }); setSettings(getSettings()); showToast("Logo restaurada"); }} className="ml-2 rounded-full bg-white px-4 py-2 text-xs font-black ring-1 ring-zinc-200">Restaurar padrão</button>
          </div>
          <div className="grid place-items-center rounded-2xl bg-[#fffbf0] p-6 ring-1 ring-zinc-200">
            <div className="text-xs font-black tracking-wide text-zinc-500">PRÉVIA</div>
            <img src={logo} alt="Logo preview" className="mt-3 max-h-28 w-auto rounded-xl object-contain shadow ring-1 ring-zinc-200" onError={(e)=>{e.currentTarget.style.display='none'}} />
            <div className="mt-3 text-center text-xs text-zinc-500 break-all">{logo?.slice(0,60)}...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Admins ----------------
function AdminsTab({ admins, setAdmins, showToast, loadTrash }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!email.trim() || !password.trim()) { showToast("E-mail e senha obrigatórios"); return; }
    try {
      addAdmin({ email: email.trim(), password, name: name.trim() || email.split("@")[0] });
      setAdmins(getAdmins());
      setEmail(""); setPassword(""); setName("");
      showToast("Admin adicionado");
    } catch (e) {
      showToast(e.message);
    }
  };
  const handleRemove = (id) => {
    if (!confirm("Remover este admin? Vai para a Lixeira.")) return;
    try {
      removeAdmin(id);
      setAdmins(getAdmins());
      loadTrash?.();
      showToast("Admin movido para a Lixeira");
    } catch (e) { showToast(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-zinc-900" />
        <h2 className="font-display text-[22px] font-black tracking-tight">Administradores</h2>
      </div>
      <p className="text-sm text-zinc-500">Adicione outros e-mails para acessarem <span className="font-mono font-bold">/admin</span> com login próprio. O primeiro admin (super) não pode ser removido se for o único.</p>

      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome (opcional)" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="novo@email.com" type="email" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="senha" type="text" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </div>
        <button onClick={handleAdd} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e30613] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b8050f]"><Plus className="h-4 w-4" /> Adicionar admin</button>
      </div>

      <div className="grid gap-3">
        {admins.map(a=> (
          <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <div>
              <div className="font-black">{a.name} <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-black tracking-wide text-white">{a.role}</span></div>
              <div className="font-mono text-xs text-zinc-500">{a.email}</div>
              <div className="text-xs text-zinc-400">Criado em {new Date(a.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
            <button onClick={()=>handleRemove(a.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Contas (clientes) ----------------
function ContasTab({ accounts, setAccounts, showToast, loadTrash }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [editing, setEditing] = useState(null);

  const handleAdd = () => {
    if (!name.trim() || !email.trim()) { showToast("Nome e e-mail obrigatórios"); return; }
    try {
      const created = addAccount({ name: name.trim(), email: email.trim(), phone: phone.trim(), password: pass });
      setAccounts(getAccounts());
      setName(""); setEmail(""); setPhone(""); setPass("");
      showToast(`Conta ${created.email} criada no SQL`);
    } catch (e) { showToast(e.message); }
  };
  const handleUpdate = () => {
    if (!editing) return;
    try {
      updateAccount(editing, { name: name.trim(), email: email.trim(), phone: phone.trim(), password: pass || undefined });
      setAccounts(getAccounts());
      setEditing(null); setName(""); setEmail(""); setPhone(""); setPass("");
      showToast("Conta atualizada no SQL");
    } catch (e) { showToast(e.message); }
  };
  const startEdit = (acc) => {
    setEditing(acc.id);
    setName(acc.name); setEmail(acc.email); setPhone(acc.phone || ""); setPass("");
  };
  const handleRemove = (id) => {
    if (!confirm("Excluir esta conta? Vai para a Lixeira.")) return;
    try { removeAccount(id); setAccounts(getAccounts()); loadTrash?.(); showToast("Conta movida para a Lixeira"); } catch (e) { showToast(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-zinc-900" />
        <h2 className="font-display text-[22px] font-black tracking-tight">Contas</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-zinc-200">{accounts.length} contas • SQL</span>
      </div>
      <p className="text-sm text-zinc-500">Todas as contas ficam em <span className="font-mono font-bold">SQL: accounts(id, name, email, phone, password, createdAt)</span>. Ao adicionar/editar/excluir, a página atualiza e o SQL é gravado (local `sql.js` + `server/boka.db` se rodando `npm run dev`).</p>

      <div className="rounded-[20px] bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome *" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com *" type="email" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Telefone (48) 9..." className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder={editing ? "Nova senha (deixe vazio para manter)" : "Senha"} type="text" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
        </div>
        <div className="mt-3 flex gap-2">
          {editing ? (
            <>
              <button onClick={handleUpdate} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-black text-white hover:bg-black"><Save className="h-4 w-4" /> Salvar</button>
              <button onClick={()=>{ setEditing(null); setName(""); setEmail(""); setPhone(""); setPass(""); }} className="rounded-full bg-white px-4 py-2 text-sm font-black ring-1 ring-zinc-200">Cancelar</button>
            </>
          ) : (
            <button onClick={handleAdd} className="inline-flex items-center gap-2 rounded-full bg-[#e30613] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b8050f]"><Plus className="h-4 w-4" /> Adicionar conta</button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {accounts.map(acc=> (
          <div key={acc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <div>
              <div className="font-black">{acc.name} <span className="ml-2 font-mono text-xs text-zinc-500">#{acc.id.slice(0,6)}</span></div>
              <div className="font-mono text-xs text-zinc-500">{acc.email} • {acc.phone || "sem telefone"}</div>
              <div className="text-xs text-zinc-400">Criado em {new Date(acc.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>startEdit(acc)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"><Pencil className="h-4 w-4" /></button>
              <button onClick={()=>handleRemove(acc.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {accounts.length===0 && <div className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhuma conta. Adicione a primeira.</div>}
      </div>
    </div>
  );
}

// ---------------- Lixeira ----------------
function LixeiraTab({ trash, loadTrash, setProducts, setAdmins, setDiscounts, setAccounts, showToast }) {
  const total = (trash.products?.length || 0) + (trash.admins?.length || 0) + (trash.discounts?.length || 0) + (trash.accounts?.length || 0);
  const produtosRecuperaveis = trash.productsLast30?.length ?? 0;

  const handleRestore = async (type, id) => {
    try {
      await restoreTrash(type, id);
      showToast("Restaurado do SQL");
      await loadTrash();
      // recarrega listas principais
      const m = await import("../lib/adminStore");
      if (type === "products") { const d = await m.fetchProductsFromSql(); if (d) setProducts(d); else setProducts(m.getProducts()); }
      if (type === "admins") { const d = await m.fetchAdminsFromSql(); if (d) setAdmins(d); else setAdmins(m.getAdmins()); }
      if (type === "discounts") { const d = await m.fetchDiscountsFromSql(); if (d) setDiscounts(d); else setDiscounts(m.getDiscounts()); }
      if (type === "accounts") { const d = await m.fetchAccountsFromSql(); if (d) setAccounts(d); else setAccounts(m.getAccounts()); }
    } catch (e) { showToast(e.message); }
  };
  const handleHardDelete = async (type, id) => {
    if (!confirm("Excluir permanentemente? Não poderá recuperar.")) return;
    try {
      await hardDeleteTrash(type, id);
      showToast("Excluído permanentemente do SQL");
      loadTrash();
    } catch (e) { showToast(e.message); }
  };
  const handleClear = async () => {
    if (!confirm("Limpar toda a lixeira permanentemente?")) return;
    try { await clearTrash(); showToast("Lixeira esvaziada"); loadTrash(); } catch (e) { showToast(e.message); }
  };

  const Section = ({ title, items, type, render, highlight }) => (
    <div className={`rounded-[20px] p-4 ring-1 ${highlight ? "bg-amber-50 ring-amber-200" : "bg-white ring-zinc-200"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black flex items-center gap-2">{title} <span className={`rounded-full px-2 py-0.5 text-xs ${highlight ? "bg-amber-400 text-zinc-900" : "bg-zinc-100"}`}>{items.length}</span> {highlight && items.length>0 && <span className="text-[11px] font-bold text-amber-700">• 30 dias recuperável</span>}</h3>
      </div>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? <div className="text-sm text-zinc-500">Vazio</div> : items.map(item => {
          const remaining = item.daysRemaining ?? (item.deletedAt ? Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deletedAt).getTime())/(1000*60*60*24))) : null);
          return (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <div className="min-w-0">
              <div className="truncate font-bold text-sm">{render(item)}</div>
              <div className="truncate font-mono text-xs text-zinc-500">{item.id} • {item.email || item.name || item.label || ""} {item.deletedAt ? "• " + new Date(item.deletedAt).toLocaleString("pt-BR") : ""}</div>
              {type==="products" && remaining!==null && <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${remaining<=5?"bg-red-100 text-red-700 ring-1 ring-red-200":remaining<=10?"bg-amber-100 text-amber-700 ring-1 ring-amber-200":"bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"}`}>{remaining} dias restantes</div>}
            </div>
            <div className="flex gap-1">
              <button onClick={()=>handleRestore(type, item.id)} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700"><ArchiveRestore className="h-3.5 w-3.5" /> Recuperar</button>
              <button onClick={()=>handleHardDelete(type, item.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trash className="h-5 w-5 text-zinc-900" />
          <h2 className="font-display text-[22px] font-black tracking-tight">Lixeira</h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-zinc-200">{total} itens • SQL soft delete</span>
          {produtosRecuperaveis>0 && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-zinc-900">{produtosRecuperaveis} produtos recuperáveis (30d)</span>}
        </div>
        {total > 0 && <button onClick={handleClear} className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700">Esvaziar lixeira</button>}
      </div>
      <p className="text-sm text-zinc-500">Itens apagados ficam aqui com <span className="font-mono font-bold">deleted=1</span> no SQL. <b>Produtos</b> têm histórico de <b>30 dias</b> para recuperação (veja aba <b>Histórico</b>). Você pode <span className="font-bold">recuperar</span> (volta para o site) ou <span className="font-bold">excluir permanentemente</span> (DELETE).</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section highlight title="Produtos (Histórico 30 dias)" items={trash.productsLast30 || trash.products || []} type="products" render={(p)=> `${p.name} — R$ ${Number(p.price).toFixed(2)}`} />
        <Section title="Produtos expirados / todos" items={trash.products || []} type="products" render={(p)=> `${p.name} — R$ ${Number(p.price).toFixed(2)}`} />
        <Section title="Contas" items={trash.accounts || []} type="accounts" render={(a)=> `${a.name} — ${a.email}`} />
        <Section title="Admins" items={trash.admins || []} type="admins" render={(a)=> `${a.name} — ${a.email}`} />
        <Section title="Descontos" items={trash.discounts || []} type="discounts" render={(d)=> `${d.label} — ${d.percent}%`} />
      </div>
    </div>
  );
}
