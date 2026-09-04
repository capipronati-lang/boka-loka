import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbPromise = null;

export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = open({
    filename: "./server/boka.db",
    driver: sqlite3.Database,
  }).then(async (db) => {
    await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

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
        pixCity TEXT,
        pixBank TEXT
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
    // soft delete — lixeira (migração para DBs já existentes)
    for (const tbl of ["products","admins","discounts","accounts"]) {
      try { await db.exec(`ALTER TABLE ${tbl} ADD COLUMN deleted INTEGER DEFAULT 0`); } catch {}
      try { await db.exec(`ALTER TABLE ${tbl} ADD COLUMN deletedAt TEXT`); } catch {}
    }
    // migração PIX chave fixa editável
    try { await db.exec(`ALTER TABLE settings ADD COLUMN pixKey TEXT`); } catch {}
    try { await db.exec(`ALTER TABLE settings ADD COLUMN pixKeyType TEXT`); } catch {}
    try { await db.exec(`ALTER TABLE settings ADD COLUMN pixHolder TEXT`); } catch {}
    try { await db.exec(`ALTER TABLE settings ADD COLUMN pixCity TEXT`); } catch {}
    try { await db.exec(`ALTER TABLE settings ADD COLUMN pixBank TEXT`); } catch {}
    return db;
  });
  return dbPromise;
}
