import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const settingsApi = new Hono();

// Wajib login untuk akses endpoint pengaturan
settingsApi.use('*', requireAuth());

// GET: Mengambil semua pengaturan (Bisa diakses semua karyawan yang login)
settingsApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const res = await db.prepare('SELECT * FROM settings').all();
    return c.json({ success: true, data: res.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH: Memperbarui pengaturan (Hanya untuk ADMIN atau HRD)
settingsApi.patch('/', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const body = await c.req.json();
    const now = new Date().toISOString();

    // Lakukan iterasi pada setiap key-value yang dikirim dari form
    for (const [key, value] of Object.entries(body)) {
      // Gunakan fitur UPSERT SQLite: Jika key sudah ada, update value. Jika belum, insert baru.
      await db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET 
          value = excluded.value, 
          updated_at = excluded.updated_at
      `)
      .bind(key, String(value), now)
      .run();
    }

    return c.json({ success: true, message: 'Pengaturan perusahaan berhasil diperbarui dan disimpan permanen di D1.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default settingsApi;
