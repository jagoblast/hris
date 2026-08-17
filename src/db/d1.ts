// File: src/db/d1.ts
import { AppSetting } from '../types';

// D1 Database Binding yang diakses melalui Hono Context
// Kita akan menggunakan pendekatan getDB(c) untuk mengakses D1 di environment Cloudflare

/**
 * Fungsi pembantu utama untuk mendapatkan koneksi D1 yang valid.
 * Harus dipanggil dari dalam rute/handler Hono yang memiliki konteks (c).
 * Contoh: const db = getDB(c);
 */
export function getDB(c: any): any {
  // Dalam lingkungan Cloudflare Pages, D1 Database akan ter-bind di dalam `c.env.DB`
  if (!c.env || !c.env.DB) {
    throw new Error('Cloudflare D1 Database (DB) tidak ditemukan di environment. Pastikan Binding D1 telah diatur di dashboard Cloudflare Pages.');
  }
  return c.env.DB;
}

/**
 * Fetch a single setting value directly using a valid D1 connection
 */
export async function getSettingValue(db: any, key: string, defaultValue = ''): Promise<string> {
  const stmt = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return stmt?.value ?? defaultValue;
}

/**
 * Fetch all settings as key-value map using a valid D1 connection
 */
export async function getAllSettingsMap(db: any): Promise<Record<string, string>> {
  const { results } = await db.prepare('SELECT * FROM settings').all();
  const map: Record<string, string> = {};
  if (results && results.length > 0) {
    for (const item of results) {
      map[item.key] = item.value;
    }
  }
  return map;
}

// PERINGATAN MIGRASI KODE:
// Karena kamu sekarang menggunakan Database D1 Asli, kamu TIDAK BISA lagi mengimpor `db` statis 
// secara langsung di file lain seperti: `import { db } from './src/db/d1';`
// 
// Semua rute API dan Frontend yang sebelumnya menggunakan `db.prepare(...)` statis
// harus diubah menjadi memanggil `const db = getDB(c)` di dalam handler rute tersebut terlebih dahulu.
