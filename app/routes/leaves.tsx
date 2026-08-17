import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, LeaveRequest, User } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function LeavesPage(user: JWTPayload) {
  // Fetch user data for quota
  const userData = await db.prepare('SELECT leave_quota FROM users WHERE id = ?').bind(user.sub).first<User>();

  // Fetch leaves
  let leavesList: LeaveRequest[] = [];
  if (user.role === 'KARYAWAN') {
    const res = await db.prepare('SELECT * FROM leaves WHERE user_id = ?').bind(user.sub).all<LeaveRequest>();
    leavesList = res.results;
  } else {
    const res = await db.prepare('SELECT * FROM leaves').all<LeaveRequest>();
    leavesList = res.results;
  }

  const quota = userData?.leave_quota ?? 12;
  const approvedLeaves = leavesList.filter(l => l.status === 'APPROVED');
  const usedAnnual = approvedLeaves.filter(l => l.leave_type === 'TAHUNAN').reduce((sum, l) => sum + l.total_days, 0);
  const pendingCount = leavesList.filter(l => l.status === 'PENDING').length;

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Manajemen Cuti & Izin</h2>
          <p class="text-xs text-zinc-400">Pengajuan cuti online terintegrasi, persetujuan 1-klik HRD, dan kalkulasi otomatis kuota tahunan.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="document.getElementById('leave-modal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition">
            ${Icons.Plus()}
            <span>Ajukan Cuti / Izin</span>
          </button>
          <a href="/api/v1/export/leaves.csv" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-2 shadow-sm transition">
            📥 Export CSV
          </a>
        </div>
      </div>

      <!-- Bento Grid Top Row: Quota Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sisa Kuota Cuti</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-orange-400 font-mono">${quota} <span class="text-xs font-normal text-zinc-500">Hari</span></div>
            <p class="text-xs text-zinc-500 mt-1">Tahun ${new Date().getFullYear()}</p>
          </div>
          <div class="text-[10px] font-bold text-emerald-400">Otomatis dipotong saat approve</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cuti Terpakai</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${usedAnnual} <span class="text-xs font-normal text-zinc-500">Hari</span></div>
            <p class="text-xs text-zinc-500 mt-1">Disetujui HRD</p>
          </div>
          <div class="text-[10px] font-bold text-zinc-400">Tercatat di Cloud D1</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Menunggu Persetujuan</span>
          <div class="my-3">
            <div class="text-3xl font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-white'} font-mono">${pendingCount} <span class="text-xs font-normal text-zinc-500">Kasus</span></div>
            <p class="text-xs text-zinc-500 mt-1">Antrean HRD</p>
          </div>
          <div class="text-[10px] font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-zinc-400'}">${pendingCount > 0 ? 'Review Diperlukan' : 'Semua Bersih'}</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Disetujui</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-blue-400 font-mono">${approvedLeaves.length} <span class="text-xs font-normal text-zinc-500">Kasus</span></div>
            <p class="text-xs text-zinc-500 mt-1">Termasuk cuti sakit & khusus</p>
          </div>
          <div class="text-[10px] font-bold text-blue-400">Arsip HR Terkualifikasi</div>
        </div>
      </div>

      <!-- Leaves Bento Table Box -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="font-bold text-white text-base">Daftar Pengajuan Cuti & Izin</h3>
          <span class="text-xs text-zinc-500 font-mono">${leavesList.length} total</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                <th class="py-3 px-3">Tgl Pengajuan</th>
                ${user.role !== 'KARYAWAN' ? html`<th class="py-3 px-3">Karyawan</th>` : ''}
                <th class="py-3 px-3">Tipe</th>
                <th class="py-3 px-3">Rentang Tanggal</th>
                <th class="py-3 px-3">Durasi</th>
                <th class="py-3 px-3">Alasan</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Aksi HRD</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              ${leavesList.map(l => html`
                <tr class="hover:bg-zinc-900/40 transition">
                  <td class="py-3 px-3 font-semibold text-zinc-300 whitespace-nowrap">
                    ${l.created_at.split('T')[0]}
                  </td>
                  ${user.role !== 'KARYAWAN' ? html`
                    <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
                      ${l.user_name}
                      <div class="text-[10px] font-normal text-zinc-500">${l.user_department}</div>
                    </td>
                  ` : ''}
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.leave_type === 'TAHUNAN' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      l.leave_type === 'SAKIT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }">
                      ${l.leave_type}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-semibold text-zinc-200 whitespace-nowrap">
                    ${l.start_date} s/d ${l.end_date}
                  </td>
                  <td class="py-3 px-3 font-bold text-white font-mono">
                    ${l.total_days} Hari
                  </td>
                  <td class="py-3 px-3 text-zinc-400 max-w-xs truncate">
                    ${l.reason}
                    ${l.attachment_url ? html`<a href="${l.attachment_url}" target="_blank" class="text-orange-400 font-bold ml-1 hover:underline">[Bukti]</a>` : ''}
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      l.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      l.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }">
                      ${l.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right whitespace-nowrap">
                    ${(user.role === 'ADMIN' || user.role === 'HRD') && l.status === 'PENDING' ? html`
                      <div class="inline-flex items-center gap-1.5">
                        <button onclick="window.approveLeave('${l.id}')" class="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm">
                          ✓ Approve
                        </button>
                        <button onclick="window.rejectLeave('${l.id}')" class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold rounded-lg border border-zinc-700">
                          ✕ Reject
                        </button>
                      </div>
                    ` : l.status === 'APPROVED' ? html`
                      <span class="text-[11px] text-emerald-400 font-semibold">Disetujui ${l.approved_by_name ? `(${l.approved_by_name})` : ''}</span>
                    ` : l.status === 'REJECTED' ? html`
                      <span class="text-[11px] text-rose-400 font-semibold">Ditolak</span>
                    ` : html`
                      <span class="text-[11px] text-zinc-500">Menunggu HRD</span>
                    `}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Submission Modal -->
      <div id="leave-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#0c0c0e] p-6 rounded-3xl shadow-2xl border border-zinc-800 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-bold text-white">Form Pengajuan Cuti / Izin</h3>
            <button onclick="document.getElementById('leave-modal').classList.add('hidden')" class="text-zinc-400 hover:text-white">${Icons.X()}</button>
          </div>

          <form id="leave-form" onsubmit="submitLeaveForm(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-zinc-300 mb-1">Tipe Cuti / Izin</label>
              <select id="modal-leave-type" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
                <option value="TAHUNAN">Cuti Tahunan (Sisa kuota: ${quota} hari)</option>
                <option value="SAKIT">Izin Sakit (Dengan surat dokter)</option>
                <option value="IZIN_KHUSUS">Izin Khusus / Keperluan Mendesak</option>
                <option value="MENIKAH">Cuti Menikah (3 Hari)</option>
                <option value="MELAHIRKAN">Cuti Melahirkan (3 Bulan)</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Tanggal Mulai</label>
                <input type="date" id="modal-start-date" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Tanggal Selesai</label>
                <input type="date" id="modal-end-date" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Total Hari Kerja</label>
              <input type="number" id="modal-total-days" min="1" max="90" value="1" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono" required>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Alasan Pengajuan</label>
              <textarea id="modal-reason" rows="3" placeholder="Contoh: Keperluan keluarga mendesak di kampung halaman..." class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required></textarea>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Link Lampiran / Surat Dokter (Opsional)</label>
              <input type="url" id="modal-attachment" placeholder="https://example.com/surat-dokter.jpg" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button type="button" onclick="document.getElementById('leave-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold">
                Batal
              </button>
              <button type="submit" id="btn-submit-leave" class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                Kirim Pengajuan Cuti
              </button>
            </div>
          </form>
        </div>
      </div>

      <script>
        async function submitLeaveForm(e) {
          e.preventDefault();
          const btn = document.getElementById('btn-submit-leave');
          btn.disabled = true;

          const payload = {
            leave_type: document.getElementById('modal-leave-type').value,
            start_date: document.getElementById('modal-start-date').value,
            end_date: document.getElementById('modal-end-date').value,
            total_days: Number(document.getElementById('modal-total-days').value),
            reason: document.getElementById('modal-reason').value,
            attachment_url: document.getElementById('modal-attachment').value,
          };

          try {
            const res = await fetch('/api/v1/leaves', {
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
            window.showToast('Gagal mengajukan cuti', 'error');
            btn.disabled = false;
          }
        }
      </script>
    </div>
  `;

  return Layout({
    title: 'Cuti & Izin',
    activePath: '/leaves',
    user,
    children: content,
  });
}
