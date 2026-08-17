// Nusantara HRIS Client Script - Interactive Features, Bento Modals & Android Bridge

// 1. Toast Notification Utility
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' 
    ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/40' 
    : type === 'error' 
    ? 'bg-zinc-900 text-rose-400 border border-rose-500/40' 
    : 'bg-zinc-900 text-orange-400 border border-orange-500/40';
  toast.className = `${bg} px-4 py-3 rounded-2xl shadow-xl shadow-black/50 flex items-center gap-3 text-xs font-bold transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// 2. Live Clock Ticker
function initClock() {
  const clockEl = document.getElementById('live-top-clock');
  const punchClockEl = document.getElementById('punch-live-clock');

  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    if (clockEl) clockEl.textContent = timeStr;
    if (punchClockEl) punchClockEl.textContent = timeStr;
  }

  update();
  setInterval(update, 1000);
}

// 3. Role Switcher for Demo Testing
window.switchRole = async function(email, password) {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(`Berhasil login sebagai ${json.user.name} (${json.user.role})`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } else {
      window.showToast(json.error || 'Gagal beralih role', 'error');
    }
  } catch (err) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

// 4. Logout
window.logoutUser = async function() {
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  } catch (e) {
    window.location.href = '/login';
  }
};

// 5. Absensi Online Check-In
window.doCheckIn = async function() {
  const btn = document.getElementById('btn-check-in');
  if (btn) btn.disabled = true;

  window.showToast('Mengakses lokasi GPS & memproses absensi...', 'info');

  let lat = -6.2088;
  let lng = 106.8456;
  let locationName = 'Kantor Pusat Nusantara Digital (GPS)';

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      locationName = `Lokasi Presisi (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (e) {
      console.warn('GPS timed out, fallback to default office radius');
    }
  }

  try {
    const res = await fetch('/api/v1/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        location: locationName,
        notes: document.getElementById('checkin-notes')?.value || '',
      })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, json.data.is_late ? 'error' : 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      window.showToast(json.error || 'Gagal check-in', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    window.showToast('Gagal terhubung ke API', 'error');
    if (btn) btn.disabled = false;
  }
};

// 6. Absensi Online Check-Out
window.doCheckOut = async function() {
  const btn = document.getElementById('btn-check-out');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/v1/attendance/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: document.getElementById('checkin-notes')?.value || '',
      })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      window.showToast(json.error || 'Gagal check-out', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    window.showToast('Gagal terhubung ke API', 'error');
    if (btn) btn.disabled = false;
  }
};

