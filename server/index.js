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

// --- PRODUCTS ---
app.get("/api/products", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM products ORDER BY rowid");
  res.json(rows.map(rowToProduct));
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
  await db.run("DELETE FROM products WHERE id=?", id);
  res.json({ ok: true });
});

// BULK SYNC — usado pelo painel admin para salvar array completo (SQL como fonte da verdade)
app.post("/api/products/bulk", async (req, res) => {
  const db = await getDb();
  const products = req.body;
  if (!Array.isArray(products)) return res.status(400).json({ error: "array required" });
  await db.run("DELETE FROM products");
  const stmt = await db.prepare("INSERT INTO products (id, name, description, price, category, image, badge, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const p of products) {
    await stmt.run(p.id, p.name, p.desc || p.description, Number(p.price), p.category || "Clássicos", p.image || "", p.badge || "", p.popular ? 1 : 0);
  }
  await stmt.finalize();
  const rows = await db.all("SELECT * FROM products ORDER BY rowid");
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
  });
});

app.put("/api/settings", async (req, res) => {
  const db = await getDb();
  const fields = ["address","gmapsLink","phoneDisplay","phoneTel","whatsappNumber","instagramUrl","ifoodUrl","logo","openHour","closeHour","heroTitle","heroSubtitle"];
  const current = await db.get("SELECT * FROM settings WHERE id=1");
  if (!current) return res.status(404).json({ error: "Settings não encontrado, rode seed" });
  const next = {};
  for (const f of fields) {
    next[f] = req.body[f] !== undefined ? req.body[f] : current[f];
  }
  await db.run(
    `UPDATE settings SET address=?, gmapsLink=?, phoneDisplay=?, phoneTel=?, whatsappNumber=?, instagramUrl=?, ifoodUrl=?, logo=?, openHour=?, closeHour=?, heroTitle=?, heroSubtitle=? WHERE id=1`,
    next.address, next.gmapsLink, next.phoneDisplay, next.phoneTel, next.whatsappNumber, next.instagramUrl, next.ifoodUrl, next.logo, next.openHour, next.closeHour, next.heroTitle, next.heroSubtitle
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
  });
});

// --- ADMINS ---
app.get("/api/admins", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT id, email, password, name, role, createdAt FROM admins ORDER BY rowid");
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
  const count = await db.get("SELECT COUNT(*) as c FROM admins");
  if (count.c <= 1) return res.status(400).json({ error: "Mantenha ao menos 1 admin" });
  await db.run("DELETE FROM admins WHERE id=?", id);
  res.json({ ok: true });
});

app.post("/api/admins/login", async (req, res) => {
  const db = await getDb();
  const { email, password } = req.body;
  const row = await db.get("SELECT * FROM admins WHERE lower(email)=lower(?) AND password=?", email, password);
  if (!row) return res.status(401).json({ error: "E-mail ou senha inválidos" });
  res.json({ id: row.id, email: row.email, name: row.name, role: row.role });
});

// --- DISCOUNTS ---
app.get("/api/discounts", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM discounts ORDER BY rowid");
  res.json(rows.map(r => ({ ...r, active: !!r.active, percent: Number(r.percent) })));
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
  await db.run("DELETE FROM discounts WHERE id=?", req.params.id);
  res.json({ ok: true });
});

// --- ACCOUNTS (contas de clientes) ---
app.get("/api/accounts", async (req, res) => {
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
  await db.run("DELETE FROM accounts WHERE id=?", req.params.id);
  res.json({ ok: true });
});

// health
app.get("/api/health", (req, res) => res.json({ ok: true, db: "sqlite" }));

// init + seed
await seed();

app.listen(PORT, () => {
  console.log(`✅ SQL API rodando em http://localhost:${PORT} — DB: server/boka.db`);
});
