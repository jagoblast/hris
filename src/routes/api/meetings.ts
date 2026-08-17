import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const meetingsApi = new Hono();
meetingsApi.use('*', requireAuth());

meetingsApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    
    // Ambil data meetings
    const mtgRes = await db.prepare(`
      SELECT m.*, u.name as organizer_name 
      FROM meetings m 
      LEFT JOIN users u ON m.organizer_id = u.id 
      ORDER BY m.date ASC, m.start_time ASC
    `).all();
    const meetings = mtgRes.results;

    // Ambil data attendees beserta nama
    const attRes = await db.prepare(`
      SELECT ma.*, u.name as user_name, u.avatar as user_avatar 
      FROM meeting_attendees ma 
      LEFT JOIN users u ON ma.user_id = u.id
    `).all();
    const allAttendees = attRes.results;

    const data = meetings.map((m: any) => ({
      ...m,
      attendees: allAttendees.filter((a: any) => a.meeting_id === m.id)
    }));

    return c.json({ success: true, data });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

meetingsApi.post('/', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const body = await c.req.json();
    const id = 'mtg_' + Date.now().toString(36);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO meetings (id, title, description, date, start_time, end_time, room_location, is_online, meeting_link, organizer_id, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.title, body.description || '', body.date, body.start_time, body.end_time,
      body.room_location || '', Number(body.is_online || 0), body.meeting_link || null,
      user.sub, body.department || 'General', now
    ).run();

    // Insert participants if any
    if (Array.isArray(body.attendee_ids) && body.attendee_ids.length > 0) {
      for (const userId of body.attendee_ids) {
        await db.prepare(`INSERT INTO meeting_attendees (id, meeting_id, user_id, status) VALUES (?, ?, ?, 'PENDING')`)
          .bind('attnd_' + Date.now().toString(36) + Math.random().toString(36).substring(7), id, userId).run();
      }
    }

    return c.json({ success: true, message: 'Meeting berhasil dibuat' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default meetingsApi;
