import { html } from 'hono/html';
import { Icons } from '../components/icons';

export function LoginPage(errorMessage?: string) {
  return html`
    <!DOCTYPE html>
    <html lang="id" class="dark h-full">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Masuk | Hono HRIS Bento</title>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body class="bg-[#09090b] text-zinc-100 min-h-full flex items-center justify-center p-4">
      <div class="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <!-- Left Bento Brand Hero -->
        <div class="lg:col-span-6 p-8 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/20">
              H
            </div>
            <div>
              <span class="text-xl font-bold tracking-tight text-white">Hono<span class="text-orange-500">HRIS</span></span>
              <span class="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Bento Architecture</span>
            </div>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-white leading-tight">
            Sistem Informasi SDM Terintegrasi & Modern
          </h1>
          
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Didukung SSR Ultra-Cepat Hono, Cloudflare D1 Serverless SQL, dan Otentikasi Keamanan JWT Algoritma HS256 untuk Web & Aplikasi Android.
          </p>

          <!-- 3 Bento Feature Highlights -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div class="text-orange-400 font-bold text-xs mb-1">⏱️ Presensi Pintar</div>
              <div class="text-[11px] text-zinc-400">Deteksi telat otomatis & kalkulasi jam lembur.</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div class="text-orange-400 font-bold text-xs mb-1">⚡ Payroll Otomatis</div>
              <div class="text-[11px] text-zinc-400">Kalkulasi take-home pay, BPJS & reimburse.</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div class="text-orange-400 font-bold text-xs mb-1">📅 1-Klik Approval</div>
              <div class="text-[11px] text-zinc-400">Persetujuan cuti & klaim instan dari dashboard.</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div class="text-orange-400 font-bold text-xs mb-1">🔒 JWT HS256</div>
              <div class="text-[11px] text-zinc-400">Ready REST API untuk Android Retrofit.</div>
            </div>
          </div>
        </div>

        <!-- Right Bento Form & Demo Roles -->
        <div class="lg:col-span-6 p-8 rounded-3xl bg-[#0c0c0e] border border-zinc-800 space-y-6">
          <div>
            <h2 class="text-xl font-bold text-white tracking-tight">Masuk ke Akun Anda</h2>
            <p class="text-xs text-zinc-400 mt-1">Gunakan kredensial terdaftar atau pilih akun demo di bawah.</p>
          </div>

          ${errorMessage ? html`
            <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              ${errorMessage}
            </div>
          ` : ''}

          <form action="/login" method="POST" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-zinc-300 mb-1.5">Email Kantor</label>
              <input type="email" name="email" id="login-email" value="andi@nusantara.id" required class="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition">
            </div>

            <div>
              <label class="block font-bold text-zinc-300 mb-1.5">Password</label>
              <input type="password" name="password" id="login-pass" value="admin123" required class="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition">
            </div>

            <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition">
              Masuk Sekarang &rarr;
            </button>
          </form>

          <!-- 1-Click Role Switcher Demo Box -->
          <div class="pt-4 border-t border-zinc-800">
            <span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
              ⚡ 1-Klik Pilihan Role Demo:
            </span>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="setDemo('andi@nusantara.id', 'admin123')" class="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500 text-left transition">
                <div class="text-[11px] font-bold text-purple-400">Admin</div>
                <div class="text-[10px] text-zinc-500 truncate">Andi P.</div>
              </button>
              <button type="button" onclick="setDemo('siti@nusantara.id', 'hrd123')" class="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500 text-left transition">
                <div class="text-[11px] font-bold text-blue-400">HRD</div>
                <div class="text-[10px] text-zinc-500 truncate">Siti R.</div>
              </button>
              <button type="button" onclick="setDemo('budi@nusantara.id', 'karyawan123')" class="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500 text-left transition">
                <div class="text-[11px] font-bold text-emerald-400">Karyawan</div>
                <div class="text-[10px] text-zinc-500 truncate">Budi S.</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <script>
        function setDemo(email, pass) {
          document.getElementById('login-email').value = email;
          document.getElementById('login-pass').value = pass;
        }
      </script>
    </body>
    </html>
  `;
}
