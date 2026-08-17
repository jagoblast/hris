import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, Meeting, User } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function MeetingsPage(user: JWTPayload) {
  const meetingsRes = await db.prepare('SELECT * FROM meetings').all<Meeting>();
  const usersRes = await db.prepare('SELECT id, name, position, department FROM users').all<User>();
  const meetingsList = meetingsRes.results;

  const today = new Date().toISOString().split('T')[0];
  const todayMeetings = meetingsList.filter(m => m.date === today);
  const upcomingMeetings = meetingsList.filter(m => m.date > today);

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Jadwal Rapat & Sinkronisasi Tim</h2>
          <p class="text-xs text-zinc-400">Koordinasi meeting internal, room booking, link Google Meet/Zoom, dan status konfirmasi kehadiran.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="document.getElementById('meeting-modal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition">
            ${Icons.Plus()}
            <span>Jadwalkan Rapat Baru</span>
          </button>
        </div>
      </div>

      <!-- Bento Grid Top Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rapat Hari Ini</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${todayMeetings.length}</div>
            <p class="text-xs text-zinc-500 mt-1">Jadwal aktif ${today}</p>
          </div>
          <div class="text-[10px] font-bold text-orange-400">Terkonfirmasi di Kalender</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mendatang (Upcoming)</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${upcomingMeetings.length}</div>
            <p class="text-xs text-zinc-500 mt-1">Agenda pekan ini</p>
          </div>
          <div class="text-[10px] font-bold text-zinc-400">Notifikasi Otomatis Aktif</div>
        </div>

        <div class="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-orange-400 uppercase tracking-wider">Ruang & Video Link</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-white">Hybrid Ready</div>
            <p class="text-xs text-zinc-400 mt-1">Google Meet & Zoom Integration</p>
          </div>
          <div class="text-[10px] text-zinc-300 font-mono">1-Klik Langsung Join</div>
        </div>
      </div>

      <!-- Meetings Bento Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${meetingsList.map(m => {
          const isToday = m.date === today;
          return html`
            <div class="p-6 rounded-3xl bg-[#0c0c0e] border ${isToday ? 'border-orange-500/60 shadow-lg shadow-orange-500/5' : 'border-zinc-800'} flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${isToday ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-300'}">
                      📅 ${m.date} &bull; ${m.start_time} - ${m.end_time} WIB
                    </span>
                    ${m.is_online ? html`
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Online
                      </span>
                    ` : html`
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                        On-Site
                      </span>
                    `}
                  </div>
                  <span class="text-[10px] text-zinc-400 uppercase font-semibold">${m.department}</span>
                </div>

                <h3 class="text-base font-bold text-white mb-1.5">${m.title}</h3>
                <p class="text-xs text-zinc-400 leading-relaxed mb-3">${m.description || 'Tidak ada catatan tambahan.'}</p>

                <div class="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-zinc-500">🏢 Lokasi:</span>
                    <span class="font-semibold text-zinc-200">${m.room_location}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-zinc-500">👤 Penyelenggara:</span>
                    <span class="font-semibold text-zinc-200">${m.organizer_name}</span>
                  </div>
                </div>

                <!-- Attendees status -->
                ${m.attendees && m.attendees.length > 0 ? html`
                  <div class="mt-3 pt-3 border-t border-zinc-800/80">
                    <div class="text-[10px] font-bold text-zinc-400 uppercase mb-2">Daftar Peserta Undangan:</div>
                    <div class="flex flex-wrap gap-1.5">
                      ${m.attendees.map(a => html`
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-zinc-800/60 border border-zinc-700 text-zinc-200">
                          <span class="w-1.5 h-1.5 rounded-full ${a.status === 'CONFIRMED' ? 'bg-emerald-500' : a.status === 'DECLINED' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
                          <span>${a.user_name}</span>
                        </span>
                      `)}
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Actions & RSVP -->
              <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div class="flex items-center gap-1.5">
                  <button onclick="window.rsvpMeeting('${m.id}', 'CONFIRMED')" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs border border-zinc-700 transition">
                    ✓ Hadir
                  </button>
                  <button onclick="window.rsvpMeeting('${m.id}', 'DECLINED')" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-bold text-xs border border-zinc-700 transition">
                    ✕ Absen
                  </button>
                </div>
                ${m.meeting_link ? html`
                  <a href="${m.meeting_link}" target="_blank" class="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition">
                    ${Icons.Video()}
                    <span>Join Room</span>
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>

      <!-- Create Meeting Modal -->
      <div id="meeting-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#0c0c0e] p-6 rounded-3xl shadow-2xl border border-zinc-800 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-bold text-white">Jadwalkan Rapat Tim Baru</h3>
            <button onclick="document.getElementById('meeting-modal').classList.add('hidden')" class="text-zinc-400 hover:text-white">${Icons.X()}</button>
          </div>

          <form id="meeting-form" onsubmit="submitMeetingForm(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-zinc-300 mb-1">Judul / Topik Rapat</label>
              <input type="text" id="modal-mtg-title" placeholder="Contoh: Sprint Review & Q3 Architecture Sync" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500" required>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Agenda / Deskripsi Singkat</label>
              <textarea id="modal-mtg-desc" rows="2" placeholder="Poin-poin pembahasan..." class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500"></textarea>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Tanggal</label>
                <input type="date" id="modal-mtg-date" value="${today}" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Jam Mulai</label>
                <input type="time" id="modal-mtg-start" value="10:00" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Jam Selesai</label>
                <input type="time" id="modal-mtg-end" value="11:30" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Ruangan / Lokasi</label>
                <input type="text" id="modal-mtg-room" value="Ruang Rapat Garuda Lt. 3" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Tipe Meeting</label>
                <select id="modal-mtg-online" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                  <option value="1">Online / Hybrid (Meet/Zoom)</option>
                  <option value="0">Offline (Tatap Muka)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Link Google Meet / Zoom (Opsional)</label>
              <input type="url" id="modal-mtg-link" placeholder="https://meet.google.com/abc-defg-hij" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Undang Peserta (Pilih Anggota Tim)</label>
              <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                ${usersRes.results.map(u => html`
                  <label class="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
                    <input type="checkbox" name="attendee" value="${u.id}" class="accent-orange-500 rounded" checked>
                    <span>${u.name} (${u.department})</span>
                  </label>
                `)}
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button type="button" onclick="document.getElementById('meeting-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold">
                Batal
              </button>
              <button type="submit" id="btn-submit-mtg" class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                Simpan & Buat Rapat
              </button>
            </div>
          </form>
        </div>
      </div>

      <script>
        async function submitMeetingForm(e) {
          e.preventDefault();
          const btn = document.getElementById('btn-submit-mtg');
          btn.disabled = true;

          const checkedAttendees = Array.from(document.querySelectorAll('input[name="attendee"]:checked')).map(cb => cb.value);

          const payload = {
            title: document.getElementById('modal-mtg-title').value,
            description: document.getElementById('modal-mtg-desc').value,
            date: document.getElementById('modal-mtg-date').value,
            start_time: document.getElementById('modal-mtg-start').value,
            end_time: document.getElementById('modal-mtg-end').value,
            room_location: document.getElementById('modal-mtg-room').value,
            is_online: Number(document.getElementById('modal-mtg-online').value),
            meeting_link: document.getElementById('modal-mtg-link').value,
            attendees: checkedAttendees,
          };

          try {
            const res = await fetch('/api/v1/meetings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
              window.showToast(json.message, 'success');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              window.showToast(json.error, 'error');
              btn.disabled = false;
            }
          } catch (err) {
            window.showToast('Gagal menjadwalkan rapat', 'error');
            btn.disabled = false;
          }
        }
      </script>
    </div>
  `;

  return Layout({
    title: 'Jadwal Rapat',
    activePath: '/meetings',
    user,
    children: content,
  });
}
