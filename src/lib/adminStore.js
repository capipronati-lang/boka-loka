import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_ADMINS, DEFAULT_DISCOUNTS } from "./defaultData";
import * as sqlBrowser from "./sqlBrowser.js";

const API = "/api";
const KEYS = {
  PRODUCTS: "boka_products",
  SETTINGS: "boka_settings",
  ADMINS: "boka_admins",
  DISCOUNTS: "boka_discounts",
  SESSION: "boka_admin_session",
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
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new Event("boka:products"));
  apiSend("/products/bulk", "POST", products).catch(() => {});
  // SQL no navegador (grátis) — espelha também
  sqlBrowser.sqlSaveProducts(products).catch(()=>{});
}
export async function fetchProductsFromSql() {
  const data = await apiGet("/products");
  if (Array.isArray(data) && data.length) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data));
    window.dispatchEvent(new Event("boka:products"));
    return data;
  }
  // fallback SQL no navegador (100% grátis)
  const browser = await tryBrowserSqlGet("products");
  if (Array.isArray(browser) && browser.length) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(browser));
    window.dispatchEvent(new Event("boka:products"));
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
  return { ...DEFAULT_SETTINGS, ...parsed };
}
export function saveSettings(settings) {
  const merged = { ...getSettings(), ...settings };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  window.dispatchEvent(new Event("boka:settings"));
  apiSend("/settings", "PUT", merged).catch(() => {});
  sqlBrowser.sqlSaveSettings(merged).catch(()=>{});
  return merged;
}
export async function fetchSettingsFromSql() {
  const data = await apiGet("/settings");
  if (data && data.address) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...data }));
    window.dispatchEvent(new Event("boka:settings"));
    return data;
  }
  const browser = await tryBrowserSqlGet("settings");
  if (browser && browser.address) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...browser }));
    window.dispatchEvent(new Event("boka:settings"));
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
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(data));
    window.dispatchEvent(new Event("boka:admins"));
    return data;
  }
  const browser = await tryBrowserSqlGet("admins");
  if (Array.isArray(browser) && browser.length) {
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(browser));
    window.dispatchEvent(new Event("boka:admins"));
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
    localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(data));
    window.dispatchEvent(new Event("boka:discounts"));
    return data;
  }
  const browser = await tryBrowserSqlGet("discounts");
  if (Array.isArray(browser)) {
    localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(browser));
    window.dispatchEvent(new Event("boka:discounts"));
    return browser;
  }
  return null;
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
    ]);
  } catch {}
}
