import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, User } from '../../src/types';
import { db } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function EmployeesPage(user: JWTPayload) {
  const usersRes = await db.prepare('SELECT * FROM users').all<User>();
  const usersList = usersRes.results;

  const totalEmployees = usersList.length;
  const totalAdmins = usersList.filter(u => u.role === 'ADMIN').length;
  const totalHRD = usersList.filter(u => u.role === 'HRD').length;
  const totalStaff = usersList.filter(u => u.role === 'KARYAWAN').length;

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Direktori & Manajemen Karyawan</h2>
          <p class="text-xs text-zinc-400">Kelola data seluruh karyawan, role hak akses, konfigurasi gaji pokok & tunjangan, dan saldo cuti.</p>
        </div>
        <div class="flex items-center gap-2">
          ${user.role === 'ADMIN' ? html`
            <button onclick="document.getElementById('user-modal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition">
              ${Icons.Plus()}
              <span>Tambah Karyawan Baru</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Bento Grid Metric Row -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Karyawan Aktif</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${totalEmployees}</div>
            <p class="text-xs text-zinc-500 mt-1">Terdaftar di Cloud D1</p>
          </div>
          <div class="text-[10px] font-bold text-orange-400">100% Status Active</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Staff / Karyawan</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${totalStaff}</div>
            <p class="text-xs text-zinc-500 mt-1">Engineering, Product & Marketing</p>
          </div>
          <div class="text-[10px] font-bold text-zinc-400">Portal Absensi & Slip</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tim HRD Manager</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${totalHRD}</div>
            <p class="text-xs text-zinc-500 mt-1">Approval & Payroll Access</p>
          </div>
          <div class="text-[10px] font-bold text-blue-400">HR Super Role</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Administrator</span>
          <div class="my-3">
            <div class="text-3xl font-bold text-white font-mono">${totalAdmins}</div>
            <p class="text-xs text-zinc-500 mt-1">Full Root & Security</p>
          </div>
          <div class="text-[10px] font-bold text-purple-400">HS256 Key Manager</div>
        </div>
      </div>

      <!-- Employees Bento Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${usersList.map(u => {
          const roleBadge = u.role === 'ADMIN' 
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : u.role === 'HRD'
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

          return html`
            <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-start justify-between mb-3">
                  <div class="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                    ${u.avatar ? html`<img src="${u.avatar}" alt="${u.name}" class="w-full h-full object-cover">` : u.name.charAt(0)}
                  </div>
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleBadge}">
                    ${u.role}
                  </span>
                </div>

                <h3 class="text-base font-bold text-white mb-0.5">${u.name}</h3>
                <div class="text-xs font-semibold text-orange-400 mb-1">${u.position}</div>
                <div class="text-xs text-zinc-500 mb-3">${u.department} &bull; NIP: ${u.nip}</div>

                <div class="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 text-xs space-y-1.5">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Email:</span>
                    <span class="font-mono text-zinc-300 text-[11px]">${u.email}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Gaji Pokok:</span>
                    <span class="font-semibold text-zinc-200">Rp ${u.base_salary.toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Sisa Cuti:</span>
                    <span class="font-semibold text-emerald-400">${u.leave_quota} Hari</span>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Join: ${u.join_date}</span>
                <span class="text-emerald-400 font-bold">● Active</span>
              </div>
            </div>
          `;
        })}
      </div>

      <!-- Add Employee Modal (Admin Only) -->
      <div id="user-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#0c0c0e] p-6 rounded-3xl shadow-2xl border border-zinc-800 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-bold text-white">Tambah Karyawan Baru</h3>
            <button onclick="document.getElementById('user-modal').classList.add('hidden')" class="text-zinc-400 hover:text-white">${Icons.X()}</button>
          </div>

          <form id="user-form" onsubmit="submitUserForm(event)" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">NIP Karyawan</label>
                <input type="text" id="modal-emp-nip" placeholder="EMP-2026-006" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Nama Lengkap</label>
                <input type="text" id="modal-emp-name" placeholder="Nama Karyawan..." class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Email Kantor</label>
                <input type="email" id="modal-emp-email" placeholder="nama@nusantara.id" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Password</label>
                <input type="password" id="modal-emp-pass" value="karyawan123" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Role Akun</label>
                <select id="modal-emp-role" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                  <option value="KARYAWAN">Karyawan</option>
                  <option value="HRD">HRD</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Departemen</label>
                <input type="text" id="modal-emp-dept" value="Engineering" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Jabatan</label>
                <input type="text" id="modal-emp-pos" value="Software Engineer" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Gaji Pokok (Rp)</label>
                <input type="number" id="modal-emp-salary" value="7500000" step="500000" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
              <div>
                <label class="block font-bold text-zinc-300 mb-1">Kuota Cuti (Hari/Tahun)</label>
                <input type="number" id="modal-emp-quota" value="12" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white" required>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button type="button" onclick="document.getElementById('user-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold">
                Batal
              </button>
              <button type="submit" id="btn-submit-emp" class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                Simpan Karyawan
              </button>
            </div>
          </form>
        </div>
      </div>

      <script>
        async function submitUserForm(e) {
          e.preventDefault();
          const btn = document.getElementById('btn-submit-emp');
          btn.disabled = true;

          const payload = {
            nip: document.getElementById('modal-emp-nip').value,
            name: document.getElementById('modal-emp-name').value,
            email: document.getElementById('modal-emp-email').value,
            password: document.getElementById('modal-emp-pass').value,
            role: document.getElementById('modal-emp-role').value,
            department: document.getElementById('modal-emp-dept').value,
            position: document.getElementById('modal-emp-pos').value,
            base_salary: Number(document.getElementById('modal-emp-salary').value),
            allowance_transport: 600000,
            allowance_meal: 600000,
            leave_quota: Number(document.getElementById('modal-emp-quota').value),
          };

          try {
            const res = await fetch('/api/v1/users', {
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
            window.showToast('Gagal menambahkan karyawan', 'error');
            btn.disabled = false;
          }
        }
      </script>
    </div>
  `;

  return Layout({
    title: 'Data Karyawan',
    activePath: '/employees',
    user,
    children: content,
  });
}
