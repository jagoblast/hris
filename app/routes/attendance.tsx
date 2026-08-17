import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, Attendance } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function AttendancePage(user: JWTPayload) {
  const today = new Date().toISOString().split('T')[0];

  // Fetch Attendance records
  let attList: Attendance[] = [];
  if (user.role === 'KARYAWAN') {
    const res = await db.prepare('SELECT * FROM attendance WHERE user_id = ?').bind(user.sub).all<Attendance>();
    attList = res.results;
  } else {
    const res = await db.prepare('SELECT * FROM attendance').all<Attendance>();
    attList = res.results;
  }

  // Today's record for user
  const todayAtt = attList.find(a => a.user_id === user.sub && a.date === today);
  const isCheckedIn = !!todayAtt?.check_in_time;
  const isCheckedOut = !!todayAtt?.check_out_time;

  // Stats
  const totalPresent = attList.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const totalLate = attList.filter(a => a.is_late === 1).length;
  const totalWorkHours = attList.reduce((sum, a) => sum + (a.work_hours || 0), 0);

  const content = html`
    <div class="space-y-6">
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Presensi Online & Deteksi Telat</h2>
          <p class="text-xs text-zinc-400">Pencatatan jam masuk/pulang GPS, deteksi keterlambatan setelah 08:30 WIB, dan kalkulasi jam lembur.</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="/api/v1/export/attendance.csv" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-2 shadow-sm transition">
            📥 Unduh Laporan CSV
          </a>
        </div>
      </div>

      <!-- Bento Grid Top Row: Punch Terminal & Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Punch Card Terminal -->
        <div class="p-6 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Terminal Presensi</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            
            <div class="text-center p-4 rounded-2xl bg-black/40 border border-zinc-700/60 my-2">
              <div class="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Server Clock (WIB)</div>
              <div id="punch-live-clock" class="text-3xl font-mono font-bold text-white tracking-tight">--:--:-- WIB</div>
              <div class="text-[10px] text-orange-400 font-semibold mt-1">Batas Tepat Waktu: 08:30:00 WIB</div>
            </div>

            <div class="space-y-2 mb-3 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500">Lokasi:</span>
                <span class="font-semibold text-zinc-200">PT Nusantara Digital (Jakarta)</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500">Status:</span>
                <span class="font-bold ${isCheckedOut ? 'text-blue-400' : isCheckedIn ? (todayAtt?.is_late ? 'text-amber-400' : 'text-emerald-400') : 'text-zinc-400'}">
                  ${isCheckedOut ? 'Sudah Check-Out' : isCheckedIn ? (todayAtt?.is_late ? `Terlambat ${todayAtt.late_minutes} Menit` : 'Tepat Waktu') : 'Belum Absen'}
                </span>
              </div>
            </div>

            <input type="text" id="checkin-notes" placeholder="Catatan kerja / WFH / keperluan (opsional)" class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500" value="${todayAtt?.notes || ''}" ${isCheckedOut ? 'disabled' : ''}>
          </div>

          <div class="space-y-2">
            ${!isCheckedIn ? html`
              <button id="btn-check-in" onclick="window.doCheckIn()" class="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition">
                Check In Masuk Sekarang
              </button>
            ` : !isCheckedOut ? html`
              <button id="btn-check-out" onclick="window.doCheckOut()" class="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition">
                Check Out Pulang
              </button>
            ` : html`
              <div class="p-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-emerald-400 font-bold text-center">
                ✅ Absensi selesai hari ini (${todayAtt?.check_in_time} - ${todayAtt?.check_out_time} WIB)
              </div>
            `}
          </div>
        </div>

        <!-- 3 Bento Metric Cards -->
        <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Kehadiran</span>
            <div class="my-3">
              <div class="text-3xl font-bold text-white font-mono">${totalPresent} <span class="text-xs font-normal text-zinc-500">Hari</span></div>
              <p class="text-xs text-zinc-500 mt-1">Bulan berjalan</p>
            </div>
            <div class="text-[10px] font-bold text-emerald-400">100% Tercatat di D1</div>
          </div>

          <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Terlambat (> 08:30)</span>
            <div class="my-3">
              <div class="text-3xl font-bold ${totalLate > 0 ? 'text-amber-400' : 'text-white'} font-mono">${totalLate} <span class="text-xs font-normal text-zinc-500">Kali</span></div>
              <p class="text-xs text-zinc-500 mt-1">Dipotong otomatis di payroll</p>
            </div>
            <div class="text-[10px] font-bold ${totalLate > 0 ? 'text-amber-400' : 'text-zinc-400'}">${totalLate > 0 ? 'Denda Terkalkulasi' : 'Disiplin Tinggi'}</div>
          </div>

          <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Akumulasi Jam Kerja</span>
            <div class="my-3">
              <div class="text-3xl font-bold text-white font-mono">${totalWorkHours.toFixed(1)} <span class="text-xs font-normal text-zinc-500">Jam</span></div>
              <p class="text-xs text-zinc-500 mt-1">Rata-rata 8 jam/hari</p>
            </div>
            <div class="text-[10px] font-bold text-blue-400">Termasuk Jam Lembur</div>
          </div>

          <!-- Bento Rule Banner -->
          <div class="sm:col-span-3 p-5 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex items-start gap-3">
            <span class="text-xl">⏱️</span>
            <div class="text-xs">
              <div class="font-bold text-white">Sistem Deteksi Keterlambatan Otomatis</div>
              <p class="text-zinc-400 mt-0.5 leading-relaxed">
                Check-in di atas jam <strong>08:30:00 WIB</strong> otomatis tercatat sebagai <strong>LATE</strong> dan dikalkulasikan denda per menit untuk potongan slip gaji bulanan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Records Table Bento Box -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="font-bold text-white text-base">Riwayat Log Absensi Lengkap</h3>
          <span class="text-xs text-zinc-500 font-mono">${attList.length} data</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                <th class="py-3 px-3">Tanggal</th>
                ${user.role !== 'KARYAWAN' ? html`<th class="py-3 px-3">Karyawan</th>` : ''}
                <th class="py-3 px-3">Check-In</th>
                <th class="py-3 px-3">Check-Out</th>
                <th class="py-3 px-3">Durasi</th>
                <th class="py-3 px-3">Keterlambatan</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3">Lokasi / Catatan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              ${attList.map(a => html`
                <tr class="hover:bg-zinc-900/40 transition">
                  <td class="py-3 px-3 font-semibold text-zinc-200 whitespace-nowrap">
                    ${a.date}
                  </td>
                  ${user.role !== 'KARYAWAN' ? html`
                    <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
                      ${a.user_name}
                      <div class="text-[10px] font-normal text-zinc-500">${a.user_department}</div>
                    </td>
                  ` : ''}
                  <td class="py-3 px-3 font-mono text-emerald-400">
                    ${a.check_in_time ? `${a.check_in_time} WIB` : '-'}
                  </td>
                  <td class="py-3 px-3 font-mono text-zinc-300">
                    ${a.check_out_time ? `${a.check_out_time} WIB` : '-'}
                  </td>
                  <td class="py-3 px-3 font-semibold text-zinc-300">
                    ${a.work_hours ? `${a.work_hours} Jam` : '-'}
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    ${a.is_late ? html`
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Telat ${a.late_minutes} mnt
                      </span>
                    ` : html`
                      <span class="text-zinc-500 text-[10px]">Tepat Waktu</span>
                    `}
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      a.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      a.status === 'LATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      a.status === 'LEAVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }">
                      ${a.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-zinc-400 text-[11px] max-w-xs truncate">
                    ${a.check_in_location || a.notes || '-'}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return Layout({
    title: 'Presensi Online',
    activePath: '/attendance',
    user,
    children: content,
  });
}
