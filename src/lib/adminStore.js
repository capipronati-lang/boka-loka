import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_ADMINS, DEFAULT_DISCOUNTS, DEFAULT_ACCOUNTS } from "./defaultData";
import * as sqlBrowser from "./sqlBrowser.js";

const API = "/api";
const KEYS = {
  PRODUCTS: "boka_products",
  SETTINGS: "boka_settings",
  ADMINS: "boka_admins",
  DISCOUNTS: "boka_discounts",
  ACCOUNTS: "boka_accounts",
  ORDERS: "boka_orders",
  SESSION: "boka_admin_session",
  DELETED_HISTORY: "boka_deleted_products_history",
};

// SQL no navegador (100% grátis) — usa sql.js + localStorage, sem servidor
async function tryBrowserSqlGet(type) {
  try {
    if (type === "products") return await sqlBrowser.sqlGetProducts();
    if (type === "settings") return await sqlBrowser.sqlGetSettings();
    if (type === "admins") return await sqlBrowser.sqlGetAdmins();
    if (type === "discounts") return await sqlBrowser.sqlGetDiscounts();
  } catch { return null; }
  return null;
}

// tenta API SQL, se falhar usa localStorage (fallback para hospedagem estática)
async function apiGet(path) {
  try {
    const r = await fetch(`${API}${path}`, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    return null;
  }
}
async function apiSend(path, method, body) {
  try {
    const r = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json().catch(() => ({}));
  } catch (e) {
    return null;
  }
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

// PRODUCTS
export function getProducts() {
  const raw = localStorage.getItem(KEYS.PRODUCTS);
  if (!raw) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  const parsed = safeParse(raw, DEFAULT_PRODUCTS);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCTS;
}
export function saveProducts(products) {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event("boka:products"));
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.message.includes("quota")) {
      alert("Erro: imagens muito grandes. Use URL ou imagens menores (máx 800px). Tente novamente com imagem menor.");
      throw e;
    }
    throw e;
  }
  apiSend("/products/bulk", "POST", products).catch(() => {});
  sqlBrowser.sqlSaveProducts(products).catch((e)=> console.warn("sqlBrowser saveProducts falhou", e));
}
export async function softDeleteProduct(id) {
  // guarda snapshot para histórico local (fallback 100% Vercel estático)
  let deletedProduct = null;
  try {
    const all = getProducts();
    deletedProduct = all.find(p=>p.id===id) || null;
  } catch {}
  await apiSend(`/products/${id}`, "DELETE").catch(()=>{});
  await sqlBrowser.sqlSoftDeleteProduct(id).catch(()=>{});
  try {
    const products = getProducts().filter(p=>p.id!==id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event("boka:products"));
  } catch {}
  // fallback histórico em localStorage (30 dias) - garante que vai para Histórico mesmo sem SQL
  try {
    if (deletedProduct) {
      const history = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
      const entry = { ...deletedProduct, deletedAt: new Date().toISOString(), deleted: true };
      // evita duplicatas
      const filtered = history.filter(h=>h.id!==id);
      filtered.unshift(entry);
      // mantém apenas últimos 100 e dentro de 30 dias (limpeza leve)
      const THIRTY = 30*24*60*60*1000;
      const now = Date.now();
      const cleaned = filtered.filter(h=> h.deletedAt && (now - new Date(h.deletedAt).getTime()) <= THIRTY*2).slice(0, 100);
      localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(cleaned));
      window.dispatchEvent(new Event("boka:deleted_history"));
    }
  } catch {}
}
export async function fetchProductsFromSql() {
  const data = await apiGet("/products");
  if (Array.isArray(data) && data.length) {
    try { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data)); window.dispatchEvent(new Event("boka:products")); } catch {}
    return data;
  }
  // fallback SQL no navegador (100% grátis) — só hidrata se localStorage vazio
  const hasLocal = localStorage.getItem(KEYS.PRODUCTS);
  if (hasLocal) return null; // não sobrescreve dados já salvos pelo usuário
  const browser = await tryBrowserSqlGet("products");
  if (Array.isArray(browser) && browser.length) {
    try { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(browser)); window.dispatchEvent(new Event("boka:products")); } catch {}
    return browser;
  }
  return null;
}

