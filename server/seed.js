import { getDb } from "./db.js";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_ADMINS, DEFAULT_DISCOUNTS } from "../src/lib/defaultData.js";

export async function seed() {
  const db = await getDb();

  // products
  const count = await db.get("SELECT COUNT(*) as c FROM products");
  if (count.c === 0) {
    console.log("Seeding products...");
    const stmt = await db.prepare(
      "INSERT INTO products (id, name, description, price, category, image, badge, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const p of DEFAULT_PRODUCTS) {
      await stmt.run(p.id, p.name, p.desc || p.description, p.price, p.category, p.image, p.badge, p.popular ? 1 : 0);
    }
    await stmt.finalize();
  }

  // settings (single row id=1)
  const sCount = await db.get("SELECT COUNT(*) as c FROM settings WHERE id=1");
  if (sCount.c === 0) {
    console.log("Seeding settings...");
    await db.run(
      `INSERT INTO settings (id, address, gmapsLink, phoneDisplay, phoneTel, whatsappNumber, instagramUrl, ifoodUrl, logo, openHour, closeHour, heroTitle, heroSubtitle, pixKey, pixKeyType, pixHolder, pixCity)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      DEFAULT_SETTINGS.address,
      DEFAULT_SETTINGS.gmapsLink,
      DEFAULT_SETTINGS.phoneDisplay,
      DEFAULT_SETTINGS.phoneTel,
      DEFAULT_SETTINGS.whatsappNumber,
      DEFAULT_SETTINGS.instagramUrl,
      DEFAULT_SETTINGS.ifoodUrl,
      DEFAULT_SETTINGS.logo,
      DEFAULT_SETTINGS.openHour,
      DEFAULT_SETTINGS.closeHour,
      DEFAULT_SETTINGS.heroTitle,
      DEFAULT_SETTINGS.heroSubtitle,
      DEFAULT_SETTINGS.pixKey || "5548988452532",
      DEFAULT_SETTINGS.pixKeyType || "phone",
      DEFAULT_SETTINGS.pixHolder || "Boka Loka Lanches",
      DEFAULT_SETTINGS.pixCity || "Tubarao"
    );
  } else {
    // migração para quem já tem settings sem pixKey
    try {
      const row = await db.get("SELECT pixKey FROM settings WHERE id=1");
      if (row && !row.pixKey) {
        await db.run("UPDATE settings SET pixKey=?, pixKeyType=?, pixHolder=?, pixCity=? WHERE id=1",
          DEFAULT_SETTINGS.pixKey || "5548988452532",
          DEFAULT_SETTINGS.pixKeyType || "phone",
          DEFAULT_SETTINGS.pixHolder || "Boka Loka Lanches",
          DEFAULT_SETTINGS.pixCity || "Tubarao");
      }
    } catch {}
  }

  // admins
  const aCount = await db.get("SELECT COUNT(*) as c FROM admins");
  if (aCount.c === 0) {
    console.log("Seeding admins...");
    const stmt = await db.prepare("INSERT INTO admins (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
    for (const a of DEFAULT_ADMINS) {
      await stmt.run(a.id, a.email, a.password, a.name, a.role, a.createdAt);
    }
    await stmt.finalize();
  }

  // discounts (empty by default, nothing to seed)
  console.log("Seed complete.");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  seed().then(() => process.exit(0));
}
