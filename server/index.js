import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import { seed } from "./seed.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// helper to map DB row to product
function rowToProduct(r) {
  return {
    id: r.id,
    name: r.name,
    desc: r.description,
    description: r.description,
    price: r.price,
    category: r.category,
    image: r.image,
    badge: r.badge,
    popular: !!r.popular,
  };
}
function rowToProductWithTrash(r) {
  return {
    ...rowToProduct(r),
    deleted: !!r.deleted,
    deletedAt: r.deletedAt || null,
    daysRemaining: r.deletedAt ? Math.max(0, 30 - Math.floor((Date.now() - new Date(r.deletedAt).getTime()) / (1000*60*60*24))) : null,
    isExpired: r.deletedAt ? (Date.now() - new Date(r.deletedAt).getTime()) > 30*24*60*60*1000 : false,
  };
}
async function purgeExpiredProducts(db) {
  // hard delete produtos com >30 dias na lixeira (opcional auto-limpeza)
  try {
    const cutoff = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    await db.run("DELETE FROM products WHERE deleted=1 AND deletedAt IS NOT NULL AND deletedAt < ?", cutoff);
  } catch {}
}

// --- PRODUCTS (apenas não deletados) ---
app.get("/api/products", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM products WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  res.json(rows.map(rowToProduct));
});
app.get("/api/products/all", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM products ORDER BY rowid");
  res.json(rows.map(r => ({ ...rowToProduct(r), deleted: !!r.deleted, deletedAt: r.deletedAt })));
});

app.post("/api/products", async (req, res) => {
  const db = await getDb();
  const { id, name, desc, description, price, category, image, badge, popular } = req.body;
  if (!id || !name || price == null) return res.status(400).json({ error: "id, name, price required" });
  const descriptionVal = desc || description || "";
  try {
    await db.run(
      "INSERT INTO products (id, name, description, price, category, image, badge, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      id, name, descriptionVal, Number(price), category || "Clássicos", image || "", badge || "", popular ? 1 : 0
    );
    const row = await db.get("SELECT * FROM products WHERE id=?", id);
    res.status(201).json(rowToProduct(row));
  } catch (e) {
    if (e.message.includes("UNIQUE") || e.message.includes("PRIMARY")) {
      return res.status(409).json({ error: "ID já existe" });
    }
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const { name, desc, description, price, category, image, badge, popular } = req.body;
  const existing = await db.get("SELECT * FROM products WHERE id=?", id);
  if (!existing) return res.status(404).json({ error: "Produto não encontrado" });
  const descriptionVal = desc ?? description ?? existing.description;
  await db.run(
    "UPDATE products SET name=?, description=?, price=?, category=?, image=?, badge=?, popular=? WHERE id=?",
    name ?? existing.name,
    descriptionVal,
    price != null ? Number(price) : existing.price,
    category ?? existing.category,
    image ?? existing.image,
    badge ?? existing.badge,
    popular != null ? (popular ? 1 : 0) : existing.popular,
    id
  );
  const row = await db.get("SELECT * FROM products WHERE id=?", id);
  res.json(rowToProduct(row));
});

app.delete("/api/products/:id", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  // soft delete → lixeira
  await db.run("UPDATE products SET deleted=1, deletedAt=? WHERE id=?", new Date().toISOString(), id);
  res.json({ ok: true, soft: true });
});

