// SQLite no navegador via sql.js — 100% grátis, sem servidor, persiste no localStorage
// Banco SQL real (SQLite) rodando no browser, salvo como base64 em localStorage:boka_sql_db
import initSqlJs from "sql.js";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_ADMINS, DEFAULT_DISCOUNTS } from "./defaultData";

const STORAGE_KEY = "boka_sql_db";
let SQL = null;
let db = null;

async function getSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });
  return SQL;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const b64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(STORAGE_KEY, b64);
}

async function getDb() {
  if (db) return db;
  const SQL = await getSql();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const buf = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
      db = new SQL.Database(buf);
      // migração whatsapp antigo já salvo no sql.js localStorage
      try {
        const cur = db.exec("SELECT whatsappNumber FROM settings WHERE id=1");
        const curNum = cur[0]?.values[0]?.[0];
        if (curNum && String(curNum).replace(/\D/g,"") === "554836223376") {
          db.run("UPDATE settings SET whatsappNumber=? WHERE id=1", ["5548988452532"]);
          saveDb();
        }
      } catch {}
      return db;
    } catch {}
  }
  db = new SQL.Database();
  // cria tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      image TEXT,
      badge TEXT,
      popular INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      address TEXT,
      gmapsLink TEXT,
      phoneDisplay TEXT,
      phoneTel TEXT,
      whatsappNumber TEXT,
      instagramUrl TEXT,
      ifoodUrl TEXT,
      logo TEXT,
      openHour INTEGER,
      closeHour INTEGER,
      heroTitle TEXT,
      heroSubtitle TEXT,
      pixKey TEXT,
      pixKeyType TEXT,
      pixHolder TEXT,
      pixCity TEXT
    );
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'admin',
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      percent REAL NOT NULL,
      category TEXT,
      productId TEXT,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerPhone TEXT,
      customerAddress TEXT,
      customerCpf TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      pixCode TEXT,
      pixQr TEXT,
      pixTxId TEXT,
      mpPaymentId TEXT,
      createdAt TEXT NOT NULL,
      paidAt TEXT,
      confirmedAt TEXT
    );
  `);
  // migração lixeira
  for (const tbl of ["products","admins","discounts","accounts"]) {
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN deleted INTEGER DEFAULT 0`); } catch {}
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN deletedAt TEXT`); } catch {}
  }
  // migração pix key
  try { db.exec(`ALTER TABLE settings ADD COLUMN pixKey TEXT`); } catch {}
  try { db.exec(`ALTER TABLE settings ADD COLUMN pixKeyType TEXT`); } catch {}
  try { db.exec(`ALTER TABLE settings ADD COLUMN pixHolder TEXT`); } catch {}
  try { db.exec(`ALTER TABLE settings ADD COLUMN pixCity TEXT`); } catch {}
  // seed se vazio
  const prodCount = db.exec("SELECT COUNT(*) as c FROM products")[0]?.values[0]?.[0] || 0;
  if (prodCount === 0) {
    const stmt = db.prepare("INSERT INTO products (id, name, description, price, category, image, badge, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const p of DEFAULT_PRODUCTS) {
      stmt.run([p.id, p.name, p.desc || p.description, p.price, p.category, p.image, p.badge, p.popular ? 1 : 0]);
    }
    stmt.free();
  }
  const setCount = db.exec("SELECT COUNT(*) as c FROM settings WHERE id=1")[0]?.values[0]?.[0] || 0;
  if (setCount === 0) {
    const s = DEFAULT_SETTINGS;
    db.run("INSERT INTO settings (id, address, gmapsLink, phoneDisplay, phoneTel, whatsappNumber, instagramUrl, ifoodUrl, logo, openHour, closeHour, heroTitle, heroSubtitle, pixKey, pixKeyType, pixHolder, pixCity) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [s.address, s.gmapsLink, s.phoneDisplay, s.phoneTel, s.whatsappNumber, s.instagramUrl, s.ifoodUrl, s.logo, s.openHour, s.closeHour, s.heroTitle, s.heroSubtitle, s.pixKey||"5548988452532", s.pixKeyType||"phone", s.pixHolder||"Boka Loka Lanches", s.pixCity||"Tubarao"]);
  } else {
    // garante pixKey preenchido se vazio
    try {
      const cur = db.exec("SELECT pixKey FROM settings WHERE id=1")[0]?.values[0]?.[0];
      if (!cur) {
        db.run("UPDATE settings SET pixKey=?, pixKeyType=?, pixHolder=?, pixCity=? WHERE id=1",
          [DEFAULT_SETTINGS.pixKey||"5548988452532", DEFAULT_SETTINGS.pixKeyType||"phone", DEFAULT_SETTINGS.pixHolder||"Boka Loka Lanches", DEFAULT_SETTINGS.pixCity||"Tubarao"]);
      }
    } catch {}
  }
  const adminCount = db.exec("SELECT COUNT(*) as c FROM admins")[0]?.values[0]?.[0] || 0;
  if (adminCount === 0) {
    const stmt = db.prepare("INSERT INTO admins (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
    for (const a of DEFAULT_ADMINS) stmt.run([a.id, a.email, a.password, a.name, a.role, a.createdAt]);
    stmt.free();
  }
  saveDb();
  return db;
}

// Helpers para converter linhas
function rowToProduct(row) {
  // row é array de valores na ordem SELECT * (10 colunas com deleted, deletedAt)
  const [id, name, description, price, category, image, badge, popular, deleted, deletedAt] = row;
  return { id, name, desc: description, description, price, category, image, badge, popular: !!popular, deleted: !!deleted, deletedAt: deletedAt || null };
}
function rowToProductWithTrash(row) {
  const base = rowToProduct(row);
  const deletedAt = base.deletedAt;
  let daysRemaining = null;
  let isExpired = false;
  if (deletedAt) {
    const diff = Date.now() - new Date(deletedAt).getTime();
    daysRemaining = Math.max(0, 30 - Math.floor(diff / (1000*60*60*24)));
    isExpired = diff > 30*24*60*60*1000;
  }
  return { ...base, daysRemaining, isExpired };
}

export async function sqlGetProducts() {
  const db = await getDb();
  const res = db.exec("SELECT * FROM products WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  if (!res[0]) return [];
  return res[0].values.map(rowToProduct);
}
export async function sqlGetProductsAll() {
  const db = await getDb();
  const res = db.exec("SELECT * FROM products ORDER BY rowid");
  if (!res[0]) return [];
  return res[0].values.map(rowToProduct);
}
export async function sqlGetTrash() {
  const db = await getDb();
  const p = db.exec("SELECT * FROM products WHERE deleted=1 ORDER BY deletedAt DESC");
  const a = db.exec("SELECT * FROM admins WHERE deleted=1 ORDER BY deletedAt DESC");
  const d = db.exec("SELECT * FROM discounts WHERE deleted=1 ORDER BY deletedAt DESC");
  const ac = db.exec("SELECT * FROM accounts WHERE deleted=1 ORDER BY deletedAt DESC");
  const products = p[0] ? p[0].values.map(rowToProductWithTrash) : [];
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  const productsLast30 = products.filter(x => x.deletedAt && (now - new Date(x.deletedAt).getTime()) <= THIRTY);
  return {
    products,
    productsLast30,
    admins: a[0] ? a[0].values.map(r => ({ id: r[0], email: r[1], password: r[2], name: r[3], role: r[4], createdAt: r[5], deletedAt: r[7] })) : [],
    discounts: d[0] ? d[0].values.map(r => ({ id: r[0], label: r[1], percent: Number(r[2]), category: r[3], productId: r[4], active: !!r[5], deletedAt: r[7] })) : [],
    accounts: ac[0] ? ac[0].values.map(r => ({ id: r[0], name: r[1], email: r[2], phone: r[3], password: r[4], createdAt: r[5], deletedAt: r[7] })) : [],
  };
}
export async function sqlGetDeletedProductsHistory() {
  const db = await getDb();
  const p = db.exec("SELECT * FROM products WHERE deleted=1 ORDER BY deletedAt DESC");
  const products = p[0] ? p[0].values.map(rowToProductWithTrash) : [];
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  const last30 = products.filter(x => x.deletedAt && (now - new Date(x.deletedAt).getTime()) <= THIRTY);
  return last30;
}
export async function sqlPurgeExpiredProducts() {
  const db = await getDb();
  const cutoff = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  // conta antes
  const before = db.exec(`SELECT COUNT(*) FROM products WHERE deleted=1 AND deletedAt < '${cutoff.replace(/'/g,"''")}'`);
  const count = before[0]?.values[0]?.[0] || 0;
  db.exec(`DELETE FROM products WHERE deleted=1 AND deletedAt < '${cutoff.replace(/'/g,"''")}'`);
  saveDb();
  return count;
}
export async function sqlRestoreProduct(id) {
  const db = await getDb();
  db.run("UPDATE products SET deleted=0, deletedAt=NULL WHERE id=?", [id]);
  saveDb();
}
export async function sqlRestore(type, id) {
  const db = await getDb();
  const allowed = ["products","admins","discounts","accounts"];
  if (!allowed.includes(type)) throw new Error("tipo inválido");
  db.run(`UPDATE ${type} SET deleted=0, deletedAt=NULL WHERE id=?`, [id]);
  saveDb();
}
export async function sqlHardDelete(type, id) {
  const db = await getDb();
  const allowed = ["products","admins","discounts","accounts"];
  if (!allowed.includes(type)) throw new Error("tipo inválido");
  db.run(`DELETE FROM ${type} WHERE id=?`, [id]);
  saveDb();
}
export async function sqlClearTrash() {
  const db = await getDb();
  db.exec("DELETE FROM products WHERE deleted=1");
  db.exec("DELETE FROM admins WHERE deleted=1");
  db.exec("DELETE FROM discounts WHERE deleted=1");
  db.exec("DELETE FROM accounts WHERE deleted=1");
  saveDb();
}
export async function sqlSaveProducts(products) {
  const db = await getDb();
  db.exec("DELETE FROM products WHERE deleted=0 OR deleted IS NULL");
  const stmt = db.prepare("INSERT INTO products (id, name, description, price, category, image, badge, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const p of products) stmt.run([p.id, p.name, p.desc || p.description, Number(p.price), p.category, p.image, p.badge, p.popular ? 1 : 0]);
  stmt.free();
  saveDb();
}
export async function sqlSoftDeleteProduct(id) {
  const db = await getDb();
  db.run("UPDATE products SET deleted=1, deletedAt=? WHERE id=?", [new Date().toISOString(), id]);
  saveDb();
}

export async function sqlGetSettings() {
  const db = await getDb();
  const res = db.exec("SELECT address, gmapsLink, phoneDisplay, phoneTel, whatsappNumber, instagramUrl, ifoodUrl, logo, openHour, closeHour, heroTitle, heroSubtitle, pixKey, pixKeyType, pixHolder, pixCity FROM settings WHERE id=1");
  if (!res[0] || !res[0].values[0]) return null;
  const v = res[0].values[0];
  let whatsappNumber = v[4];
  if (whatsappNumber && String(whatsappNumber).replace(/\D/g,"") === "554836223376") {
    whatsappNumber = "5548988452532";
    try { db.run("UPDATE settings SET whatsappNumber=? WHERE id=1", [whatsappNumber]); saveDb(); } catch {}
  }
  return {
    address: v[0], gmapsLink: v[1], phoneDisplay: v[2], phoneTel: v[3], whatsappNumber,
    instagramUrl: v[5], ifoodUrl: v[6], logo: v[7], openHour: v[8], closeHour: v[9], heroTitle: v[10], heroSubtitle: v[11],
    pixKey: v[12] || DEFAULT_SETTINGS.pixKey || "5548988452532",
    pixKeyType: v[13] || "phone",
    pixHolder: v[14] || "Boka Loka Lanches",
    pixCity: v[15] || "Tubarao",
  };
}
export async function sqlSaveSettings(settings) {
  const db = await getDb();
  const cur = await sqlGetSettings();
  const next = { ...cur, ...settings };
  db.run("UPDATE settings SET address=?, gmapsLink=?, phoneDisplay=?, phoneTel=?, whatsappNumber=?, instagramUrl=?, ifoodUrl=?, logo=?, openHour=?, closeHour=?, heroTitle=?, heroSubtitle=?, pixKey=?, pixKeyType=?, pixHolder=?, pixCity=? WHERE id=1",
    [next.address, next.gmapsLink, next.phoneDisplay, next.phoneTel, next.whatsappNumber, next.instagramUrl, next.ifoodUrl, next.logo, next.openHour, next.closeHour, next.heroTitle, next.heroSubtitle, next.pixKey, next.pixKeyType, next.pixHolder, next.pixCity]);
  saveDb();
  return next;
}

export async function sqlGetAdmins() {
  const db = await getDb();
  const res = db.exec("SELECT id, email, password, name, role, createdAt FROM admins WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  if (!res[0]) return [];
  return res[0].values.map(r => ({ id: r[0], email: r[1], password: r[2], name: r[3], role: r[4], createdAt: r[5] }));
}
export async function sqlAddAdmin({ email, password, name }) {
  const db = await getDb();
  const exists = db.exec(`SELECT 1 FROM admins WHERE lower(email)=lower('${email.replace(/'/g, "''")}')`);
  if (exists[0] && exists[0].values.length) throw new Error("E-mail já cadastrado");
  const id = Date.now().toString();
  db.run("INSERT INTO admins (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [id, email.toLowerCase(), password, name || email.split("@")[0], "admin", new Date().toISOString()]);
  saveDb();
  return { id, email, password, name, role: "admin" };
}
export async function sqlRemoveAdmin(id) {
  const db = await getDb();
  const cnt = db.exec("SELECT COUNT(*) FROM admins WHERE deleted=0 OR deleted IS NULL")[0].values[0][0];
  if (cnt <= 1) throw new Error("Mantenha ao menos 1 admin");
  db.run("UPDATE admins SET deleted=1, deletedAt=? WHERE id=?", [new Date().toISOString(), id]);
  saveDb();
}
export async function sqlLogin(email, password) {
  const db = await getDb();
  const stmt = db.prepare("SELECT id, email, password, name, role FROM admins WHERE lower(email)=lower(?) AND password=?");
  const res = stmt.getAsObject([email, password]);
  stmt.free();
  if (!res || !res.id) throw new Error("E-mail ou senha inválidos");
  return res;
}

export async function sqlGetDiscounts() {
  const db = await getDb();
  const res = db.exec("SELECT id, label, percent, category, productId, active FROM discounts WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  if (!res[0]) return [];
  return res[0].values.map(r => ({ id: r[0], label: r[1], percent: Number(r[2]), category: r[3], productId: r[4], active: !!r[5] }));
}
export async function sqlAddDiscount(payload) {
  const db = await getDb();
  const id = Date.now().toString();
  db.run("INSERT INTO discounts (id, label, percent, category, productId, active) VALUES (?, ?, ?, ?, ?, ?)",
    [id, payload.label, Number(payload.percent), payload.category || "Todos", payload.productId || null, payload.active ? 1 : 0]);
  saveDb();
  return { id, ...payload };
}
export async function sqlUpdateDiscount(id, patch) {
  const db = await getDb();
  const curRes = db.exec(`SELECT label, percent, category, productId, active FROM discounts WHERE id='${id.replace(/'/g,"''")}'`);
  if (!curRes[0] || !curRes[0].values[0]) throw new Error("Desconto não encontrado");
  const cur = curRes[0].values[0];
  const next = {
    label: patch.label ?? cur[0],
    percent: patch.percent ?? cur[1],
    category: patch.category ?? cur[2],
    productId: patch.productId !== undefined ? patch.productId : cur[3],
    active: patch.active !== undefined ? (patch.active ? 1 : 0) : cur[4]
  };
  db.run("UPDATE discounts SET label=?, percent=?, category=?, productId=?, active=? WHERE id=?",
    [next.label, Number(next.percent), next.category, next.productId, next.active, id]);
  saveDb();
}
export async function sqlRemoveDiscount(id) {
  const db = await getDb();
  db.run("UPDATE discounts SET deleted=1, deletedAt=? WHERE id=?", [new Date().toISOString(), id]);
  saveDb();
}

export async function sqlGetAccounts() {
  const db = await getDb();
  const res = db.exec("SELECT id, name, email, phone, password, createdAt FROM accounts WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  if (!res[0]) return [];
  return res[0].values.map(r => ({ id: r[0], name: r[1], email: r[2], phone: r[3], password: r[4], createdAt: r[5] }));
}
export async function sqlAddAccount({ name, email, phone, password }) {
  const db = await getDb();
  const exists = db.exec(`SELECT 1 FROM accounts WHERE lower(email)=lower('${email.replace(/'/g, "''")}')`);
  if (exists[0] && exists[0].values.length) throw new Error("E-mail já cadastrado");
  const id = Date.now().toString();
  db.run("INSERT INTO accounts (id, name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, email.toLowerCase(), phone || "", password || "", new Date().toISOString()]);
  saveDb();
  return { id, name, email, phone };
}
export async function sqlUpdateAccount(id, patch) {
  const db = await getDb();
  const curRes = db.exec(`SELECT name, email, phone, password FROM accounts WHERE id='${id.replace(/'/g,"''")}'`);
  if (!curRes[0] || !curRes[0].values[0]) throw new Error("Conta não encontrada");
  const cur = curRes[0].values[0];
  const next = {
    name: patch.name ?? cur[0],
    email: patch.email ? patch.email.toLowerCase() : cur[1],
    phone: patch.phone ?? cur[2],
    password: patch.password ?? cur[3],
  };
  db.run("UPDATE accounts SET name=?, email=?, phone=?, password=? WHERE id=?",
    [next.name, next.email, next.phone, next.password, id]);
  saveDb();
}
export async function sqlRemoveAccount(id) {
  const db = await getDb();
  db.run("UPDATE accounts SET deleted=1, deletedAt=? WHERE id=?", [new Date().toISOString(), id]);
  saveDb();
}

export async function sqlGetOrders() {
  const db = await getDb();
  const res = db.exec("SELECT * FROM orders ORDER BY datetime(createdAt) DESC");
  if (!res[0]) return [];
  return res[0].values.map(r => ({
    id: r[0], customerName: r[1], customerPhone: r[2], customerAddress: r[3], customerCpf: r[4],
    items: (()=>{ try { return JSON.parse(r[5]); } catch { return []; } })(),
    total: Number(r[6]), paymentMethod: r[7], status: r[8],
    pixCode: r[9], pixQr: r[10], pixTxId: r[11], mpPaymentId: r[12],
    createdAt: r[13], paidAt: r[14], confirmedAt: r[15],
  }));
}
export async function sqlGetOrder(id) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM orders WHERE id=?");
  const row = stmt.getAsObject([id]);
  stmt.free();
  if (!row || !row.id) return null;
  try { row.items = JSON.parse(row.items); } catch { row.items = []; }
  row.total = Number(row.total);
  return row;
}
function emvBrowser(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}
function crc16Browser(str) {
  let crc = 0xFFFF;
  const poly = 0x1021;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ poly;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function buildPixPayloadBrowser({ pixKey, pixKeyType, pixHolder, pixCity, amount, txId }) {
  const holder = String(pixHolder || "Boka Loka Lanches").slice(0,25);
  const city = String(pixCity || "Tubarao").slice(0,15);
  const keyType = (pixKeyType || "phone").toLowerCase();
  let key = String(pixKey || "").trim();
  if (keyType === "phone") {
    const digits = key.replace(/\D/g, "");
    key = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  } else if (keyType === "cpf" || keyType === "cnpj") {
    key = key.replace(/\D/g, "");
  } else { key = key.trim(); }
  const amountStr = Number(amount).toFixed(2);
  const gui = emvBrowser("00", "BR.GOV.BCB.PIX");
  const keyField = emvBrowser("01", key);
  const merchantAccount = emvBrowser("26", gui + keyField);
  const payloadWithoutCRC =
    emvBrowser("00", "01") +
    emvBrowser("01", "12") +
    merchantAccount +
    emvBrowser("52", "0000") +
    emvBrowser("53", "986") +
    (amountStr && Number(amountStr) > 0 ? emvBrowser("54", amountStr) : "") +
    emvBrowser("58", "BR") +
    emvBrowser("59", holder) +
    emvBrowser("60", city) +
    emvBrowser("62", emvBrowser("05", String(txId).slice(0,25).replace(/[^A-Za-z0-9]/g,"").slice(0,25) || "***")) +
    "6304";
  const crc = crc16Browser(payloadWithoutCRC);
  return payloadWithoutCRC + crc;
}
function generateMockPixBrowser({ id, total, pixKey, pixKeyType, pixHolder, pixCity }) {
  const amount = Number(total).toFixed(2);
  const txId = `BOKA${String(id).slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`.slice(0,25);
  const pixCode = buildPixPayloadBrowser({ pixKey: pixKey||"5548988452532", pixKeyType: pixKeyType||"phone", pixHolder, pixCity, amount, txId });
  const pixQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
  return { pixCode, pixQr, pixTxId: txId };
}
export async function sqlCreateOrder({ customerName, customerPhone, customerAddress, customerCpf, items, total, paymentMethod }) {
  const db = await getDb();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6).toUpperCase();
  const now = new Date().toISOString();
  const pm = (paymentMethod || "pix").toLowerCase();
  let status = pm === "pix" ? "pending_pix" : "pending";
  let pixCode = null, pixQr = null, pixTxId = null;
  if (pm === "pix") {
    let pixConf = { pixKey:"5548988452532", pixKeyType:"phone", pixHolder:"Boka Loka Lanches", pixCity:"Tubarao" };
    try { const s = await sqlGetSettings(); if (s?.pixKey) pixConf = s; } catch {}
    const mock = generateMockPixBrowser({ id, total, pixKey: pixConf.pixKey, pixKeyType: pixConf.pixKeyType, pixHolder: pixConf.pixHolder, pixCity: pixConf.pixCity });
    pixCode = mock.pixCode; pixQr = mock.pixQr; pixTxId = mock.pixTxId;
  }
  db.run("INSERT INTO orders (id, customerName, customerPhone, customerAddress, customerCpf, items, total, paymentMethod, status, pixCode, pixQr, pixTxId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [id, customerName, customerPhone, customerAddress||"", (customerCpf||"").replace(/\D/g,""), JSON.stringify(items), Number(total), pm, status, pixCode, pixQr, pixTxId, now]);
  saveDb();
  return await sqlGetOrder(id);
}
export async function sqlVerifyPix(id, forcePaid) {
  const db = await getDb();
  const order = await sqlGetOrder(id);
  if (!order) throw new Error("Pedido não encontrado");
  if (order.paymentMethod !== "pix") return { ...order, verified: order.status==="paid"||order.status==="confirmed" };
  if (order.status==="paid"||order.status==="confirmed") return { ...order, verified:true };
  if (forcePaid) {
    const paidAt = new Date().toISOString();
    db.run("UPDATE orders SET status='paid', paidAt=? WHERE id=?", [paidAt, id]);
    saveDb();
    const updated = await sqlGetOrder(id);
    return { ...updated, verified:true };
  }
  return { ...order, verified:false };
}
export async function sqlUpdateOrderStatus(id, status) {
  const db = await getDb();
  const allowed = ["pending","pending_pix","paid","confirmed","cancelled","failed"];
  if (!allowed.includes(status)) throw new Error("Status inválido");
  const order = await sqlGetOrder(id);
  if (!order) throw new Error("Pedido não encontrado");
  if (order.paymentMethod==="pix") {
    if (status==="paid" && order.status==="pending_pix") throw new Error("PIX ainda não pago. Use Verificar PIX antes.");
    if (status==="confirmed" && order.status!=="paid" && order.status!=="confirmed") throw new Error("PIX não verificado. Só confirme após pago.");
  }
  const now = new Date().toISOString();
  let paidAt = order.paidAt, confirmedAt = order.confirmedAt;
  if (status==="paid" && !paidAt) paidAt = now;
  if (status==="confirmed" && !confirmedAt) { confirmedAt = now; if (!paidAt && order.paymentMethod==="pix") paidAt = now; }
  db.run("UPDATE orders SET status=?, paidAt=?, confirmedAt=? WHERE id=?", [status, paidAt, confirmedAt, id]);
  saveDb();
  return await sqlGetOrder(id);
}

export async function sqlReset() {
  localStorage.removeItem(STORAGE_KEY);
  db = null;
  await getDb();
}
