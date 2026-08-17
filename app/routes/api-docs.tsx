import { html } from 'hono/html';
import { Layout } from '../layout';
import { JWTPayload } from '../../src/types';
import { Icons } from '../components/icons';

export function ApiDocsPage(user: JWTPayload) {
  const content = html`
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Android REST API Docs & Sandbox</h2>
          <p class="text-xs text-zinc-400">Spesifikasi antarmuka backend HRIS lengkap untuk integrasi aplikasi Android Kotlin / Jetpack Compose dengan autentikasi JWT HS256.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold">
            JWT: HS256 Verified
          </span>
        </div>
      </div>

      <!-- Bento Grid Top Row: Architecture Highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Keamanan Algoritma</span>
            <span class="text-xl">🔒</span>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-white font-mono">HMAC-SHA256</div>
            <p class="text-xs text-zinc-500 mt-1">Header Authorization: Bearer &lt;token&gt;</p>
          </div>
          <div class="text-[10px] text-orange-400 font-bold">Anti-Tamper & Role Based</div>
        </div>

        <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Database Engine</span>
            <span class="text-xl">⚡</span>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-white font-mono">Cloudflare D1 SQL</div>
            <p class="text-xs text-zinc-500 mt-1">Prepared Statement & ACID Transaction</p>
          </div>
          <div class="text-[10px] text-emerald-400 font-bold">Sub-millisecond Latency</div>
        </div>

        <div class="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-orange-400 uppercase tracking-wider">Mobile Target</span>
            <span class="text-xl">📱</span>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-white">Android Retrofit 2</div>
            <p class="text-xs text-zinc-400 mt-1">OkHttp Interceptor & Jetpack Compose</p>
          </div>
          <div class="text-[10px] text-zinc-300 font-mono">Kotlin Ready</div>
        </div>
      </div>

      <!-- Interactive API Endpoint Tester -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">Live API Endpoint Playground</h3>
            <p class="text-xs text-zinc-400">Pilih endpoint di bawah ini untuk menguji respon langsung dari server.</p>
          </div>
          <button onclick="runApiTest()" class="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5">
            <span>▶ Jalankan Uji Coba API</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-zinc-400 mb-1">Pilih Endpoint API:</label>
              <select id="api-endpoint-select" onchange="updateApiParams()" class="w-full text-xs px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono">
                <option value="/api/v1/auth/me|GET">GET /api/v1/auth/me — Profil Pengguna Aktif</option>
                <option value="/api/v1/attendance/today|GET">GET /api/v1/attendance/today — Cek Status Absensi Hari Ini</option>
                <option value="/api/v1/attendance/check-in|POST">POST /api/v1/attendance/check-in — Check-In (GPS & Late Detection)</option>
                <option value="/api/v1/attendance/check-out|POST">POST /api/v1/attendance/check-out — Check-Out Pulang</option>
                <option value="/api/v1/leaves|GET">GET /api/v1/leaves — Daftar Riwayat Cuti</option>
                <option value="/api/v1/reimbursements|GET">GET /api/v1/reimbursements — Daftar Klaim Biaya</option>
                <option value="/api/v1/payroll|GET">GET /api/v1/payroll — Rekap Slip Gaji Karyawan</option>
                <option value="/api/v1/meetings|GET">GET /api/v1/meetings — Jadwal Rapat Tim</option>
                <option value="/api/v1/settings|GET">GET /api/v1/settings — Pengaturan Perusahaan & Jam Kerja (D1 Table)</option>
                <option value="/api/v1/settings|PATCH">PATCH /api/v1/settings — Update Parameter Jam Kerja / Nama PT (Admin)</option>
              </select>

            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-400 mb-1">Request Payload (JSON Body opsional):</label>
              <textarea id="api-request-body" rows="4" class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono"></textarea>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-400 mb-1">Server Response (JSON):</label>
            <div id="api-response-viewer" class="h-48 overflow-y-auto p-4 rounded-xl bg-black border border-zinc-800 text-emerald-400 text-xs font-mono whitespace-pre">
{
  "status": "Ready",
  "message": "Klik 'Jalankan Uji Coba API' untuk melihat respon aktual dari server Hono & D1."
}
            </div>
          </div>
        </div>
      </div>

      <!-- Android Kotlin Code Sample -->
      <div class="p-6 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="text-base font-bold text-white">Contoh Integrasi Android Kotlin (Retrofit 2 & Coroutines)</h3>
          <span class="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">HRISApiService.kt</span>
        </div>

        <pre class="p-4 rounded-2xl bg-black border border-zinc-800 text-zinc-300 text-xs font-mono overflow-x-auto leading-relaxed">
<code>// Kotlin Retrofit 2 Interface for Nusantara HRIS Android App
package id.nusantara.hris.api

import retrofit2.http.*
import retrofit2.Response

interface NusantaraHrisApi {
    @POST("api/v1/auth/login")
    suspend fun login(@Body req: LoginRequest): Response&lt;AuthResponse&gt;

    @GET("api/v1/auth/me")
    suspend fun getProfile(@Header("Authorization") token: String): Response&lt;UserProfileResponse&gt;

    @POST("api/v1/attendance/check-in")
    suspend fun checkIn(
        @Header("Authorization") token: String,
        @Body req: CheckInRequest
    ): Response&lt;AttendanceResponse&gt;

    @POST("api/v1/attendance/check-out")
    suspend fun checkOut(
        @Header("Authorization") token: String,
        @Body req: CheckOutRequest
    ): Response&lt;AttendanceResponse&gt;

    @POST("api/v1/leaves")
    suspend fun submitLeave(
        @Header("Authorization") token: String,
        @Body req: LeaveRequestPayload
    ): Response&lt;BaseResponse&gt;
}</code></pre>
      </div>

      <script>
        function updateApiParams() {
          const val = document.getElementById('api-endpoint-select').value;
          const [url, method] = val.split('|');
          const bodyEl = document.getElementById('api-request-body');

          if (url.includes('check-in')) {
            bodyEl.value = JSON.stringify({
              notes: "Mobile Check-in Android Studio Emulator",
              latitude: -6.2088,
              longitude: 106.8456,
              location_name: "Kantor Pusat Jakarta"
            }, null, 2);
          } else if (url.includes('check-out')) {
            bodyEl.value = JSON.stringify({
              notes: "Selesai jam kerja harian",
              latitude: -6.2088,
              longitude: 106.8456
            }, null, 2);
          } else if (url.includes('settings') && method === 'PATCH') {
            bodyEl.value = JSON.stringify({
              COMPANY_NAME: "PT Nusantara Digital Pratama",
              WORK_START_TIME: "08:30",
              WORK_END_TIME: "17:30",
              OFFICE_RADIUS_METERS: "150"
            }, null, 2);
          } else {
            bodyEl.value = '';
          }

        }

        async function runApiTest() {
          const val = document.getElementById('api-endpoint-select').value;
          const [url, method] = val.split('|');
          const bodyText = document.getElementById('api-request-body').value;
          const viewer = document.getElementById('api-response-viewer');
          viewer.innerText = 'Loading... Menghubungi server Hono...';

          try {
            const opts = {
              method,
              headers: { 'Content-Type': 'application/json' }
            };
            if (method === 'POST' && bodyText.trim()) {
              opts.body = bodyText;
            }

            const res = await fetch(url, opts);
            const json = await res.json();
            viewer.innerText = JSON.stringify(json, null, 2);
          } catch (err) {
            viewer.innerText = JSON.stringify({ error: err.message }, null, 2);
          }
        }

        document.addEventListener('DOMContentLoaded', () => {
          updateApiParams();
        });
      </script>
    </div>
  `;

  return Layout({
    title: 'Android API Docs',
    activePath: '/api-docs',
    user,
    children: content,
  });
}