// BULK SYNC — usado pelo painel admin para salvar array completo (preserva lixeira)
app.post("/api/products/bulk", async (req, res) => {
  const db = await getDb();
  const products = req.body;
  if (!Array.isArray(products)) return res.status(400).json({ error: "array required" });
  await db.run("DELETE FROM products WHERE deleted=0 OR deleted IS NULL");
  const stmt = await db.prepare("INSERT INTO products (id, name, description, price, category, image, badge, popular, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)");
  for (const p of products) {
    await stmt.run(p.id, p.name, p.desc || p.description, Number(p.price), p.category || "Clássicos", p.image || "", p.badge || "", p.popular ? 1 : 0);
  }
  await stmt.finalize();
  const rows = await db.all("SELECT * FROM products WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  res.json(rows.map(rowToProduct));
});

// --- SETTINGS ---
app.get("/api/settings", async (req, res) => {
  const db = await getDb();
  const row = await db.get("SELECT * FROM settings WHERE id=1");
  if (!row) return res.json({});
  res.json({
    address: row.address,
    gmapsLink: row.gmapsLink,
    phoneDisplay: row.phoneDisplay,
    phoneTel: row.phoneTel,
    whatsappNumber: row.whatsappNumber,
    instagramUrl: row.instagramUrl,
    ifoodUrl: row.ifoodUrl,
    logo: row.logo,
    openHour: row.openHour,
    closeHour: row.closeHour,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    pixKey: row.pixKey || "5548988452532",
    pixKeyType: row.pixKeyType || "phone",
    pixHolder: row.pixHolder || "Boka Loka Lanches",
    pixCity: row.pixCity || "Tubarao",
  });
});

app.put("/api/settings", async (req, res) => {
  const db = await getDb();
  const fields = ["address","gmapsLink","phoneDisplay","phoneTel","whatsappNumber","instagramUrl","ifoodUrl","logo","openHour","closeHour","heroTitle","heroSubtitle","pixKey","pixKeyType","pixHolder","pixCity"];
  const current = await db.get("SELECT * FROM settings WHERE id=1");
  if (!current) return res.status(404).json({ error: "Settings não encontrado, rode seed" });
  const next = {};
  for (const f of fields) {
    next[f] = req.body[f] !== undefined ? req.body[f] : current[f];
  }
  await db.run(
    `UPDATE settings SET address=?, gmapsLink=?, phoneDisplay=?, phoneTel=?, whatsappNumber=?, instagramUrl=?, ifoodUrl=?, logo=?, openHour=?, closeHour=?, heroTitle=?, heroSubtitle=?, pixKey=?, pixKeyType=?, pixHolder=?, pixCity=? WHERE id=1`,
    next.address, next.gmapsLink, next.phoneDisplay, next.phoneTel, next.whatsappNumber, next.instagramUrl, next.ifoodUrl, next.logo, next.openHour, next.closeHour, next.heroTitle, next.heroSubtitle, next.pixKey, next.pixKeyType, next.pixHolder, next.pixCity
  );
  const row = await db.get("SELECT * FROM settings WHERE id=1");
  res.json({
    address: row.address,
    gmapsLink: row.gmapsLink,
    phoneDisplay: row.phoneDisplay,
    phoneTel: row.phoneTel,
    whatsappNumber: row.whatsappNumber,
    instagramUrl: row.instagramUrl,
    ifoodUrl: row.ifoodUrl,
    logo: row.logo,
    openHour: row.openHour,
    closeHour: row.closeHour,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    pixKey: row.pixKey,
    pixKeyType: row.pixKeyType,
    pixHolder: row.pixHolder,
    pixCity: row.pixCity,
  });
});

// --- ADMINS (apenas ativos) ---
app.get("/api/admins", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT id, email, password, name, role, createdAt FROM admins WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  res.json(rows);
});
app.get("/api/admins/all", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT id, email, password, name, role, createdAt, deleted, deletedAt FROM admins ORDER BY rowid");
  res.json(rows);
});

app.post("/api/admins", async (req, res) => {
  const db = await getDb();
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email e senha obrigatórios" });
  const id = Date.now().toString();
  try {
    await db.run("INSERT INTO admins (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      id, email.toLowerCase(), password, name || email.split("@")[0], role || "admin", new Date().toISOString()
    );
    const row = await db.get("SELECT * FROM admins WHERE id=?", id);
    res.status(201).json(row);
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "E-mail já cadastrado" });
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const count = await db.get("SELECT COUNT(*) as c FROM admins WHERE deleted=0 OR deleted IS NULL");
  if (count.c <= 1) return res.status(400).json({ error: "Mantenha ao menos 1 admin" });
  await db.run("UPDATE admins SET deleted=1, deletedAt=? WHERE id=?", new Date().toISOString(), id);
  res.json({ ok: true, soft: true });
});

