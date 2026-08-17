import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, PayrollRecord } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function PayrollPage(user: JWTPayload, queryMonth?: number, queryYear?: number) {
  const currentYear = queryYear || 2026;
  const currentMonth = queryMonth || 7;

  let payrollList: PayrollRecord[] = [];
  if (user.role === 'KARYAWAN') {
    const res = await db.prepare('SELECT * FROM payroll WHERE user_id = ?').bind(user.sub).all<PayrollRecord>();
    payrollList = res.results;
  } else {
    const res = await db.prepare('SELECT * FROM payroll').all<PayrollRecord>();
    payrollList = res.results;
  }

  const filteredList = payrollList.filter(p => Number(p.period_month) === currentMonth && Number(p.period_year) === currentYear);
  const totalNetSalary = (filteredList.length > 0 ? filteredList : payrollList).reduce((sum, p) => sum + p.net_salary, 0);
  const totalLateDeductions = (filteredList.length > 0 ? filteredList : payrollList).reduce((sum, p) => sum + p.late_deduction, 0);
  const totalReimburses = (filteredList.length > 0 ? filteredList : payrollList).reduce((sum, p) => sum + p.reimburse_pay, 0);
  const totalBPJSTax = (filteredList.length > 0 ? filteredList : payrollList).reduce((sum, p) => sum + p.bpjs_deduction + p.tax_deduction, 0);

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Payroll Otomatis & Slip Gaji</h2>
          <p class="text-xs text-zinc-400">Kalkulasi take-home pay otomatis berdasarkan log presensi D1, potongan denda keterlambatan, lembur, dan reimburse.</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${(user.role === 'ADMIN' || user.role === 'HRD') ? html`
            <button onclick="window.generateMonthlyPayroll(${currentMonth}, ${currentYear})" class="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition">
              <span>⚡ Proses Payroll Otomatis (${currentMonth}/${currentYear})</span>
            </button>
          ` : ''}
          <a href="/api/v1/export/payroll.csv" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-2 shadow-sm transition">
            📥 Export CSV
          </a>
        </div>
      </div>

      <!-- Bento Grid Financial Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Take-Home Pay</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-emerald-400 font-mono">Rp ${totalNetSalary.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">Gaji bersih terdistribusi</p>
          </div>
          <div class="text-[10px] font-bold text-emerald-400">Terhitung Bersih</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Potongan Telat Otomatis</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-rose-400 font-mono">Rp ${totalLateDeductions.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">Dihitung dari log absensi</p>
          </div>
          <div class="text-[10px] font-bold text-rose-400">Penalti Keterlambatan D1</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reimburse Masuk Payroll</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-orange-400 font-mono">Rp ${totalReimburses.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">Klaim disetujui HRD</p>
          </div>
          <div class="text-[10px] font-bold text-orange-400">Cair Bersama Gaji</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total BPJS & Pajak PPh21</span>
          <div class="my-3">
            <div class="text-2xl font-bold text-zinc-200 font-mono">Rp ${totalBPJSTax.toLocaleString('id-ID')}</div>
            <p class="text-xs text-zinc-500 mt-1">Kewajiban regulasi</p>
          </div>
          <div class="text-[10px] font-bold text-zinc-500">Potongan Wajib</div>
        </div>
      </div>

      <!-- Bento Payroll Records Table Box -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="font-bold text-white text-base">Rekapitulasi Slip Gaji Karyawan</h3>
          <span class="text-xs text-zinc-500 font-mono">${payrollList.length} slip</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                <th class="py-3 px-3">Periode</th>
                ${user.role !== 'KARYAWAN' ? html`<th class="py-3 px-3">Karyawan</th>` : ''}
                <th class="py-3 px-3">Gaji Pokok</th>
                <th class="py-3 px-3">Tunjangan</th>
                <th class="py-3 px-3">Lembur/Klaim</th>
                <th class="py-3 px-3">Potongan (Telat/BPJS/Tax)</th>
                <th class="py-3 px-3">Take-Home Pay</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              ${payrollList.map(p => {
                const totalDeductions = p.late_deduction + p.bpjs_deduction + p.tax_deduction;
                return html`
                  <tr class="hover:bg-zinc-900/40 transition">
                    <td class="py-3 px-3 font-semibold text-zinc-300 whitespace-nowrap">
                      ${p.period_month}/${p.period_year}
                    </td>
                    ${user.role !== 'KARYAWAN' ? html`
                      <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
                        ${p.user_name}
                        <div class="text-[10px] font-normal text-zinc-500">${p.user_position} &bull; ${p.user_department}</div>
                      </td>
                    ` : ''}
                    <td class="py-3 px-3 font-mono text-zinc-300 whitespace-nowrap">
                      Rp ${p.base_salary.toLocaleString('id-ID')}
                    </td>
                    <td class="py-3 px-3 text-zinc-400 whitespace-nowrap">
                      Rp ${(p.allowance_transport + p.allowance_meal).toLocaleString('id-ID')}
                    </td>
                    <td class="py-3 px-3 text-orange-400 font-mono font-semibold whitespace-nowrap">
                      + Rp ${(p.overtime_pay + p.reimburse_pay).toLocaleString('id-ID')}
                    </td>
                    <td class="py-3 px-3 text-rose-400 font-mono font-semibold whitespace-nowrap">
                      - Rp ${totalDeductions.toLocaleString('id-ID')}
                      ${p.late_deduction > 0 ? html`<span class="block text-[10px] text-amber-400">(Telat: Rp ${p.late_deduction.toLocaleString('id-ID')})</span>` : ''}
                    </td>
                    <td class="py-3 px-3 font-bold text-emerald-400 font-mono text-sm whitespace-nowrap">
                      Rp ${p.net_salary.toLocaleString('id-ID')}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        p.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        p.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-zinc-800 text-zinc-400'
                      }">
                        ${p.status}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                      <button onclick="window.viewPayslip('${p.id}')" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 ml-auto border border-zinc-700 transition">
                        <span>📄 Lihat Slip</span>
                      </button>
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payslip Modal Container -->
      <div id="payslip-modal" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target === this) this.classList.add('hidden')">
        <div class="w-full max-w-2xl bg-[#0c0c0e] rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden" id="payslip-modal-content">
          <!-- Populated dynamically via window.viewPayslip -->
        </div>
      </div>
    </div>
  `;

  return Layout({
    title: 'Payroll Otomatis',
    activePath: '/payroll',
    user,
    children: content,
  });
}
