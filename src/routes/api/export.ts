import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Attendance, LeaveRequest, PayrollRecord, Reimbursement } from '../../types';

const exportApi = new Hono();
exportApi.use('*', requireAuth());

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(','));
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // UTF-8 BOM for Excel
}

// GET /api/v1/export/attendance.csv
exportApi.get('/attendance.csv', async (c) => {
  const res = await db.prepare('SELECT * FROM attendance').all<Attendance>();
  const rows = res.results.map(a => [
    a.date,
    a.user_name || a.user_id,
    a.user_department || '-',
    a.check_in_time || '-',
    a.check_out_time || '-',
    a.is_late ? 'YA' : 'TIDAK',
    a.late_minutes || 0,
    a.work_hours || 0,
    a.status,
    a.check_in_location || '-',
    a.notes || '',
  ]);

  const csv = toCSV(
    ['Tanggal', 'Nama Karyawan', 'Departemen', 'Jam Masuk', 'Jam Pulang', 'Terlambat', 'Menit Telat', 'Total Jam', 'Status', 'Lokasi', 'Catatan'],
    rows
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan_absensi_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

// GET /api/v1/export/leaves.csv
exportApi.get('/leaves.csv', async (c) => {
  const res = await db.prepare('SELECT * FROM leaves').all<LeaveRequest>();
  const rows = res.results.map(l => [
    l.id,
    l.user_name || l.user_id,
    l.user_department || '-',
    l.leave_type,
    l.start_date,
    l.end_date,
    l.total_days,
    l.reason,
    l.status,
    l.approved_by_name || '-',
    l.approved_at || '-',
  ]);

  const csv = toCSV(
    ['ID Cuti', 'Nama Karyawan', 'Departemen', 'Tipe Cuti', 'Tgl Mulai', 'Tgl Selesai', 'Jumlah Hari', 'Alasan', 'Status', 'Disetujui Oleh', 'Tgl Disetujui'],
    rows
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan_cuti_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

// GET /api/v1/export/reimbursements.csv
exportApi.get('/reimbursements.csv', async (c) => {
  const res = await db.prepare('SELECT * FROM reimbursements').all<Reimbursement>();
  const rows = res.results.map(r => [
    r.id,
    r.user_name || r.user_id,
    r.user_department || '-',
    r.category,
    r.amount,
    r.description,
    r.receipt_date,
    r.status,
    r.approved_by_name || '-',
    r.paid_at || '-',
  ]);

  const csv = toCSV(
    ['ID Klaim', 'Nama Karyawan', 'Departemen', 'Kategori', 'Nominal (Rp)', 'Deskripsi', 'Tgl Nota', 'Status', 'Disetujui Oleh', 'Tgl Cair'],
    rows
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan_reimburse_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

// GET /api/v1/export/payroll.csv (HRD & Admin only)
exportApi.get('/payroll.csv', requireRole('ADMIN', 'HRD'), async (c) => {
  const res = await db.prepare('SELECT * FROM payroll').all<PayrollRecord>();
  const rows = res.results.map(p => [
    p.id,
    p.user_name || p.user_id,
    p.user_department || '-',
    `${p.period_month}/${p.period_year}`,
    p.base_salary,
    p.allowance_transport + p.allowance_meal,
    p.overtime_pay,
    p.reimburse_pay,
    p.late_deduction,
    p.bpjs_deduction,
    p.tax_deduction,
    p.gross_salary,
    p.net_salary,
    p.total_attendance_days,
    p.total_late_days,
    p.status,
  ]);

  const csv = toCSV(
    [
      'ID Payroll',
      'Nama Karyawan',
      'Departemen',
      'Periode',
      'Gaji Pokok (Rp)',
      'Total Tunjangan (Rp)',
      'Uang Lembur (Rp)',
      'Klaim Cair (Rp)',
      'Potongan Telat (Rp)',
      'Potongan BPJS (Rp)',
      'Potongan PPh21 (Rp)',
      'Gaji Bruto (Rp)',
      'Gaji Bersih / Take Home Pay (Rp)',
      'Hari Hadir',
      'Hari Telat',
      'Status',
    ],
    rows
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan_payroll_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

export default exportApi;