app.post("/api/admins/login", async (req, res) => {
  const db = await getDb();
  const { email, password } = req.body;
  const row = await db.get("SELECT * FROM admins WHERE lower(email)=lower(?) AND password=?", email, password);
  if (!row) return res.status(401).json({ error: "E-mail ou senha inválidos" });
  res.json({ id: row.id, email: row.email, name: row.name, role: row.role });
});

// --- DISCOUNTS (apenas ativos) ---
app.get("/api/discounts", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM discounts WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  res.json(rows.map(r => ({ ...r, active: !!r.active, percent: Number(r.percent) })));
});
app.get("/api/discounts/all", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM discounts ORDER BY rowid");
  res.json(rows.map(r => ({ ...r, active: !!r.active, percent: Number(r.percent), deleted: !!r.deleted })));
});

app.post("/api/discounts", async (req, res) => {
  const db = await getDb();
  const { label, percent, category, productId, active } = req.body;
  if (!label || percent == null) return res.status(400).json({ error: "label e percent required" });
  const id = Date.now().toString();
  await db.run("INSERT INTO discounts (id, label, percent, category, productId, active) VALUES (?, ?, ?, ?, ?, ?)",
    id, label, Number(percent), category || "Todos", productId || null, active ? 1 : 0
  );
  const row = await db.get("SELECT * FROM discounts WHERE id=?", id);
  res.status(201).json({ ...row, active: !!row.active });
});

app.put("/api/discounts/:id", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const existing = await db.get("SELECT * FROM discounts WHERE id=?", id);
  if (!existing) return res.status(404).json({ error: "Desconto não encontrado" });
  const { label, percent, category, productId, active } = req.body;
  await db.run("UPDATE discounts SET label=?, percent=?, category=?, productId=?, active=? WHERE id=?",
    label ?? existing.label,
    percent != null ? Number(percent) : existing.percent,
    category ?? existing.category,
    productId !== undefined ? productId : existing.productId,
    active != null ? (active ? 1 : 0) : existing.active,
    id
  );
  const row = await db.get("SELECT * FROM discounts WHERE id=?", id);
  res.json({ ...row, active: !!row.active });
});

app.delete("/api/discounts/:id", async (req, res) => {
  const db = await getDb();
  await db.run("UPDATE discounts SET deleted=1, deletedAt=? WHERE id=?", new Date().toISOString(), req.params.id);
  res.json({ ok: true, soft: true });
});

// --- ACCOUNTS (apenas ativas) ---
app.get("/api/accounts", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM accounts WHERE deleted=0 OR deleted IS NULL ORDER BY rowid");
  res.json(rows);
});
app.get("/api/accounts/all", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM accounts ORDER BY rowid");
  res.json(rows);
});
app.post("/api/accounts", async (req, res) => {
  const db = await getDb();
  const { name, email, phone, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: "name e email required" });
  const id = Date.now().toString();
  try {
    await db.run("INSERT INTO accounts (id, name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      id, name, email.toLowerCase(), phone || "", password || "", new Date().toISOString());
    const row = await db.get("SELECT * FROM accounts WHERE id=?", id);
    res.status(201).json(row);
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "E-mail já cadastrado" });
    res.status(500).json({ error: e.message });
  }
});
app.put("/api/accounts/:id", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const existing = await db.get("SELECT * FROM accounts WHERE id=?", id);
  if (!existing) return res.status(404).json({ error: "Conta não encontrada" });
  const { name, email, phone, password } = req.body;
  await db.run("UPDATE accounts SET name=?, email=?, phone=?, password=? WHERE id=?",
    name ?? existing.name, email ? email.toLowerCase() : existing.email, phone ?? existing.phone, password ?? existing.password, id);
  const row = await db.get("SELECT * FROM accounts WHERE id=?", id);
  res.json(row);
});
app.delete("/api/accounts/:id", async (req, res) => {
  const db = await getDb();
  await db.run("UPDATE accounts SET deleted=1, deletedAt=? WHERE id=?", new Date().toISOString(), req.params.id);
  res.json({ ok: true, soft: true });
});

