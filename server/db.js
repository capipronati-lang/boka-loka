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
        heroSubtitle TEXT
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
    `);
    return db;
  });
  return dbPromise;
}
