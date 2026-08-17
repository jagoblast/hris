import { Hono } from 'hono';
import { db, getAllSettingsMap } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { AppSetting } from '../../types';

const settingsApi = new Hono();

// GET /api/v1/settings - Public or authenticated info
settingsApi.get('/', async (c) => {
  const list = await db.prepare('SELECT * FROM settings').all<AppSetting>();
  const map = await getAllSettingsMap();

  return c.json({
    success: true,
    data: {
      settings: list.results,
      map,
    }
  });
});

// GET /api/v1/settings/:key
settingsApi.get('/:key', async (c) => {
  const key = c.req.param('key').toUpperCase();
  const setting = await db.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first<AppSetting>();
  
  if (!setting) {
    return c.json({ success: false, error: `Setting with key '${key}' not found.` }, 404);
  }

  return c.json({
    success: true,
    data: setting,
  });
});

// PATCH /api/v1/settings - Update settings (ADMIN or HRD only)
settingsApi.patch('/', requireAuth(), requireRole('ADMIN', 'HRD'), async (c) => {

  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ success: false, error: 'Request body must be a JSON object with setting key-values.' }, 400);
    }

    const updatedKeys: string[] = [];

    for (const [key, rawVal] of Object.entries(body)) {
      const valStr = String(rawVal);
      const upperKey = key.toUpperCase();
      
      // Update or insert into settings table
      await db.prepare('INSERT INTO settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)')
        .bind(upperKey, valStr, `Updated via API by ${c.get('user')?.name || 'Admin'}`, new Date().toISOString())
        .run();
        
      updatedKeys.push(upperKey);
    }

    const currentMap = await getAllSettingsMap();
    const currentList = await db.prepare('SELECT * FROM settings').all<AppSetting>();

    return c.json({
      success: true,
      message: `Berhasil memperbarui ${updatedKeys.length} parameter pengaturan perusahaan.`,
      updated_keys: updatedKeys,
      data: {
        settings: currentList.results,
        map: currentMap,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default settingsApi;
