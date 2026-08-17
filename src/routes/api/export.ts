import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const exportApi = new Hono();
exportApi.use('*', requireAuth(), requireRole('ADMIN', 'HRD'));

exportApi.get('/:table.csv', async (c) => {
  try {
    const db = getDB(c);
    const table = c.req.param('table');
    
    // Keamanan: Validasi tabel sebelum diekspor
    const allowedTables = ['attendance', 'leaves', 'reimbursements', 'payroll', 'users', 'meetings'];
    if (!allowedTables.includes(table)) {
      return c.text('Table not found or not allowed for export', 404);
    }

    const res = await db.prepare(`SELECT * FROM ${table}`).all();
    const data: any[] = res.results || [];
    
    if (data.length === 0) return c.text('No data available');

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(v => {
        if (v === null || v === undefined) return '""';
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    ).join('\n');
    
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.csv"`);
    return c.text(`${headers}\n${rows}`);
  } catch (err: any) {
    return c.text('Export Error: ' + err.message, 500);
  }
});

export default exportApi;