// SETTINGS
export function getSettings() {
  const raw = localStorage.getItem(KEYS.SETTINGS);
  if (!raw) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  const parsed = safeParse(raw, DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...parsed };
  // migração automática para nova logo 202109040734_VqXG_i.avif (troca svg antigo)
  if (merged.logo === "/boka-loka-logo.svg" || merged.logo === "boka-loka-logo.svg") {
    merged.logo = "/logo-nova.avif";
    try { localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged)); } catch {}
  }
  // migração: 554836223376 é fixo e NÃO está no WhatsApp (erro "não está no WhatsApp") -> troca para móvel real
  if (merged.whatsappNumber && merged.whatsappNumber.replace(/\D/g,"") === "554836223376") {
    merged.whatsappNumber = "5548988452532";
    try { localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged)); } catch {}
  }
  return merged;
}
export function saveSettings(settings) {
  const merged = { ...getSettings(), ...settings };
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
    window.dispatchEvent(new Event("boka:settings"));
  } catch (e) {
    if (e.name === "QuotaExceededError" || String(e.message).includes("quota")) {
      alert("Logo muito grande. Use URL ou imagem menor (recomendado SVG ou PNG < 200KB).");
      throw e;
    }
    throw e;
  }
  apiSend("/settings", "PUT", merged).catch(() => {});
  sqlBrowser.sqlSaveSettings(merged).catch(()=>{});
  return merged;
}
export async function fetchSettingsFromSql() {
  const data = await apiGet("/settings");
  if (data && data.address) {
    try { localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...data })); window.dispatchEvent(new Event("boka:settings")); } catch {}
    return data;
  }
  const hasLocal = localStorage.getItem(KEYS.SETTINGS);
  if (hasLocal) return null;
  const browser = await tryBrowserSqlGet("settings");
  if (browser && browser.address) {
    try { localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...browser })); window.dispatchEvent(new Event("boka:settings")); } catch {}
    return browser;
  }
  return null;
}