// --- HISTÓRICO DE PRODUTOS EXCLUÍDOS (últimos 30 dias, recuperável) ---
app.get("/api/products/deleted", async (req, res) => {
  const db = await getDb();
  // não apaga automaticamente, apenas informa expirados mas permite filtrar ?expired=false
  const rows = await db.all("SELECT * FROM products WHERE deleted=1 ORDER BY deletedAt DESC");
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  const enriched = rows.map(rowToProductWithTrash);
  const last30 = enriched.filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) <= THIRTY);
  const expired = enriched.filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) > THIRTY);
  res.json({ history: last30, expired, all: enriched, totalLast30: last30.length });
});
app.get("/api/products/deleted/history", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM products WHERE deleted=1 ORDER BY deletedAt DESC");
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  const enriched = rows.map(rowToProductWithTrash);
  const last30 = enriched.filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) <= THIRTY);
  res.json(last30);
});
app.post("/api/products/:id/restore", async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const row = await db.get("SELECT * FROM products WHERE id=? AND deleted=1", id);
  if (!row) return res.status(404).json({ error: "Produto não encontrado na lixeira" });
  await db.run("UPDATE products SET deleted=0, deletedAt=NULL WHERE id=?", id);
  const restored = await db.get("SELECT * FROM products WHERE id=?", id);
  res.json(rowToProduct(restored));
});
app.post("/api/products/purge-expired", async (req, res) => {
  const db = await getDb();
  const cutoff = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const before = await db.get("SELECT COUNT(*) as c FROM products WHERE deleted=1 AND deletedAt < ?", cutoff);
  await db.run("DELETE FROM products WHERE deleted=1 AND deletedAt < ?", cutoff);
  res.json({ ok: true, purged: before.c });
});

// --- LIXEIRA (ver apagados e recuperar) ---
app.get("/api/trash", async (req, res) => {
  const db = await getDb();
  const products = await db.all("SELECT * FROM products WHERE deleted=1 ORDER BY deletedAt DESC");
  const admins = await db.all("SELECT * FROM admins WHERE deleted=1 ORDER BY deletedAt DESC");
  const discounts = await db.all("SELECT * FROM discounts WHERE deleted=1 ORDER BY deletedAt DESC");
  const accounts = await db.all("SELECT * FROM accounts WHERE deleted=1 ORDER BY deletedAt DESC");
  const productsEnriched = products.map(rowToProductWithTrash);
  // separa histórico 30 dias para facilitar no front
  const now = Date.now();
  const THIRTY = 30*24*60*60*1000;
  const productsLast30 = productsEnriched.filter(p => p.deletedAt && (now - new Date(p.deletedAt).getTime()) <= THIRTY);
  res.json({
    products: productsEnriched,
    productsLast30,
    admins, discounts: discounts.map(r=>({ ...r, active: !!r.active })), accounts
  });
});
app.post("/api/trash/restore/:type/:id", async (req, res) => {
  const db = await getDb();
  const { type, id } = req.params;
  const allowed = ["products","admins","discounts","accounts"];
  if (!allowed.includes(type)) return res.status(400).json({ error: "tipo inválido" });
  await db.run(`UPDATE ${type} SET deleted=0, deletedAt=NULL WHERE id=?`, id);
  res.json({ ok: true });
});
app.delete("/api/trash/:type/:id", async (req, res) => {
  const db = await getDb();
  const { type, id } = req.params;
  const allowed = ["products","admins","discounts","accounts"];
  if (!allowed.includes(type)) return res.status(400).json({ error: "tipo inválido" });
  await db.run(`DELETE FROM ${type} WHERE id=?`, id);
  res.json({ ok: true });
});
app.delete("/api/trash/clear", async (req, res) => {
  const db = await getDb();
  await db.run("DELETE FROM products WHERE deleted=1");
  await db.run("DELETE FROM admins WHERE deleted=1");
  await db.run("DELETE FROM discounts WHERE deleted=1");
  await db.run("DELETE FROM accounts WHERE deleted=1");
  res.json({ ok: true });
});

