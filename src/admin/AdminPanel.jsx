import { useEffect, useMemo, useState } from "react";
import { getProducts, saveProducts, getSettings, saveSettings, getAdmins, addAdmin, removeAdmin, getDiscounts, saveDiscounts, clearSession, getSession } from "../lib/adminStore";
import { LogOut, Plus, Trash2, Pencil, Save, Image as ImageIcon, Percent, MapPin, Phone, Link2, ShoppingBag, Shield, Settings, Users, Gift, Upload } from "lucide-react";
import AdminLogin from "./AdminLogin";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function AdminPanel() {
  const [session, setSession] = useState(() => getSession());
  const [tab, setTab] = useState("produtos");
  const [products, setProducts] = useState(() => getProducts());
  const [settings, setSettings] = useState(() => getSettings());
  const [admins, setAdmins] = useState(() => getAdmins());
  const [discounts, setDiscounts] = useState(() => getDiscounts());
  const [toast, setToast] = useState(null);

  // keep in sync with localStorage events from other tabs
  useEffect(() => {
    const h = () => {
      setProducts(getProducts());
      setSettings(getSettings());
      setAdmins(getAdmins());
      setDiscounts(getDiscounts());
    };
    window.addEventListener("boka:products", h);
    window.addEventListener("boka:settings", h);
    window.addEventListener("boka:admins", h);
    window.addEventListener("boka:discounts", h);
    return () => {
      window.removeEventListener("boka:products", h);
      window.removeEventListener("boka:settings", h);
      window.removeEventListener("boka:admins", h);
      window.removeEventListener("boka:discounts", h);
    };
  }, []);
  // hidrata do SQL se /api estiver vivo
  useEffect(() => {
    import("../lib/adminStore").then(m => {
      m.fetchProductsFromSql().then(d=> d && setProducts(d)).catch(()=>{});
      m.fetchSettingsFromSql().then(d=> d && setSettings(d)).catch(()=>{});
      m.fetchAdminsFromSql().then(d=> d && setAdmins(d)).catch(()=>{});
      m.fetchDiscountsFromSql().then(d=> d && setDiscounts(d)).catch(()=>{});
    });
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!session) {
    return <AdminLogin onSuccess={(a) => setSession({ email: a.email, name: a.name, id: a.id })} />;
  }

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
        {/* tabs */}
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: "produtos", label: "Produtos", icon: ShoppingBag },
              { id: "descontos", label: "Descontos", icon: Percent },
              { id: "config", label: "Loja", icon: Settings },
              { id: "logo", label: "Logo", icon: ImageIcon },
              { id: "admins", label: "Admins", icon: Users },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 transition ${tab===t.id ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {tab === "produtos" && <ProdutosTab products={products} setProducts={setProducts} showToast={showToast} />}
        {tab === "descontos" && <DescontosTab products={products} discounts={discounts} setDiscounts={setDiscounts} showToast={showToast} />}
        {tab === "config" && <ConfigTab settings={settings} setSettings={setSettings} showToast={showToast} />}
        {tab === "logo" && <LogoTab settings={settings} setSettings={setSettings} showToast={showToast} />}
        {tab === "admins" && <AdminsTab admins={admins} setAdmins={setAdmins} showToast={showToast} />}
      </main>

      {toast && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

// ---------------- Produtos ----------------
function ProdutosTab({ products, setProducts, showToast }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", desc: "", price: "", category: "Clássicos", image: "", badge: "Clássico", popular: false });
  const [imageMode, setImageMode] = useState("url"); // url | upload
  const categories = useMemo(() => [...new Set(products.map(p=>p.category))], [products]);

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

  const handleDelete = (id) => {
    if (!confirm("Remover este produto?")) return;
    const next = products.filter(p=>p.id!==id);
    saveProducts(next); setProducts(next); showToast("Removido");
  };

  const onFile = async (file) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setForm(f=>({ ...f, image: url }));
  };

  return (
    <div className="space-y-6">
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

// ---------------- Descontos ----------------
function DescontosTab({ products, discounts, setDiscounts, showToast }) {
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
    if (!confirm("Remover desconto?")) return;
    try { await fetch(`/api/discounts/${id}`, { method: "DELETE" }); } catch {}
    const next = discounts.filter(d=>d.id!==id);
    saveDiscounts(next); setDiscounts(next); showToast("Removido");
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
    const data = await fileToDataUrl(file);
    setLogo(data);
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
function AdminsTab({ admins, setAdmins, showToast }) {
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
    if (!confirm("Remover este admin?")) return;
    try {
      removeAdmin(id);
      setAdmins(getAdmins());
      showToast("Admin removido");
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
