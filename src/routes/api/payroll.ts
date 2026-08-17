import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { PayrollRecord, User, Attendance, Reimbursement, LeaveRequest } from '../../types';

const payrollApi = new Hono();
payrollApi.use('*', requireAuth());

// GET /api/v1/payroll
payrollApi.get('/', async (c) => {
  const user = c.get('user')!;
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;
  const year = c.req.query('year') ? Number(c.req.query('year')) : undefined;

  let res;
  if (user.role === 'KARYAWAN') {
    res = await db.prepare('SELECT * FROM payroll WHERE user_id = ?').bind(user.sub).all<PayrollRecord>();
  } else {
    res = await db.prepare('SELECT * FROM payroll').all<PayrollRecord>();
  }

  let items = res.results;
  if (month && year) {
    items = items.filter(p => Number(p.period_month) === month && Number(p.period_year) === year);
  }

  return c.json({
    success: true,
    total: items.length,
    data: items,
  });
});

// GET /api/v1/payroll/:id
payrollApi.get('/:id', async (c) => {
  const user = c.get('user')!;
  const id = c.req.param('id');

  const pay = await db.prepare('SELECT * FROM payroll WHERE id = ?').bind(id).first<PayrollRecord>();
  if (!pay) {
    return c.json({ success: false, error: 'Slip gaji tidak ditemukan.' }, 404);
  }

  // Employees can only view their own payslips
  if (user.role === 'KARYAWAN' && pay.user_id !== user.sub) {
    return c.json({ success: false, error: 'Akses ditolak.' }, 403);
  }

  const employee = await db.prepare('SELECT * FROM users WHERE id = ?').bind(pay.user_id).first<User>();

  return c.json({
    success: true,
    data: {
      ...pay,
      employee,
    },
  });
});

// POST /api/v1/payroll/generate (HRD & Admin only)
payrollApi.post('/generate', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const currentDate = new Date();
    const targetMonth = body.month ? Number(body.month) : (currentDate.getMonth() + 1);
    const targetYear = body.year ? Number(body.year) : currentDate.getFullYear();

    // Fetch all active employees
    const usersRes = await db.prepare("SELECT * FROM users WHERE status = 'ACTIVE'").all<User>();
    const allAttendance = await db.prepare('SELECT * FROM attendance').all<Attendance>();
    const allReimburses = await db.prepare('SELECT * FROM reimbursements').all<Reimbursement>();
    const allLeaves = await db.prepare('SELECT * FROM leaves').all<LeaveRequest>();

    const generated: PayrollRecord[] = [];

    for (const employee of usersRes.results) {
      // 1. Filter attendance for that month & year
      const empAttendance = allAttendance.results.filter(a => {
        if (a.user_id !== employee.id) return false;
        const [y, m] = a.date.split('-').map(Number);
        return y === targetYear && m === targetMonth;
      });

      const totalAttendanceDays = empAttendance.length;
      const totalLateDays = empAttendance.filter(a => a.is_late === 1).length;
      const totalWorkHours = empAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);

      // Overtime calculation (hours over 8hr per day)
      let overtimeHours = 0;
      empAttendance.forEach(a => {
        if (a.work_hours > 8) {
          overtimeHours += (a.work_hours - 8);
        }
      });
      const overtimePay = Math.round(overtimeHours * 50000); // Rp 50,000 / overtime hr

      // Approved Reimbursements for this employee
      const empReimbursements = allReimburses.results.filter(r => {
        if (r.user_id !== employee.id || r.status !== 'APPROVED') return false;
        const [y, m] = r.receipt_date.split('-').map(Number);
        return y === targetYear && m === targetMonth;
      });
      const reimbursePay = empReimbursements.reduce((sum, r) => sum + r.amount, 0);

      // Leaves
      const empLeaves = allLeaves.results.filter(l => {
        if (l.user_id !== employee.id || l.status !== 'APPROVED') return false;
        const [y, m] = l.start_date.split('-').map(Number);
        return y === targetYear && m === targetMonth;
      });
      const totalLeaveDays = empLeaves.reduce((sum, l) => sum + l.total_days, 0);

      // Standard working days in month (approx 22)
      const standardDays = 22;
      const totalAlphaDays = Math.max(0, standardDays - (totalAttendanceDays + totalLeaveDays));

      // Financial calculations
      const baseSalary = employee.base_salary;
      const transportAllowance = employee.allowance_transport;
      const mealAllowance = employee.allowance_meal;

      // Late penalty: Rp 25,000 per late day + Rp 500 per late minute
      const totalLateMinutes = empAttendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0);
      const lateDeduction = (totalLateDays * 25000) + (totalLateMinutes * 500);

      // Gross Salary
      const grossSalary = baseSalary + transportAllowance + mealAllowance + overtimePay + reimbursePay;

      // Deductions
      const bpjsDeduction = Math.round(baseSalary * 0.03); // 3% BPJS Ketenagakerjaan & Kesehatan
      const taxableBase = Math.max(0, grossSalary - 4500000); // PTKP simulation
      const taxDeduction = Math.round(taxableBase * 0.05); // 5% PPh 21

      // Net Salary
      const netSalary = Math.max(0, grossSalary - lateDeduction - bpjsDeduction - taxDeduction);

      const payId = `pay_${targetYear}_${String(targetMonth).padStart(2, '0')}_${employee.id.replace('usr_', '')}`;

      await db
        .prepare(
          'INSERT INTO payroll (id, user_id, period_month, period_year, base_salary, allowance_transport, allowance_meal, overtime_pay, reimburse_pay, late_deduction, tax_deduction, bpjs_deduction, gross_salary, net_salary, total_attendance_days, total_late_days, total_leave_days, total_alpha_days, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          payId,
          employee.id,
          targetMonth,
          targetYear,
          baseSalary,
          transportAllowance,
          mealAllowance,
          overtimePay,
          reimbursePay,
          lateDeduction,
          taxDeduction,
          bpjsDeduction,
          grossSalary,
          netSalary,
          totalAttendanceDays,
          totalLateDays,
          totalLeaveDays,
          totalAlphaDays,
          'APPROVED'
        )
        .run();

      generated.push({
        id: payId,
        user_id: employee.id,
        user_name: employee.name,
        user_position: employee.position,
        user_department: employee.department,
        period_month: targetMonth,
        period_year: targetYear,
        base_salary: baseSalary,
        allowance_transport: transportAllowance,
        allowance_meal: mealAllowance,
        overtime_pay: overtimePay,
        reimburse_pay: reimbursePay,
        late_deduction: lateDeduction,
        tax_deduction: taxDeduction,
        bpjs_deduction: bpjsDeduction,
        gross_salary: grossSalary,
        net_salary: netSalary,
        total_attendance_days: totalAttendanceDays,
        total_late_days: totalLateDays,
        total_leave_days: totalLeaveDays,
        total_alpha_days: totalAlphaDays,
        status: 'APPROVED',
        created_at: new Date().toISOString(),
      });
    }

    return c.json({
      success: true,
      message: `Payroll otomatis untuk periode ${targetMonth}/${targetYear} berhasil diproses untuk ${generated.length} karyawan!`,
      data: generated,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/payroll/:id/status (Mark PAID / APPROVED)
payrollApi.patch('/:id/status', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    if (!['DRAFT', 'APPROVED', 'PAID'].includes(status)) {
      return c.json({ success: false, error: 'Status tidak valid.' }, 400);
    }

    await db.prepare('UPDATE payroll SET status = ? WHERE id = ?').bind(status, id).run();

    return c.json({
      success: true,
      message: `Status slip gaji berhasil diubah menjadi ${status}.`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default payrollApi;