// --- PEDIDOS + PAGAMENTOS ---
function rowToOrder(r) {
  return {
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerAddress: r.customerAddress,
    customerCpf: r.customerCpf,
    items: (()=>{ try { return JSON.parse(r.items); } catch { return []; } })(),
    total: Number(r.total),
    paymentMethod: r.paymentMethod,
    status: r.status,
    pixCode: r.pixCode,
    pixQr: r.pixQr,
    pixTxId: r.pixTxId,
    mpPaymentId: r.mpPaymentId,
    createdAt: r.createdAt,
    paidAt: r.paidAt,
    confirmedAt: r.confirmedAt,
  };
}
async function getPixSettings(db) {
  try {
    const row = await db.get("SELECT pixKey, pixKeyType, pixHolder, pixCity FROM settings WHERE id=1");
    return {
      pixKey: row?.pixKey || process.env.PIX_KEY || "5548988452532",
      pixKeyType: row?.pixKeyType || "phone",
      pixHolder: row?.pixHolder || "Boka Loka Lanches",
      pixCity: row?.pixCity || "Tubarao",
    };
  } catch { return { pixKey: process.env.PIX_KEY || "5548988452532", pixKeyType:"phone", pixHolder:"Boka Loka Lanches", pixCity:"Tubarao" }; }
}
function emv(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}
function crc16(str) {
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
function buildPixPayload({ pixKey, pixKeyType, pixHolder, pixCity, amount, txId }) {
  try {
  var holder = String(pixHolder || "Boka Loka Lanches").slice(0,25);
  var city = String(pixCity || "Tubarao").slice(0,15);
  var keyType = (pixKeyType || "phone").toLowerCase();
  var key = String(pixKey || "").trim();
  if (keyType === "phone") {
    var digits = key.replace(/\D/g, "");
    key = digits.startsWith("55") ? "+"+digits : "+55"+digits;
  } else if (keyType === "cpf" || keyType === "cnpj") {
    key = key.replace(/\D/g, "");
  } else { key = key.trim(); }
  var amountStr = Number(amount).toFixed(2);
  var gui = emv("00", "BR.GOV.BCB.PIX");
  var keyField = emv("01", key);
  var merchantAccount = emv("26", gui + keyField);
  var payloadWithoutCRC =
    emv("00", "01") +
    emv("01", "12") +
    merchantAccount +
    emv("52", "0000") +
    emv("53", "986") +
    (amountStr && Number(amountStr) > 0 ? emv("54", amountStr) : "") +
    emv("58", "BR") +
    emv("59", holder) +
    emv("60", city) +
    emv("62", emv("05", String(txId).slice(0,25).replace(/[^A-Za-z0-9]/g,"").slice(0,25) || "***")) +
    "6304";
  var crc = crc16(payloadWithoutCRC);
  return payloadWithoutCRC + crc;
  } catch(e){ console.error("buildPixPayload fallback",e); var fallbackKey=String(pixKey||"5548988452532").replace(/\D/g,""); return "PIX:"+fallbackKey+":"+String(amount)+":"+String(txId); }
}
function generateMockPix({ id, total, pixKey, pixKeyType, pixHolder, pixCity }) {
  const amount = Number(total).toFixed(2);
  const txId = `BOKA${String(id).slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`.slice(0,25);
  const pixCode = buildPixPayload({ pixKey: pixKey || "5548988452532", pixKeyType: pixKeyType || "phone", pixHolder: pixHolder || "Boka Loka Lanches", pixCity: pixCity || "Tubarao", amount, txId });
  const pixQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
  return { pixCode, pixQr, pixTxId: txId };
}
async function createMercadoPagoPix({ id, total, customerName, customerCpf, customerPhone }) {
  const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const email = `cliente_${id}@bokaloka.com`;
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": id },
      body: JSON.stringify({
        transaction_amount: Number(Number(total).toFixed(2)),
        description: `Pedido Boka Loka #${id}`,
        payment_method_id: "pix",
        payer: {
          email,
          first_name: customerName || "Cliente",
          last_name: "Boka",
          identification: customerCpf ? { type: "CPF", number: customerCpf.replace(/\D/g,"") } : undefined,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn("MP Pix erro", data);
      return null;
    }
    const tx = data.point_of_interaction?.transaction_data;
    return {
      pixCode: tx?.qr_code || data.pixCode || null,
      pixQr: tx?.qr_code_base64 ? `data:image/png;base64,${tx.qr_code_base64}` : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tx?.qr_code || "")}`,
      pixTxId: data.id?.toString() || null,
      mpPaymentId: data.id?.toString() || null,
      mpRaw: data,
    };
  } catch (e) {
    console.warn("MP Pix fetch erro", e.message);
    return null;
  }
}

app.get("/api/orders", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM orders ORDER BY datetime(createdAt) DESC");
  res.json(rows.map(rowToOrder));
});
app.get("/api/orders/:id", async (req, res) => {
  const db = await getDb();
  const row = await db.get("SELECT * FROM orders WHERE id=?", req.params.id);
  if (!row) return res.status(404).json({ error: "Pedido não encontrado" });
  res.json(rowToOrder(row));
});
app.post("/api/orders", async (req, res) => {
  const db = await getDb();
  const { customerName, customerPhone, customerAddress, customerCpf, items, total, paymentMethod } = req.body;
  if (!items || !Array.isArray(items) || items.length===0) return res.status(400).json({ error: "Carrinho vazio" });
  if (!customerName || !customerPhone) return res.status(400).json({ error: "Nome e telefone obrigatórios" });
  const pm = (paymentMethod || "pix").toLowerCase();
  if (!["pix","card","money"].includes(pm)) return res.status(400).json({ error: "Forma de pagamento inválida" });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6).toUpperCase();
  const now = new Date().toISOString();
  let status = pm === "pix" ? "pending_pix" : "pending";
  let pixCode = null, pixQr = null, pixTxId = null, mpPaymentId = null;
  const calcTotal = Number(total) || 0;
  if (pm === "pix") {
    // tenta Mercado Pago real, fallback mock com chave das configurações
    const mp = await createMercadoPagoPix({ id, total: calcTotal, customerName, customerCpf, customerPhone });
    if (mp && mp.pixCode) {
      pixCode = mp.pixCode; pixQr = mp.pixQr; pixTxId = mp.pixTxId; mpPaymentId = mp.mpPaymentId;
    } else {
      const pixConf = await getPixSettings(db);
      const mock = generateMockPix({ id, total: calcTotal, pixKey: pixConf.pixKey, pixKeyType: pixConf.pixKeyType, pixHolder: pixConf.pixHolder, pixCity: pixConf.pixCity });
      pixCode = mock.pixCode; pixQr = mock.pixQr; pixTxId = mock.pixTxId;
    }
  }
  // para cartão/dinheiro entra como pending (admin confirma) - mas permite confirmar direto se quiser
  if (pm !== "pix") status = "pending";
  await db.run(
    "INSERT INTO orders (id, customerName, customerPhone, customerAddress, customerCpf, items, total, paymentMethod, status, pixCode, pixQr, pixTxId, mpPaymentId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    id, customerName.trim(), customerPhone.trim(), (customerAddress||"").trim(), (customerCpf||"").replace(/\D/g,""), JSON.stringify(items), calcTotal, pm, status, pixCode, pixQr, pixTxId, mpPaymentId, now
  );
  const row = await db.get("SELECT * FROM orders WHERE id=?", id);
  res.status(201).json(rowToOrder(row));
});
app.post("/api/orders/:id/verify-pix", async (req, res) => {
  const db = await getDb();
  const row = await db.get("SELECT * FROM orders WHERE id=?", req.params.id);
  if (!row) return res.status(404).json({ error: "Pedido não encontrado" });
  const order = rowToOrder(row);
  if (order.paymentMethod !== "pix") return res.json({ ...order, verified: order.status === "paid" || order.status === "confirmed", message: "Pedido não é PIX" });
  if (order.status === "paid" || order.status === "confirmed") return res.json({ ...order, verified: true, message: "Já pago" });
  // tenta verificar no Mercado Pago se houver mpPaymentId
  const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (token && order.mpPaymentId) {
    try {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await r.json();
      if (data.status === "approved") {
        const paidAt = new Date().toISOString();
        await db.run("UPDATE orders SET status='paid', paidAt=? WHERE id=?", paidAt, order.id);
        const updated = await db.get("SELECT * FROM orders WHERE id=?", order.id);
        return res.json({ ...rowToOrder(updated), verified: true, message: "PIX confirmado (Mercado Pago)" });
      }
      return res.json({ ...order, verified: false, mpStatus: data.status, message: "PIX ainda não pago" });
    } catch (e) {
      return res.json({ ...order, verified: false, message: "Erro ao consultar Mercado Pago", error: e.message });
    }
  }
  // MOCK: verifica se passou tempo mínimo ou header X-Mock-Paid=true (para teste admin)
  // Em produção real, só marcará pago via webhook MP ou confirmação manual admin
  // Para demo: se query ?forcePaid=true ou header, marca pago. Caso contrário, retorna pendente e exige confirmação.
  const forcePaid = req.query.forcePaid === "true" || req.headers["x-mock-paid"] === "true" || req.body?.forcePaid === true;
  // Também permite modo demo auto após 15s se env DEMO_PIX_AUTO_PAID=true
  const autoDemo = process.env.DEMO_PIX_AUTO_PAID === "true";
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  if (forcePaid || (autoDemo && elapsed > 15000)) {
    const paidAt = new Date().toISOString();
    await db.run("UPDATE orders SET status='paid', paidAt=? WHERE id=?", paidAt, order.id);
    const updated = await db.get("SELECT * FROM orders WHERE id=?", order.id);
    return res.json({ ...rowToOrder(updated), verified: true, message: "PIX verificado (MOCK - pago)" });
  }
  return res.json({ ...order, verified: false, message: "PIX ainda não pago. Pague o QR e clique em Verificar. (Mock: só aprova se admin confirmar ou DEMO_PIX_AUTO_PAID)" });
});
app.put("/api/orders/:id/status", async (req, res) => {
  const db = await getDb();
  const { status } = req.body;
  const allowed = ["pending","pending_pix","paid","confirmed","cancelled","failed"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Status inválido" });
  const row = await db.get("SELECT * FROM orders WHERE id=?", req.params.id);
  if (!row) return res.status(404).json({ error: "Pedido não encontrado" });
  // proteção dinheiro real: PIX não pode ser confirmado sem pagamento verificado
  if (row.paymentMethod === "pix") {
    if (status === "paid" && row.status === "pending_pix") {
      return res.status(400).json({ error: "PIX ainda não pago. Use Verificar PIX antes. Para teste use ?forcePaid=true via /verify-pix" });
    }
    if (status === "confirmed" && row.status !== "paid" && row.status !== "confirmed") {
      return res.status(400).json({ error: "PIX não verificado. Só confirme após status paid. Use Verificar PIX." });
    }
  }
  const now = new Date().toISOString();
  let paidAt = row.paidAt, confirmedAt = row.confirmedAt;
  if (status === "paid" && !paidAt) paidAt = now;
  if (status === "confirmed" && !confirmedAt) { confirmedAt = now; if (!paidAt && row.paymentMethod==="pix") paidAt = now; }
  await db.run("UPDATE orders SET status=?, paidAt=?, confirmedAt=? WHERE id=?", status, paidAt, confirmedAt, req.params.id);
  const updated = await db.get("SELECT * FROM orders WHERE id=?", req.params.id);
  res.json(rowToOrder(updated));
});
app.post("/api/webhook/mercadopago", async (req, res) => {
  // Webhook Mercado Pago - recebe notificação de pagamento
  try {
    const { data, type } = req.body || {};
    if (type === "payment" && data?.id) {
      const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (token) {
        const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, { headers: { "Authorization": `Bearer ${token}` } });
        const pay = await r.json();
        if (pay.status === "approved" && pay.id) {
          const db = await getDb();
          const row = await db.get("SELECT * FROM orders WHERE mpPaymentId=?", String(pay.id));
          if (row) {
            await db.run("UPDATE orders SET status='paid', paidAt=? WHERE id=?", new Date().toISOString(), row.id);
          }
        }
      }
    }
  } catch {}
  res.json({ ok: true });
});

// health
app.get("/api/health", (req, res) => res.json({ ok: true, db: "sqlite" }));

// init + seed
await seed();

app.listen(PORT, () => {
  console.log(`✅ SQL API rodando em http://localhost:${PORT} — DB: server/boka.db`);
});
