import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';
import { Meeting } from '../../types';

const meetingsApi = new Hono();
meetingsApi.use('*', requireAuth());

// GET /api/v1/meetings
meetingsApi.get('/', async (c) => {
  const date = c.req.query('date');
  let res;

  if (date) {
    res = await db.prepare('SELECT * FROM meetings WHERE date = ?').bind(date).all<Meeting>();
  } else {
    res = await db.prepare('SELECT * FROM meetings').all<Meeting>();
  }

  return c.json({
    success: true,
    total: res.results.length,
    data: res.results,
  });
});

// POST /api/v1/meetings
meetingsApi.post('/', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json();
    const { title, description, date, start_time, end_time, room_location, is_online, meeting_link, attendees } = body;

    if (!title || !date || !start_time || !end_time || !room_location) {
      return c.json({ success: false, error: 'Judul, tanggal, jam mulai, jam selesai, dan ruangan wajib diisi.' }, 400);
    }

    const meetingId = `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await db
      .prepare(
        'INSERT INTO meetings (id, title, description, date, start_time, end_time, room_location, is_online, meeting_link, organizer_id, department, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        meetingId,
        title,
        description || '',
        date,
        start_time,
        end_time,
        room_location,
        is_online ? 1 : 0,
        meeting_link || null,
        user.sub,
        user.department
      )
      .run();

    // Add attendees if provided
    if (Array.isArray(attendees) && attendees.length > 0) {
      for (const attendeeUserId of attendees) {
        const atndId = `atnd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db
          .prepare('INSERT INTO meeting_attendees (id, meeting_id, user_id, status) VALUES (?, ?, ?, ?)')
          .bind(atndId, meetingId, attendeeUserId, attendeeUserId === user.sub ? 'CONFIRMED' : 'PENDING')
          .run();
      }
    }

    return c.json({
      success: true,
      message: 'Jadwal rapat tim berhasil dibuat dan undangan dikirim ke peserta.',
      data: { id: meetingId },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/v1/meetings/:id/rsvp
meetingsApi.post('/:id/rsvp', async (c) => {
  try {
    const user = c.get('user')!;
    const meetingId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body; // 'CONFIRMED' | 'DECLINED'

    if (!['CONFIRMED', 'DECLINED'].includes(status)) {
      return c.json({ success: false, error: 'Status RSVP tidak valid.' }, 400);
    }

    await db
      .prepare('UPDATE meeting_attendees SET status = ? WHERE meeting_id = ? AND user_id = ?')
      .bind(status, meetingId, user.sub)
      .run();

    return c.json({
      success: true,
      message: `Konfirmasi kehadiran: ${status === 'CONFIRMED' ? 'Hadir' : 'Tidak Dapat Hadir'}.`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default meetingsApi;