// 7. 1-Click Leave Approval
window.approveLeave = async function(leaveId) {
  if (!confirm('Setujui permohonan cuti/izin ini?')) return;
  try {
    const res = await fetch(`/api/v1/leaves/${leaveId}/approve`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      window.showToast(json.error || 'Gagal menyetujui cuti', 'error');
    }
  } catch (e) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

window.rejectLeave = async function(leaveId) {
  const reason = prompt('Masukkan alasan penolakan cuti:', 'Kebutuhan operasional mendesak di divisi terkait.');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/v1/leaves/${leaveId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      window.showToast(json.error || 'Gagal menolak cuti', 'error');
    }
  } catch (e) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

// 8. 1-Click Reimbursement Approval & Payout
window.approveReimburse = async function(rmbId) {
  try {
    const res = await fetch(`/api/v1/reimbursements/${rmbId}/approve`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      window.showToast(json.error, 'error');
    }
  } catch (e) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

window.rejectReimburse = async function(rmbId) {
  if (!confirm('Tolak klaim reimbursement ini?')) return;
  try {
    const res = await fetch(`/api/v1/reimbursements/${rmbId}/reject`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      window.showToast(json.error, 'error');
    }
  } catch (e) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

window.payoutReimburse = async function(rmbId) {
  if (!confirm('Konfirmasi pencairan dana klaim ini ke rekening karyawan?')) return;
  try {
    const res = await fetch(`/api/v1/reimbursements/${rmbId}/payout`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      window.showToast(json.error, 'error');
    }
  } catch (e) {
    window.showToast('Gagal menghubungi server', 'error');
  }
};

// 9. Process Automated Payroll
window.generateMonthlyPayroll = async function(month, year) {
  if (!confirm(`Proses perhitungan payroll otomatis periode ${month}/${year}? Sistem akan mengkalkulasi kehadiran, lembur, klaim, potongan telat, dan BPJS/Pajak.`)) return;

  try {
    window.showToast('Memproses payroll otomatis...', 'info');
    const res = await fetch('/api/v1/payroll/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      window.showToast(json.error, 'error');
    }
  } catch (e) {
    window.showToast('Gagal memproses payroll', 'error');
  }
};

// 10. Meeting RSVP
window.rsvpMeeting = async function(meetingId, status) {
  try {
    const res = await fetch(`/api/v1/meetings/${meetingId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (json.success) {
      window.showToast(json.message, 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      window.showToast(json.error, 'error');
    }
  } catch (e) {
    window.showToast('Gagal RSVP', 'error');
  }
};

// 11. View Payslip Modal in Bento Style
window.viewPayslip = async function(payrollId) {
  try {
    const res = await fetch(`/api/v1/payroll/${payrollId}`);
    const json = await res.json();
    if (!json.success) {
      window.showToast(json.error, 'error');
      return;
    }

    const p = json.data;
    const modal = document.getElementById('payslip-modal');
    const content = document.getElementById('payslip-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div id="print-slip-area" class="p-8 bg-[#0c0c0e] text-zinc-100 rounded-3xl border border-zinc-800 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">
              H
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">PT NUSANTARA DIGITAL PRATAMA</h2>
              <p class="text-xs text-zinc-400">Cyber 2 Tower Lt. 18, HR Rasuna Said, Jakarta Selatan</p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs rounded-lg">
              SLIP GAJI RESMI
            </span>
            <p class="text-xs text-zinc-400 font-mono mt-1">Periode: ${p.period_month}/${p.period_year}</p>
          </div>
        </div>

        <!-- Employee Info -->
        <div class="grid grid-cols-2 gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs">
          <div>
            <span class="text-zinc-500">Nama Karyawan:</span>
            <div class="font-bold text-sm text-white">${p.user_name}</div>
            <div class="text-zinc-400">${p.user_position}</div>
          </div>
          <div>
            <span class="text-zinc-500">Departemen & Kehadiran:</span>
            <div class="font-bold text-sm text-white">${p.user_department}</div>
            <div class="text-zinc-400 font-mono">${p.total_attendance_days} Hari Hadir (${p.total_late_days} Hari Telat)</div>
          </div>
        </div>

        <!-- Financial Breakdown -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Earnings -->
          <div class="space-y-2 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div class="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
              Penerimaan (Earnings)
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">Gaji Pokok:</span>
              <span class="font-mono text-zinc-200">Rp ${p.base_salary.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">Tunjangan Transport & Makan:</span>
              <span class="font-mono text-zinc-200">Rp ${(p.allowance_transport + p.allowance_meal).toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">Uang Lembur:</span>
              <span class="font-mono text-emerald-400">+ Rp ${p.overtime_pay.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">Klaim Reimbursement:</span>
              <span class="font-mono text-emerald-400">+ Rp ${p.reimburse_pay.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs pt-2 border-t border-zinc-800 font-bold">
              <span class="text-white">Total Kotor:</span>
              <span class="text-white font-mono">Rp ${p.gross_salary.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <!-- Deductions -->
          <div class="space-y-2 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div class="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
              Potongan (Deductions)
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">Potongan Terlambat:</span>
              <span class="font-mono text-rose-400">- Rp ${p.late_deduction.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">BPJS Ketenagakerjaan (3%):</span>
              <span class="font-mono text-rose-400">- Rp ${p.bpjs_deduction.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-zinc-400">PPh 21 Pajak:</span>
              <span class="font-mono text-rose-400">- Rp ${p.tax_deduction.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-xs pt-2 border-t border-zinc-800 font-bold">
              <span class="text-white">Total Potongan:</span>
              <span class="text-rose-400 font-mono">- Rp ${(p.late_deduction + p.bpjs_deduction + p.tax_deduction).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <!-- Take Home Pay Box -->
        <div class="p-5 rounded-2xl bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700 text-white flex items-center justify-between shadow-lg">
          <div>
            <div class="text-xs uppercase font-bold tracking-wider text-orange-400">Take-Home Pay Bersih:</div>
            <div class="text-2xl font-black font-mono mt-0.5">Rp ${p.net_salary.toLocaleString('id-ID')}</div>
          </div>
          <div class="text-right text-xs text-zinc-400">
            <div>Status: <span class="font-bold text-emerald-400">${p.status}</span></div>
            <div>Transfer Rekening Otomatis</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button onclick="window.print()" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700">
            🖨️ Cetak / PDF
          </button>
          <button onclick="document.getElementById('payslip-modal').classList.add('hidden')" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20">
            Tutup
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  } catch (e) {
    window.showToast('Gagal memuat slip gaji', 'error');
  }
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initClock();
});
