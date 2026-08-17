import { html } from 'hono/html';
import { Layout } from '../layout';

export async function RegisterPage(errorMessage?: string) {
  const content = html`
    <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 p-10 bg-[#0c0c0e] rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
        
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <h2 class="text-center text-3xl font-extrabold text-white tracking-tight">Buat Akun Admin</h2>
          <p class="mt-2 text-center text-sm text-zinc-400">
            Sistem Informasi HRIS Nusantara
          </p>
        </div>
        
        ${errorMessage ? html`
          <div class="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-xs text-center font-semibold">
            ${errorMessage}
          </div>
        ` : ''}

        <!-- Form menembak langsung ke API backend -->
        <form class="mt-8 space-y-5" action="/api/v1/auth/register" method="POST">
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
              <input id="name" name="name" type="text" required class="appearance-none block w-full px-4 py-3 border border-zinc-700 bg-zinc-900/50 placeholder-zinc-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition" placeholder="Contoh: Budi Santoso">
            </div>
            <div>
              <label for="email" class="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Alamat Email</label>
              <input id="email" name="email" type="email" required class="appearance-none block w-full px-4 py-3 border border-zinc-700 bg-zinc-900/50 placeholder-zinc-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition" placeholder="admin@nusantara.id">
            </div>
            <div>
              <label for="password" class="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
              <input id="password" name="password" type="password" required minlength="6" class="appearance-none block w-full px-4 py-3 border border-zinc-700 bg-zinc-900/50 placeholder-zinc-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition" placeholder="••••••••">
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" class="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none transition active:scale-95 shadow-lg shadow-orange-600/20">
              Daftar sebagai Admin
            </button>
          </div>
          
          <div class="text-center text-xs text-zinc-500 mt-6">
            Sudah punya akun? <a href="/login" class="text-orange-400 hover:text-orange-300 font-bold hover:underline transition">Login di sini</a>
          </div>
        </form>
      </div>
    </div>
  `;

  return Layout({
    title: 'Registrasi Admin',
    activePath: '/register',
    user: null as any,
    children: content,
  });
}
