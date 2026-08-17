import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload, AppSetting } from '../../src/types';
import { db, getAllSettingsMap } from '../../src/db/d1';
import { Icons } from '../components/icons';

export async function SettingsPage(user: JWTPayload) {
  // Fetch all settings from D1 database
  const res = await db.prepare('SELECT * FROM settings').all<AppSetting>();
  const settingsList = res.results;
  const settingsMap = await getAllSettingsMap();

  const companyName = settingsMap['COMPANY_NAME'] || 'PT Nusantara Digital Pratama';
  const workStartTime = settingsMap['WORK_START_TIME'] || '08:30';
  const workEndTime = settingsMap['WORK_END_TIME'] || '17:30';
  const officeLat = settingsMap['OFFICE_LATITUDE'] || '-6.2088';
  const officeLng = settingsMap['OFFICE_LONGITUDE'] || '106.8456';
  const officeRadius = settingsMap['OFFICE_RADIUS_METERS'] || '100';

  const isPrivileged = user.role === 'ADMIN' || user.role === 'HRD';

  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Pengaturan Perusahaan & Jam Kerja</h2>
          <p class="text-xs text-zinc-400">Data konfigurasi tersimpan secara persisten di tabel database <span class="font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">settings</span> Cloudflare D1.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-mono text-orange-400">
            D1 Table: settings (${settingsList.length} entri)
          </span>
        </div>
      </div>

      <!-- Bento Grid Top Row: Current Live Values -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Perusahaan</span>
            <span class="text-lg">🏢</span>
          </div>
          <div class="my-3">
            <div class="text-lg font-bold text-white tracking-tight">${companyName}</div>
            <p class="text-xs text-zinc-500 mt-1">Kunci DB: <code class="font-mono text-orange-400">COMPANY_NAME</code></p>
          </div>
          <div class="text-[10px] font-bold text-emerald-400">Kop Surat & Slip Gaji Resmi</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jam Masuk Standar</span>
            <span class="text-lg">⏰</span>
          </div>
          <div class="my-3">
            <div class="text-3xl font-bold text-orange-400 font-mono">${workStartTime} <span class="text-xs font-normal text-zinc-500">WIB</span></div>
            <p class="text-xs text-zinc-500 mt-1">Kunci DB: <code class="font-mono text-orange-400">WORK_START_TIME</code></p>
          </div>
          <div class="text-[10px] font-bold text-amber-400">Batas Masuk Tepat Waktu</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jam Pulang Standar</span>
            <span class="text-lg">🏁</span>
          </div>
          <div class="my-3">
            <div class="text-3xl font-bold text-blue-400 font-mono">${workEndTime} <span class="text-xs font-normal text-zinc-500">WIB</span></div>
            <p class="text-xs text-zinc-500 mt-1">Kunci DB: <code class="font-mono text-orange-400">WORK_END_TIME</code></p>
          </div>
          <div class="text-[10px] font-bold text-blue-400">Mulai Jam Lembur Kantor</div>
        </div>
      </div>

      <!-- Bento Grid Main: Edit Form & D1 Schema Viewer -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Form Update Settings (Admin / HRD) -->
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="font-bold text-white text-base flex items-center gap-2">
              <span>⚙️</span> Edit Parameter Database
            </h3>
            ${!isPrivileged ? html`
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                Mode Baca (Read-Only)
              </span>
            ` : html`
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Akses Administrator
              </span>
            `}
          </div>

          <form id="form-company-settings" onsubmit="window.saveCompanySettings(event)" class="space-y-4 text-xs">
            <div>
              <label class="block text-zinc-400 font-semibold mb-1">
                COMPANY_NAME (Nama Resmi Perusahaan)
              </label>
              <input 
                type="text" 
                name="COMPANY_NAME" 
                id="setting-company-name" 
                value="${companyName}" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                ${!isPrivileged ? 'disabled' : ''} 
                required
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Digunakan pada kop surat, slip gaji resmi, dan nama lokasi absensi.</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-zinc-400 font-semibold mb-1">
                  WORK_START_TIME (Jam Masuk)
                </label>
                <input 
                  type="time" 
                  name="WORK_START_TIME" 
                  id="setting-work-start" 
                  value="${workStartTime}" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                  ${!isPrivileged ? 'disabled' : ''} 
                  required
                />
                <span class="text-[10px] text-zinc-500 mt-1 block">Format: HH:mm (contoh: 08:30)</span>
              </div>

              <div>
                <label class="block text-zinc-400 font-semibold mb-1">
                  WORK_END_TIME (Jam Pulang)
                </label>
                <input 
                  type="time" 
                  name="WORK_END_TIME" 
                  id="setting-work-end" 
                  value="${workEndTime}" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                  ${!isPrivileged ? 'disabled' : ''} 
                  required
                />
                <span class="text-[10px] text-zinc-500 mt-1 block">Format: HH:mm (contoh: 17:30)</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
              <div>
                <label class="block text-zinc-400 font-semibold mb-1">OFFICE_LATITUDE</label>
                <input 
                  type="text" 
                  name="OFFICE_LATITUDE" 
                  value="${officeLat}" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                  ${!isPrivileged ? 'disabled' : ''}
                />
              </div>
              <div>
                <label class="block text-zinc-400 font-semibold mb-1">OFFICE_LONGITUDE</label>
                <input 
                  type="text" 
                  name="OFFICE_LONGITUDE" 
                  value="${officeLng}" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                  ${!isPrivileged ? 'disabled' : ''}
                />
              </div>
              <div>
                <label class="block text-zinc-400 font-semibold mb-1">RADIUS (Meter)</label>
                <input 
                  type="number" 
                  name="OFFICE_RADIUS_METERS" 
                  value="${officeRadius}" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60" 
                  ${!isPrivileged ? 'disabled' : ''}
                />
              </div>
            </div>

            ${isPrivileged ? html`
              <div class="pt-3">
                <button type="submit" id="btn-save-settings" class="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition">
                  💾 Simpan Perubahan ke Database D1
                </button>
              </div>
            ` : html`
              <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-xs">
                🔒 Hanya akun role <strong>ADMIN</strong> atau <strong>HRD</strong> yang dapat mengubah konfigurasi ini.
              </div>
            `}
          </form>
        </div>

        <!-- D1 SQL Table Inspector -->
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <span>🗄️</span> Live Cloudflare D1 Table: <code class="text-orange-400 font-mono text-sm">settings</code>
              </h3>
              <span class="text-[10px] text-zinc-500 font-mono">SQLite / D1 Schema</span>
            </div>

            <!-- SQL Schema Code Box -->
            <div class="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
              <div class="text-zinc-500">-- Schema Tabel Settings di D1</div>
              <div class="text-orange-400">CREATE TABLE <span class="text-white">settings</span> (</div>
              <div class="pl-4 text-emerald-400">key <span class="text-zinc-300">TEXT PRIMARY KEY</span>,</div>
              <div class="pl-4 text-emerald-400">value <span class="text-zinc-300">TEXT NOT NULL</span>,</div>
              <div class="pl-4 text-emerald-400">description <span class="text-zinc-300">TEXT</span>,</div>
              <div class="pl-4 text-emerald-400">updated_at <span class="text-zinc-300">DATETIME</span></div>
              <div class="text-orange-400">);</div>
            </div>

            <!-- Table Rows -->
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                    <th class="py-2.5 px-2">Key</th>
                    <th class="py-2.5 px-2">Value</th>
                    <th class="py-2.5 px-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  ${settingsList.map(s => html`
                    <tr class="hover:bg-zinc-900/40">
                      <td class="py-2 px-2 text-orange-400 font-bold whitespace-nowrap">${s.key}</td>
                      <td class="py-2 px-2 text-zinc-100 font-semibold whitespace-nowrap">${s.value}</td>
                      <td class="py-2 px-2 text-zinc-400 font-sans text-[11px]">${s.description || '-'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- API Call Reference -->
          <div class="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
            <div class="text-zinc-400 font-bold">Android & Web REST API Endpoint:</div>
            <div class="font-mono text-[11px] text-zinc-300 flex items-center justify-between">
              <span><strong class="text-emerald-400">GET</strong> /api/v1/settings</span>
              <span class="text-zinc-500">Public/Auth</span>
            </div>
            <div class="font-mono text-[11px] text-zinc-300 flex items-center justify-between">
              <span><strong class="text-orange-400">PATCH</strong> /api/v1/settings</span>
              <span class="text-zinc-500">Admin/HRD</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  return Layout({
    title: 'Pengaturan Perusahaan',
    activePath: '/settings',
    user,
    children: content,
  });
}