// ADMINS
export function getAdmins() {
  const raw = localStorage.getItem(KEYS.ADMINS);
  if (!raw) {
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(DEFAULT_ADMINS));
    return DEFAULT_ADMINS;
  }
  const parsed = safeParse(raw, DEFAULT_ADMINS);
  return Array.isArray(parsed) ? parsed : DEFAULT_ADMINS;
}
export function saveAdmins(admins) {
  localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
  window.dispatchEvent(new Event("boka:admins"));
}
export async function fetchAdminsFromSql() {
  const data = await apiGet("/admins");
  if (Array.isArray(data) && data.length) {
    try { localStorage.setItem(KEYS.ADMINS, JSON.stringify(data)); window.dispatchEvent(new Event("boka:admins")); } catch {}
    return data;
  }
  const hasLocal = localStorage.getItem(KEYS.ADMINS);
  if (hasLocal) return null;
  const browser = await tryBrowserSqlGet("admins");
  if (Array.isArray(browser) && browser.length) {
    try { localStorage.setItem(KEYS.ADMINS, JSON.stringify(browser)); window.dispatchEvent(new Event("boka:admins")); } catch {}
    return browser;
  }
  return null;
}
export function addAdmin({ email, password, name }) {
  const admins = getAdmins();
  if (admins.find((a) => a.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("E-mail já cadastrado");
  }
  const newAdmin = {
    id: Date.now().toString(),
    email,
    password,
    name: name || email.split("@")[0],
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  const next = [...admins, newAdmin];
  saveAdmins(next);
  apiSend("/admins", "POST", { email, password, name: newAdmin.name }).catch(() => {});
  sqlBrowser.sqlAddAdmin({ email, password, name: newAdmin.name }).catch(()=>{});
  return newAdmin;
}
export function removeAdmin(id) {
  const admins = getAdmins();
  if (admins.length <= 1) throw new Error("Mantenha ao menos 1 admin");
  const next = admins.filter((a) => a.id !== id);
  saveAdmins(next);
  apiSend(`/admins/${id}`, "DELETE").catch(() => {});
  sqlBrowser.sqlRemoveAdmin(id).catch(()=>{});
}

// ACCOUNTS (contas de clientes)
export function getAccounts() {
  const raw = localStorage.getItem(KEYS.ACCOUNTS);
  if (!raw) {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  const parsed = safeParse(raw, DEFAULT_ACCOUNTS);
  return Array.isArray(parsed) ? parsed : DEFAULT_ACCOUNTS;
}
export function saveAccounts(accounts) {
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  window.dispatchEvent(new Event("boka:accounts"));
}
export async function fetchAccountsFromSql() {
  const data = await apiGet("/accounts");
  if (Array.isArray(data)) {
    try { localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(data)); window.dispatchEvent(new Event("boka:accounts")); } catch {}
    return data;
  }
  const hasLocal = localStorage.getItem(KEYS.ACCOUNTS);
  if (hasLocal) return null;
  const browser = await sqlBrowser.sqlGetAccounts().catch(()=>null);
  if (Array.isArray(browser)) {
    try { localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(browser)); window.dispatchEvent(new Event("boka:accounts")); } catch {}
    return browser;
  }
  return null;
}
export function addAccount({ name, email, phone, password }) {
  const accounts = getAccounts();
  if (accounts.find(a=> a.email.toLowerCase()===email.toLowerCase())) throw new Error("E-mail já cadastrado");
  const acc = { id: Date.now().toString(), name, email, phone: phone||"", password: password||"", createdAt: new Date().toISOString() };
  const next = [...accounts, acc];
  saveAccounts(next);
  apiSend("/accounts", "POST", acc).catch(()=>{});
  sqlBrowser.sqlAddAccount({ name, email, phone, password }).catch(()=>{});
  return acc;
}
export function updateAccount(id, patch) {
  const accounts = getAccounts();
  const next = accounts.map(a=> a.id===id ? { ...a, ...patch } : a);
  saveAccounts(next);
  apiSend(`/accounts/${id}`, "PUT", patch).catch(()=>{});
  sqlBrowser.sqlUpdateAccount(id, patch).catch(()=>{});
  return next.find(a=>a.id===id);
}
export function removeAccount(id) {
  const next = getAccounts().filter(a=>a.id!==id);
  saveAccounts(next);
  apiSend(`/accounts/${id}`, "DELETE").catch(()=>{});
  sqlBrowser.sqlRemoveAccount(id).catch(()=>{});
}

// DISCOUNTS
export function getDiscounts() {
  const raw = localStorage.getItem(KEYS.DISCOUNTS);
  if (!raw) {
    localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(DEFAULT_DISCOUNTS));
    return DEFAULT_DISCOUNTS;
  }
  return safeParse(raw, DEFAULT_DISCOUNTS) || [];
}
export function saveDiscounts(discounts) {
  localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(discounts));
  window.dispatchEvent(new Event("boka:discounts"));
  // SQL sync é feito por chamadas individuais (POST/PUT/DELETE) no painel
}
export async function fetchDiscountsFromSql() {
  const data = await apiGet("/discounts");
  if (Array.isArray(data)) {
    try { localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(data)); window.dispatchEvent(new Event("boka:discounts")); } catch {}
    return data;
  }
  const hasLocal = localStorage.getItem(KEYS.DISCOUNTS);
  if (hasLocal) return null;
  const browser = await tryBrowserSqlGet("discounts");
  if (Array.isArray(browser)) {
    try { localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(browser)); window.dispatchEvent(new Event("boka:discounts")); } catch {}
    return browser;
  }
  return null;
}

// ORDERS - pedidos com pagamento
export function getOrdersLocal() {
  const raw = localStorage.getItem(KEYS.ORDERS);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}
