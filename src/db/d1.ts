import { AppSetting } from '../types';

// Variabel internal untuk menyimpan koneksi D1 asli dari Cloudflare
let globalDB: any = null;

/**
 * Dipanggil otomatis oleh server.ts untuk mengunci binding DB
 */
export function initGlobalDB(envDB: any) {
  if (envDB) globalDB = envDB;
}

/**
 * Digunakan oleh endpoint API (src/routes/api/*)
 */
export function getDB(c: any): any {
  if (c.env?.DB) {
    globalDB = c.env.DB;
    return c.env.DB;
  }
  if (globalDB) return globalDB;
  throw new Error('Cloudflare D1 Database (DB) tidak ditemukan.');
}

/**
 * PROXY AJAIB: 
 * Mengembalikan variabel `db` agar seluruh file frontend (app/routes/*.tsx) 
 * dan server.ts TIDAK PERLU DIUBAH SAMA SEKALI dan build Vite sukses!
 */
export const db = new Proxy({}, {
  get: (_, prop) => {
    if (!globalDB) {
      throw new Error('Database diakses sebelum diinisialisasi oleh Hono.');
    }
    const target = globalDB[prop];
    return typeof target === 'function' ? target.bind(globalDB) : target;
  }
}) as any;

/**
 * Helpers (Mendukung format pemanggilan lama dari UI maupun format baru dari API)
 */
export async function getSettingValue(arg1: any, arg2?: string, arg3 = ''): Promise<string> {
  let targetDB, key, defaultValue;
  // Format pemanggilan lama dari frontend SSR: getSettingValue('KEY', 'DEFAULT')
  if (typeof arg1 === 'string') {
    targetDB = globalDB;
    key = arg1;
    defaultValue = arg2 || '';
  } 
  // Format pemanggilan baru dari API: getSettingValue(db, 'KEY', 'DEFAULT')
  else {
    targetDB = arg1 || globalDB;
    key = arg2;
    defaultValue = arg3 || '';
  }
  
  if (!targetDB) return defaultValue;
  const stmt = await targetDB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return stmt?.value ?? defaultValue;
}

export async function getAllSettingsMap(dbInstance?: any): Promise<Record<string, string>> {
  const targetDB = dbInstance || globalDB;
  if (!targetDB) return {};
  
  const { results } = await targetDB.prepare('SELECT * FROM settings').all();
  const map: Record<string, string> = {};
  if (results && results.length > 0) {
    for (const item of results) {
      map[item.key] = item.value;
    }
  }
  return map;
}
