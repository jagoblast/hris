import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, Reimbursement } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function ReimbursementsPage(user: JWTPayload) {
  let claimsList: Reimbursement[] = [];
  if (user.role === 'KARYAWAN') {
    const res = await db.prepare('SELECT * FROM reimbursements WHERE user_id = ?').bind(user.sub).all<Reimbursement>();
    claimsList = res.results;
  } else {
    const res = await db.prepare('SELECT * FROM reimbursements').all<Reimbursement>();
    claimsList = res.results;
  }

  const pendingClaims = claimsList.filter(c => c.status === 'PENDING');
  const approvedClaims = claimsList.filter(c => c.status === 'APPROVED');
  const paidClaims = claimsList.filter(c => c.status === 'PAID');

  const totalPendingAmt = pendingClaims.reduce((sum, c) => sum + c.amount, 0);
  const totalApprovedAmt = approvedClaims.reduce((sum, c) => sum + c.amount, 0);
  const totalPaidAmt = paidClaims.reduce((sum, c) => sum + c.amount, 0);

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Klaim & Reimbursement</h2>
          <p class="text-xs text-zinc-400">Pengajuan klaim biaya transportasi, konsumsi meeting, resep medis, dan operasional kantor.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="document.getElementById('reimburse-modal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition">
            ${Icons.Plus()}
            <span>Ajukan Klaim Baru</span>
          </button>
          <a href="/api/v1/export/reimbursements.csv" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-2 shadow-sm transition">
            📥 Export CSV
          </a>
        </div>
      </div>

      <!-- Bento Grid Top Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Menunggu Persetujuan HRD</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-amber-400 font-mono">Rp ${totalPendingAmt.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">${pendingClaims.length} nota permohonan</p>
          </div>
          <div class="text-[10px] font-bold text-amber-400">Pending Review</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Disetujui (Siap Masuk Payroll)</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-blue-400 font-mono">Rp ${totalApprovedAmt.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">${approvedClaims.length} nota siap ditransfer</p>
          </div>
          <div class="text-[10px] font-bold text-blue-400">Approved by HRD</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sudah Dicairkan (Paid)</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-emerald-400 font-mono">Rp ${totalPaidAmt.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">${paidClaims.length} transaksi selesai</p>
          </div>
          <div class="text-[10px] font-bold text-emerald-400">Terbayar Lunas</div>
        </div>
      </div>

      <!-- Bento Claims Table Box -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="font-bold text-white text-base">Riwayat Permohonan Klaim</h3>
          <span class="text-xs text-zinc-500 font-mono">${claimsList.length} total klaim</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                <th class="py-3 px-3">Tgl Kuitansi</th>
                ${user.role !== 'KARYAWAN' ? html`<th class="py-3 px-3">Karyawan</th>` : ''}
                <th class="py-3 px-3">Kategori</th>
                <th class="py-3 px-3">Nominal (Rp)</th>
                <th class="py-3 px-3">Deskripsi & Bukti</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Aksi HRD</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              ${claimsList.map(c => html`
                <tr class="hover:bg-zinc-900/40 transition">
                  <td class="py-3 px-3 font-semibold text-zinc-300 whitespace-nowrap">
                    ${c.receipt_date}
                  </td>
                  ${user.role !== 'KARYAWAN' ? html`
                    <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
                      ${c.user_name}
                      <div class="text-[10px] font-normal text-zinc-500">${c.user_department}</div>
                    </td>
                  ` : ''}
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.category === 'TRANSPORT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      c.category === 'MEDIS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      c.category === 'KONSUMSI' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }">
                      ${c.category}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-bold text-white font-mono text-sm whitespace-nowrap">
                    Rp ${c.amount.toLocaleString('id-ID')}
                  </td>
                  <td class="py-3 px-3 text-zinc-400 max-w-xs">
                    <div>${c.description}</div>
                    ${c.receipt_url ? html`
                      <a href="${c.receipt_url}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-orange-400 font-semibold hover:underline mt-0.5">
                        <span>🧾 Lihat Nota Struk</span>
                      </a>
                    ` : ''}
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      c.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      c.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      c.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }">
                      ${c.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right whitespace-nowrap">
                    ${(user.role === 'ADMIN' || user.role === 'HRD') && c.status === 'PENDING' ? html`
                      <div class="inline-flex items-center gap-1.5">
                        <button onclick="window.approveReimburse('${c.id}')" class="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm">
                          Setujui
                        </button>
                        <button onclick="window.rejectReimburse('${c.id}')" class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold rounded-lg border border-zinc-700">
                          Tolak
                        </button>
                      </div>
                    ` : (user.role === 'ADMIN' || user.role === 'HRD') && c.status === 'APPROVED' ? html`
                      <button onclick="window.payoutReimburse('${c.id}')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm">
                        Cairkan
                      </button>
                    ` : c.status === 'PAID' ? html`
                      <span class="text-[11px] text-emerald-400 font-semibold">Tercairkan ${c.paid_at ? `(${c.paid_at.split('T')[0]})` : ''}</span>
                    ` : html`
                      <span class="text-[11px] text-zinc-500">-</span>
                    `}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Submission Modal -->
      <div id="reimburse-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#0c0c0e] p-6 rounded-3xl shadow-2xl border border-zinc-800 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-bold text-white">Form Pengajuan Reimbursement</h3>
            <button onclick="document.getElementById('reimburse-modal').classList.add('hidden')" class="text-zinc-400 hover:text-white">${Icons.X()}</button>
          </div>

          <form id="reimburse-form" onsubmit="submitReimburseForm(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-zinc-300 mb-1">Kategori Klaim</label>
              <select id="modal-rmb-category" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
                <option value="TRANSPORT">Transportasi (Taksi, Bensin, Tol Klien)</option>
                <option value="KONSUMSI">Konsumsi & Jamuan Meeting Klien</option>
                <option value="MEDIS">Medis & Kesehatan (Resep/Kacamata)</option>
                <option value="OPERASIONAL">Operasional Kantor & ATK</option>
                <option value="PELATIHAN">Pelatihan, Kursus & Sertifikasi</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Nominal Biaya (Rp)</label>
              <input type="number" id="modal-rmb-amount" min="1000" step="1000" placeholder="Contoh: 150000" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono" required>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Tanggal Transaksi / Kuitansi</label>
              <input type="date" id="modal-rmb-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Deskripsi Pengeluaran</label>
              <textarea id="modal-rmb-desc" rows="3" placeholder="Contoh: Grab car kunjungan presentasi proposal ke kantor klien..." class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required></textarea>
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1">Link Bukti Foto Struk / Invoice</label>
              <input type="url" id="modal-rmb-receipt" placeholder="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300" class="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button type="button" onclick="document.getElementById('reimburse-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold">
                Batal
              </button>
              <button type="submit" id="btn-submit-rmb" class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                Kirim Klaim Reimburse
              </button>
            </div>
          </form>
        </div>
      </div>

      <script>
        async function submitReimburseForm(e) {
          e.preventDefault();
          const btn = document.getElementById('btn-submit-rmb');
          btn.disabled = true;

          const payload = {
            category: document.getElementById('modal-rmb-category').value,
            amount: Number(document.getElementById('modal-rmb-amount').value),
            receipt_date: document.getElementById('modal-rmb-date').value,
            description: document.getElementById('modal-rmb-desc').value,
            receipt_url: document.getElementById('modal-rmb-receipt').value || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
          };

          try {
            const res = await fetch('/api/v1/reimbursements', {
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
            window.showToast('Gagal mengajukan reimbursement', 'error');
            btn.disabled = false;
          }
        }
      </script>
    </div>
  `;

  return Layout({
    title: 'Klaim & Reimburse',
    activePath: '/reimbursements',
    user,
    children: content,
  });
}