export function saveOrdersLocal(orders) {
  try { localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)); window.dispatchEvent(new Event("boka:orders")); } catch {}
}
export async function fetchOrdersFromSql() {
  const data = await apiGet("/orders");
  if (Array.isArray(data)) {
    try { localStorage.setItem(KEYS.ORDERS, JSON.stringify(data)); window.dispatchEvent(new Event("boka:orders")); } catch {}
    return data;
  }
  try {
    const browser = await sqlBrowser.sqlGetOrders();
    if (Array.isArray(browser) && browser.length) {
      try { localStorage.setItem(KEYS.ORDERS, JSON.stringify(browser)); window.dispatchEvent(new Event("boka:orders")); } catch {}
      return browser;
    }
  } catch {}
  // fallback localStorage puro
  const local = getOrdersLocal();
  if (local.length) return local;
  return [];
}
export async function createOrder(payload) {
  // tenta API
  const apiRes = await apiSend("/orders", "POST", payload);
  if (apiRes && apiRes.id) {
    // sincroniza local
    const local = getOrdersLocal();
    local.unshift(apiRes);
    saveOrdersLocal(local);
    try { await sqlBrowser.sqlCreateOrder(payload).catch(()=>{}); } catch {}
    return apiRes;
  }
  // fallback sqlBrowser (100% gratuito)
  try {
    const browserRes = await sqlBrowser.sqlCreateOrder(payload);
    if (browserRes && browserRes.id) {
      const local = getOrdersLocal();
      local.unshift(browserRes);
      saveOrdersLocal(local);
      return browserRes;
    }
  } catch (e) { console.warn("sqlCreateOrder falhou", e); }
  // último fallback: só localStorage (gera mock pix local)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6).toUpperCase();
  const now = new Date().toISOString();
  const pm = (payload.paymentMethod||"pix").toLowerCase();
  let pixCode=null, pixQr=null, pixTxId=null, status = pm==="pix" ? "pending_pix" : "pending";
  if (pm==="pix") {
    const amount = Number(payload.total).toFixed(2);
    const txId = `BOKA${id.slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    pixCode = `00020126360014BR.GOV.BCB.PIX0114+5548988452532${amount}5802BR5913Boka Loka6008Tubarao62070503${txId.slice(0,3)}6304ABCD`;
    pixQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
    pixTxId = txId;
  }
  const order = {
    id, customerName: payload.customerName, customerPhone: payload.customerPhone, customerAddress: payload.customerAddress||"",
    customerCpf: (payload.customerCpf||"").replace(/\D/g,""), items: payload.items, total: Number(payload.total),
    paymentMethod: pm, status, pixCode, pixQr, pixTxId, createdAt: now, paidAt: null, confirmedAt: null,
  };
  const local = getOrdersLocal();
  local.unshift(order);
  saveOrdersLocal(local);
  return order;
}
export async function verifyPixOrder(id, forcePaid=false) {
  // tenta API
  const apiRes = await apiSend(`/orders/${id}/verify-pix${forcePaid ? "?forcePaid=true" : ""}`, "POST", forcePaid? { forcePaid: true } : undefined);
  if (apiRes && apiRes.id !== undefined) {
    // atualiza local
    const local = getOrdersLocal();
    const idx = local.findIndex(o=>o.id===id);
    if (idx>=0) { local[idx] = { ...local[idx], ...apiRes }; saveOrdersLocal(local); }
    // também tenta atualizar sqlBrowser se API não atualizou browser
    try { if (forcePaid) await sqlBrowser.sqlVerifyPix(id, true); } catch {}
    return apiRes;
  }
  // fallback sqlBrowser
  try {
    const browserRes = await sqlBrowser.sqlVerifyPix(id, forcePaid);
    if (browserRes) {
      const local = getOrdersLocal();
      const idx = local.findIndex(o=>o.id===id);
      if (idx>=0) { local[idx] = { ...local[idx], ...browserRes }; saveOrdersLocal(local); } else { local.unshift(browserRes); saveOrdersLocal(local); }
      return browserRes;
    }
  } catch {}
  // fallback localStorage
  const local = getOrdersLocal();
  const idx = local.findIndex(o=>o.id===id);
  if (idx>=0) {
    const order = local[idx];
    if (forcePaid && order.paymentMethod==="pix" && order.status!=="paid" && order.status!=="confirmed") {
      order.status = "paid"; order.paidAt = new Date().toISOString();
      local[idx]=order; saveOrdersLocal(local);
      return { ...order, verified:true };
    }
    return { ...order, verified: order.status==="paid"||order.status==="confirmed" };
  }
  return null;
}
export async function updateOrderStatus(id, status) {
  const apiRes = await apiSend(`/orders/${id}/status`, "PUT", { status });
  if (apiRes && apiRes.id) {
    const local = getOrdersLocal();
    const idx = local.findIndex(o=>o.id===id);
    if (idx>=0) { local[idx]=apiRes; saveOrdersLocal(local); }
    try { await sqlBrowser.sqlUpdateOrderStatus(id, status); } catch {}
    return apiRes;
  }
  try {
    const browserRes = await sqlBrowser.sqlUpdateOrderStatus(id, status);
    if (browserRes) {
      const local = getOrdersLocal();
      const idx = local.findIndex(o=>o.id===id);
      if (idx>=0) { local[idx]=browserRes; saveOrdersLocal(local); } else { local.unshift(browserRes); saveOrdersLocal(local); }
      return browserRes;
    }
  } catch {}
  const local = getOrdersLocal();
  const idx = local.findIndex(o=>o.id===id);
  if (idx>=0) {
    local[idx].status = status;
    if (status==="paid" && !local[idx].paidAt) local[idx].paidAt = new Date().toISOString();
    if (status==="confirmed" && !local[idx].confirmedAt) local[idx].confirmedAt = new Date().toISOString();
    saveOrdersLocal(local);
    return local[idx];
  }
  return null;
}
export async function getOrderById(id) {
  const apiRes = await apiGet(`/orders/${id}`);
  if (apiRes && apiRes.id) return apiRes;
  try { const b = await sqlBrowser.sqlGetOrder(id); if (b) return b; } catch {}
  const local = getOrdersLocal();
  return local.find(o=>o.id===id) || null;
}

// SESSION
export function getSession() {
  const raw = localStorage.getItem(KEYS.SESSION);
  if (!raw) return null;
  return safeParse(raw, null);
}
export function saveSession(admin) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify({ email: admin.email, id: admin.id, name: admin.name, loginAt: new Date().toISOString() }));
}
export function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}
export async function login(email, password) {
  // 1) tenta API SQL (servidor Node)
  const sqlRes = await apiSend("/admins/login", "POST", { email, password });
  if (sqlRes && sqlRes.email) {
    saveSession(sqlRes);
    fetchAdminsFromSql().catch(()=>{});
    return sqlRes;
  }
  // 2) tenta SQL no navegador (grátis, sql.js)
  try {
    const browserRes = await sqlBrowser.sqlLogin(email, password);
    if (browserRes && browserRes.email) {
      saveSession(browserRes);
      return browserRes;
    }
  } catch {}
  // 3) fallback localStorage
  const admins = getAdmins();
  const found = admins.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
  if (!found) throw new Error("E-mail ou senha inválidos");
  saveSession(found);
  return found;
}
export function logout() {
  clearSession();
}

export function getDiscountedPrice(product, discounts) {
  if (!discounts || discounts.length === 0) return product.price;
  let best = 0;
  for (const d of discounts) {
    if (!d.active && d.active !== undefined && !d.active) continue;
    // sqlite retorna active como 0/1, já normalizado para boolean em fetch, mas fallback local pode ser boolean
    const isActive = d.active === undefined ? true : !!d.active;
    if (!isActive) continue;
    const appliesToProduct = !d.productId || d.productId === product.id;
    const appliesToCategory = !d.category || d.category === "Todos" || d.category === product.category;
    if (d.productId ? appliesToProduct : appliesToCategory) {
      if (d.percent > best) best = d.percent;
    }
  }
  if (best <= 0) return product.price;
  return Number((product.price * (1 - best / 100)).toFixed(2));
}

// carregamento inicial SQL -> localStorage (chamado no App mount)
export async function hydrateFromSql() {
  try {
    await Promise.all([
      fetchProductsFromSql(),
      fetchSettingsFromSql(),
      fetchAdminsFromSql(),
      fetchDiscountsFromSql(),
      fetchAccountsFromSql(),
      fetchOrdersFromSql().catch(()=>{}),
    ]);
  } catch {}
}

// helpers histórico local
export function getDeletedHistoryLocal() {
  const raw = localStorage.getItem(KEYS.DELETED_HISTORY);
  const parsed = safeParse(raw, []) || [];
  const THIRTY = 30*24*60*60*1000;
  const now = Date.now();
  // retorna apenas últimos 30 dias
  return parsed.filter(p=> p.deletedAt && (now - new Date(p.deletedAt).getTime()) <= THIRTY);
}
export function clearDeletedHistoryLocal() {
  try { localStorage.removeItem(KEYS.DELETED_HISTORY); } catch {}
}

// LIXEIRA — ver apagados e recuperar (SQL)
export async function getTrash() {
  const apiData = await apiGet("/trash");
  if (apiData) {
    // mescla com histórico local se API não tiver produtos (caso Vercel estático sem /api)
    try {
      const local = getDeletedHistoryLocal();
      if (local.length && (!apiData.products || apiData.products.length===0)) {
        apiData.products = local;
        apiData.productsLast30 = local;
      } else if (local.length && apiData.products) {
        // mescla evitando duplicatas (prioriza API)
        const ids = new Set(apiData.products.map(p=>p.id));
        const missing = local.filter(p=>!ids.has(p.id));
        if (missing.length) {
          apiData.products = [...apiData.products, ...missing];
          apiData.productsLast30 = [...(apiData.productsLast30||[]), ...missing.filter(p=> (Date.now()-new Date(p.deletedAt).getTime())<=30*24*60*60*1000)];
        }
      }
    } catch {}
    return apiData;
  }
  try {
    const sql = await sqlBrowser.sqlGetTrash();
    // mescla histórico local como fallback
    try {
      const local = getDeletedHistoryLocal();
      if (local.length) {
        const ids = new Set((sql.products||[]).map(p=>p.id));
        const missing = local.filter(p=>!ids.has(p.id));
        if (missing.length) {
          sql.products = [...(sql.products||[]), ...missing];
          sql.productsLast30 = [...(sql.productsLast30||[]), ...missing];
        }
      }
    } catch {}
    return sql;
  } catch { 
    // último fallback: só histórico local
    const local = getDeletedHistoryLocal();
    return { products: local, productsLast30: local, admins: [], discounts: [], accounts: [] }; 
  }
}
export async function restoreTrash(type, id) {
  const apiRes = await apiSend(`/trash/restore/${type}/${id}`, "POST");
  if (apiRes !== null) {
    await hydrateFromSql();
    // remove do histórico local
    try {
      const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
      localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
    } catch {}
    return apiRes;
  }
  await sqlBrowser.sqlRestore(type, id).catch(()=>{});
  // restaura no localStorage de produtos
  try {
    const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
    const found = h.find(x=>x.id===id);
    if (found && type==="products") {
      const prods = getProducts();
      if (!prods.find(p=>p.id===id)) {
        const restored = { ...found }; delete restored.deleted; delete restored.deletedAt;
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([...prods, restored]));
        window.dispatchEvent(new Event("boka:products"));
      }
    }
    localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
    window.dispatchEvent(new Event("boka:deleted_history"));
  } catch {}
  await hydrateFromSql().catch(()=>{});
}
export async function hardDeleteTrash(type, id) {
  const apiRes = await apiSend(`/trash/${type}/${id}`, "DELETE");
  if (apiRes !== null) {
    // também limpa histórico local
    try {
      if (type==="products") {
        const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
        localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
      }
    } catch {}
    return apiRes;
  }
  await sqlBrowser.sqlHardDelete(type, id);
  try {
    if (type==="products") {
      const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
      localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
      window.dispatchEvent(new Event("boka:deleted_history"));
    }
  } catch {}
}
export async function clearTrash() {
  const apiRes = await apiSend("/trash/clear", "DELETE");
  if (apiRes !== null) {
    try { localStorage.removeItem(KEYS.DELETED_HISTORY); } catch {}
    return apiRes;
  }
  await sqlBrowser.sqlClearTrash();
  try { localStorage.removeItem(KEYS.DELETED_HISTORY); } catch {}
}

// HISTÓRICO DE PRODUTOS EXCLUÍDOS (últimos 30 dias)
export async function getDeletedProductsHistory() {
  const apiData = await apiGet("/products/deleted/history");
  if (Array.isArray(apiData)) return apiData;
  const apiData2 = await apiGet("/products/deleted");
  if (apiData2 && Array.isArray(apiData2.history)) return apiData2.history;
  if (apiData2 && Array.isArray(apiData2)) return apiData2;
  try { return await sqlBrowser.sqlGetDeletedProductsHistory(); } catch { return []; }
}
export async function restoreProduct(id) {
  const apiRes = await apiSend(`/products/${id}/restore`, "POST");
  if (apiRes !== null) {
    try {
      const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
      localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
    } catch {}
    await hydrateFromSql();
    return apiRes;
  }
  await sqlBrowser.sqlRestoreProduct(id).catch(()=>{});
  try {
    const h = safeParse(localStorage.getItem(KEYS.DELETED_HISTORY), []) || [];
    const found = h.find(x=>x.id===id);
    if (found) {
      const prods = getProducts();
      if (!prods.find(p=>p.id===id)) {
        const restored = { ...found }; delete restored.deleted; delete restored.deletedAt;
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([...prods, restored]));
        window.dispatchEvent(new Event("boka:products"));
      }
    }
    localStorage.setItem(KEYS.DELETED_HISTORY, JSON.stringify(h.filter(x=>x.id!==id)));
    window.dispatchEvent(new Event("boka:deleted_history"));
  } catch {}
  await hydrateFromSql().catch(()=>{});
}
export async function purgeExpiredProducts() {
  const apiRes = await apiSend("/products/purge-expired", "POST");
  if (apiRes !== null) return apiRes;
  try { return await sqlBrowser.sqlPurgeExpiredProducts(); } catch { return 0; }
}
export function filterProductsLast30Days(products) {
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  return (products || []).filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) <= THIRTY);
}
