import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, Attendance, LeaveRequest, Reimbursement, PayrollRecord, Meeting } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function DashboardPage(user: JWTPayload) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch Today's Attendance for User
  const todayAtt = await db
    .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
    .bind(user.sub, today)
    .first<Attendance>();

  // 2. Fetch User's Leaves
  const leaves = await db.prepare('SELECT * FROM leaves').all<LeaveRequest>();
  const userLeaves = leaves.results.filter(l => l.user_id === user.sub);
  const pendingLeaves = leaves.results.filter(l => l.status === 'PENDING');
  const remainingQuota = 12 - userLeaves.filter(l => l.status === 'APPROVED' && l.leave_type === 'TAHUNAN').reduce((sum, l) => sum + l.total_days, 0);

  // 3. Fetch Reimbursements
  const claims = await db.prepare('SELECT * FROM reimbursements').all<Reimbursement>();
  const recentClaims = claims.results.slice(0, 4);

  // 4. Fetch Payroll
  const payrolls = await db.prepare('SELECT * FROM payroll').all<PayrollRecord>();
  const totalPayrollEst = payrolls.results.reduce((sum, p) => sum + p.net_salary, 0);

  // 5. Fetch Meetings
  const allMeetings = await db.prepare('SELECT * FROM meetings').all<Meeting>();
  const upcomingMeetings = allMeetings.results.slice(0, 3);

  const isCheckedIn = !!todayAtt?.check_in_time;
  const isCheckedOut = !!todayAtt?.check_out_time;

  const content = html`
    <div class="space-y-6">
      <!-- Master Bento Grid Layout (Desktop 4-Col, Mobile Responsive) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Bento Card 1: Absensi Real-time (Span 2 Cols) -->
        <div class="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex flex-col justify-between shadow-sm space-y-4">
          <div class="flex justify-between items-start">
            <span class="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Absensi Real-time</span>
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${
              isCheckedOut 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : isCheckedIn 
                ? (todayAtt?.is_late ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30')
                : 'bg-zinc-700/50 text-zinc-300'
            }">
              ${isCheckedOut ? 'SUDAH CHECK-OUT' : isCheckedIn ? (todayAtt?.is_late ? 'HADIR (TELAT)' : 'ACTIVE') : 'BELUM ABSEN'}
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div id="punch-live-clock" class="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                --:--:-- WIB
              </div>
              <p class="text-zinc-400 text-xs mt-1">
                ${isCheckedIn ? `Check-in pukul ${todayAtt?.check_in_time} WIB (GPS Verified)` : 'Check-in otomatis terdeteksi via GPS kantor'}
              </p>
            </div>

            <div class="shrink-0 flex items-center gap-2">
              ${!isCheckedIn ? html`
                <button id="btn-check-in" onclick="window.doCheckIn()" class="bg-orange-500 hover:bg-orange-600 active:scale-98 px-5 py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg shadow-orange-500/25 transition">
                  Check In Masuk
                </button>
              ` : !isCheckedOut ? html`
                <button id="btn-check-out" onclick="window.doCheckOut()" class="bg-orange-600 hover:bg-orange-700 active:scale-98 px-5 py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition">
                  Check Out Pulang
                </button>
              ` : html`
                <span class="px-4 py-3 rounded-2xl bg-zinc-800 text-emerald-400 text-xs font-bold border border-zinc-700">
                  ✅ Selesai (${todayAtt?.work_hours || 8} Jam)
                </span>
              `}
            </div>
          </div>
        </div>

        <!-- Bento Card 2: Pengajuan Cuti (Span 1 Col) -->
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <p class="text-zinc-400 text-xs font-medium">Sisa Kuota Cuti</p>
            <span class="text-lg">📅</span>
          </div>
          <div class="my-3">
            <p class="text-3xl font-bold text-white font-mono">${remainingQuota} <span class="text-xs font-normal text-zinc-500">Hari</span></p>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-orange-400 font-semibold">${pendingLeaves.length} Menunggu Approval</span>
            <a href="/leaves" class="text-zinc-400 hover:text-white font-bold">&rarr;</a>
          </div>
        </div>

        <!-- Bento Card 3: Payroll Periode Ini (Span 1 Col) -->
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <p class="text-zinc-400 text-xs font-medium">Payroll Periode Ini</p>
            <span class="text-lg">💸</span>
          </div>
          <div class="my-3">
            <p class="text-2xl font-bold text-white font-mono">Rp ${(totalPayrollEst / 1000000).toFixed(1)}Jt</p>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Estimasi Terbayar Otomatis</span>
          </div>
        </div>

        <!-- Bento Card 4: Rapat / Meetings (Span 1 Col, 2 Rows on Desktop) -->
        <div class="lg:col-span-1 p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rapat / Meetings</h3>
              <a href="/meetings" class="text-[11px] text-orange-400 hover:underline">Semua</a>
            </div>
            <div class="space-y-3">
              ${upcomingMeetings.map((m, idx) => html`
                <div class="border-l-2 ${idx === 0 ? 'border-orange-500' : 'border-zinc-700'} pl-3 py-1">
                  <p class="text-xs font-bold text-white leading-tight">${m.title}</p>
                  <p class="text-[10px] text-zinc-400 font-mono mt-0.5">${m.date} &bull; ${m.start_time} - ${m.end_time}</p>
                  ${m.meeting_link ? html`
                    <a href="${m.meeting_link}" target="_blank" class="inline-block mt-1 text-[10px] text-orange-400 font-bold hover:underline">
                      Join Room &rarr;
                    </a>
                  ` : ''}
                </div>
              `)}
            </div>
          </div>
          <a href="/meetings" class="block w-full text-center py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 border border-zinc-800 transition">
            + Tambah Rapat
          </a>
        </div>

        <!-- Bento Card 5: Klaim & Reimburse Terbaru (Span 2 Cols, 2 Rows on Desktop) -->
        <div class="lg:col-span-2 p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 overflow-hidden flex flex-col justify-between space-y-4">
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Klaim & Reimburse Terbaru</h3>
              <a href="/reimbursements" class="text-xs text-orange-500 font-bold hover:underline">Lihat Semua</a>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-zinc-500 text-[10px] uppercase tracking-wider border-b border-zinc-800">
                    <th class="pb-3">Karyawan</th>
                    <th class="pb-3">Kategori</th>
                    <th class="pb-3">Jumlah</th>
                    <th class="pb-3 text-right">Aksi HRD</th>
                  </tr>
                </thead>
                <tbody class="text-xs divide-y divide-zinc-800/80">
                  ${recentClaims.map(c => html`
                    <tr>
                      <td class="py-3 font-semibold text-white">
                        ${c.user_name}
                        <div class="text-[10px] text-zinc-500 font-normal">${c.receipt_date}</div>
                      </td>
                      <td class="py-3 text-zinc-400">${c.category}</td>
                      <td class="py-3 font-mono font-bold text-zinc-200">Rp ${c.amount.toLocaleString('id-ID')}</td>
                      <td class="py-3 text-right">
                        ${c.status === 'PENDING' ? html`
                          <button onclick="window.approveReimburse('${c.id}')" class="text-blue-400 hover:text-blue-300 font-bold text-xs">
                            Approve
                          </button>
                        ` : html`
                          <span class="text-[10px] text-emerald-400 font-semibold">${c.status}</span>
                        `}
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Dikelola otomatis di modul Payroll</span>
            <a href="/reimbursements" class="text-orange-400 font-bold hover:underline">+ Buat Klaim Baru</a>
          </div>
        </div>

        <!-- Bento Card 6: JWT Secure & Android Info (Span 1 Col, 2 Rows on Desktop) -->
        <div class="lg:col-span-1 p-6 rounded-3xl bg-gradient-to-t from-orange-500/10 via-zinc-900 to-transparent border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
          <div class="text-3xl p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700">🔒</div>
          <div>
            <h4 class="text-sm font-bold text-white mb-1">JWT HS256 Secure</h4>
            <p class="text-[10px] text-zinc-400 leading-relaxed px-1">
              Endpoint dienkripsi menggunakan algoritma HS256 untuk keamanan data Android Mobile App & SSR Hono.
            </p>
          </div>
          <a href="/api-docs" class="mt-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-[10px] text-orange-400 font-mono border border-zinc-700 transition">
            Buka API Sandbox &rarr;
          </a>
        </div>

      </div>

      <!-- Additional Bento Section: Quick Actions & CSV Exports -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">Export Data Presensi</div>
            <div class="text-[10px] text-zinc-500">Format CSV siap audit & payroll</div>
          </div>
          <a href="/api/v1/export/attendance.csv" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700">
            Unduh CSV
          </a>
        </div>

        <div class="p-5 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">Laporan Cuti Karyawan</div>
            <div class="text-[10px] text-zinc-500">Rekapitulasi sisa kuota & izin</div>
          </div>
          <a href="/api/v1/export/leaves.csv" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700">
            Unduh CSV
          </a>
        </div>

        <div class="p-5 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">Klaim Reimbursement</div>
            <div class="text-[10px] text-zinc-500">Daftar nota biaya transport & medis</div>
          </div>
          <a href="/api/v1/export/reimbursements.csv" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700">
            Unduh CSV
          </a>
        </div>
      </div>
    </div>
  `;

  return Layout({
    title: 'Dashboard Utama',
    activePath: '/',
    user,
    children: content,
  });
}
