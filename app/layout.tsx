import { html } from 'hono/html';
import { JWTPayload } from '../src/types';
import { Icons } from './components/icons';

interface LayoutProps {
  title: string;
  activePath: string;
  user?: JWTPayload | null;
  children: any;
}

export function Layout({ title, activePath, user, children }: LayoutProps) {
  const roleBadge = user?.role === 'ADMIN' 
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    : user?.role === 'HRD'
    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Presensi', path: '/attendance', icon: '⏱️' },
    { label: 'Cuti & Izin', path: '/leaves', icon: '📅' },
    { label: 'Payroll', path: '/payroll', icon: '💸' },
    { label: 'Reimburse', path: '/reimbursements', icon: '📁' },
    { label: 'Meetings', path: '/meetings', icon: '🤝' },
    ...(user?.role === 'ADMIN' || user?.role === 'HRD'
      ? [{ label: 'Data Karyawan', path: '/employees', icon: '👥' }]
      : []),
    { label: 'Pengaturan', path: '/settings', icon: '⚙️' },
    { label: 'Android API Docs', path: '/api-docs', icon: '📱' },
  ];


  return html`
<!DOCTYPE html>
<html lang="id" class="h-full dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Hono HRIS Bento</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="h-full bg-[#09090b] text-zinc-100 antialiased flex flex-col md:flex-row transition-colors duration-200 selection:bg-orange-500 selection:text-white">
  
  <!-- Bento Sidebar for Desktop -->
  <aside class="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#0c0c0e] shrink-0 h-screen sticky top-0">
    <div class="p-6 flex items-center justify-between border-b border-zinc-800">
      <a href="/" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
          H
        </div>
        <span class="text-xl font-bold tracking-tight text-white">Hono<span class="text-orange-500">HRIS</span></span>
      </a>
    </div>

    <!-- User Profile Card in Sidebar -->
    ${user ? html`
    <div class="p-4 mx-3 my-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-zinc-800 text-orange-400 font-bold flex items-center justify-center border border-zinc-700 shrink-0">
          ${user.avatar ? html`<img src="${user.avatar}" class="w-full h-full rounded-full object-cover">` : user.name.charAt(0)}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold text-white truncate">${user.name}</div>
          <div class="text-[10px] text-zinc-400 truncate">${user.position}</div>
          <div class="mt-1">
            <span class="inline-block px-2 py-0.5 text-[9px] font-bold rounded border ${roleBadge}">
              ${user.role} &bull; ${user.department}
            </span>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Nav Items -->
    <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
      ${menuItems.map(item => {
        const isActive = activePath === item.path;
        return html`
          <a href="${item.path}" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
            isActive 
              ? 'bg-zinc-800/60 text-orange-400 font-bold border border-zinc-700/60 shadow-sm' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 font-medium'
          }">
            <span class="text-base">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `;
      })}
    </nav>

    <!-- Quick Role Switcher for Demo -->
    <div class="p-4 border-t border-zinc-800 bg-[#0c0c0e]">
      <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-1">Switch Role Demo:</div>
      <div class="grid grid-cols-3 gap-1">
        <button onclick="window.switchRole('andi@nusantara.id', 'admin123')" class="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-purple-400 border border-zinc-800 transition">Admin</button>
        <button onclick="window.switchRole('siti@nusantara.id', 'hrd123')" class="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition">HRD</button>
        <button onclick="window.switchRole('budi@nusantara.id', 'karyawan123')" class="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 transition">Staff</button>
      </div>
    </div>
  </aside>

  <!-- Mobile Top Header -->
  <div class="md:hidden flex items-center justify-between p-4 bg-[#0c0c0e] border-b border-zinc-800 sticky top-0 z-30">
    <a href="/" class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">H</div>
      <span class="font-bold text-white text-base tracking-tight">Hono<span class="text-orange-500">HRIS</span></span>
    </a>
    <div class="flex items-center gap-2">
      <button onclick="document.getElementById('mobile-drawer').classList.toggle('hidden')" class="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800">
        ${Icons.Menu()}
      </button>
    </div>
  </div>

  <!-- Mobile Drawer Menu -->
  <div id="mobile-drawer" class="hidden md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onclick="this.classList.add('hidden')">
    <div class="w-72 h-full bg-[#0c0c0e] p-6 shadow-2xl space-y-4 border-r border-zinc-800" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div class="font-bold text-white text-base">Hono<span class="text-orange-500">HRIS</span> Menu</div>
        <button onclick="document.getElementById('mobile-drawer').classList.add('hidden')" class="text-zinc-400">${Icons.X()}</button>
      </div>
      <nav class="space-y-1">
        ${menuItems.map(item => html`
          <a href="${item.path}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
            activePath === item.path ? 'bg-zinc-800 text-orange-400' : 'text-zinc-300 hover:text-white'
          }">
            <span class="text-base">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `)}
      </nav>
      <div class="pt-4 border-t border-zinc-800">
        <button onclick="window.logoutUser()" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20">
          ${Icons.LogOut()} Keluar Akun
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content Body -->
  <main class="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-6">
    <!-- Top Header for Desktop -->
    <header class="hidden md:flex items-center justify-between px-8 py-5 bg-[#09090b]/90 backdrop-blur border-b border-zinc-800 sticky top-0 z-20">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">${title}</h1>
        <p class="text-xs text-zinc-400">Selamat datang kembali, kelola aktivitas dan data tim Anda hari ini.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Live Clock Indicator -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span id="live-top-clock">--:--:-- WIB</span>
        </div>

        <a href="/api/v1/export/attendance.csv" class="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs font-medium border border-zinc-700 text-zinc-200 flex items-center gap-2 transition">
          📥 Export CSV
        </a>

        <a href="/api-docs" class="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition">
          🚀 SSR Panel
        </a>

        <!-- Logout Button -->
        <button onclick="window.logoutUser()" class="p-2 rounded-xl text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 transition" title="Logout">
          ${Icons.LogOut()}
        </button>
      </div>
    </header>

    <!-- Page Content Container -->
    <div class="p-4 md:p-8 flex-1">
      ${children}
    </div>
  </main>

  <!-- Mobile Bottom Quick Navigation Bar -->
  <div class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-t border-zinc-800 flex items-center justify-around py-2 px-1">
    <a href="/" class="flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activePath === '/' ? 'text-orange-400 font-bold' : 'text-zinc-400'}">
      <span>📊</span>
      <span>Beranda</span>
    </a>
    <a href="/attendance" class="flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activePath === '/attendance' ? 'text-orange-400 font-bold' : 'text-zinc-400'}">
      <span>⏱️</span>
      <span>Absen</span>
    </a>
    <a href="/leaves" class="flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activePath === '/leaves' ? 'text-orange-400 font-bold' : 'text-zinc-400'}">
      <span>📅</span>
      <span>Cuti</span>
    </a>
    <a href="/payroll" class="flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activePath === '/payroll' ? 'text-orange-400 font-bold' : 'text-zinc-400'}">
      <span>💸</span>
      <span>Payroll</span>
    </a>
    <a href="/reimbursements" class="flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activePath === '/reimbursements' ? 'text-orange-400 font-bold' : 'text-zinc-400'}">
      <span>📁</span>
      <span>Klaim</span>
    </a>
  </div>

  <!-- Global Toast Notification Container -->
  <div id="toast-container" class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm"></div>

  <!-- Client Script for Interactive Handlers -->
  <script src="/client.js"></script>
</body>
</html>
  `;
}
