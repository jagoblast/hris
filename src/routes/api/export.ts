import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';

const exportApi = new Hono();
exportApi.use('*', requireAuth());

exportApi.get('/:table.csv', async (c) => {
  try {
    const db = getDB(c);
    const table = c.req.param('table');
    
    // Validasi tabel untuk menghindari SQL injection
    const allowedTables = ['attendance', 'leaves', 'reimbursements', 'payroll'];
    if (!allowedTables.includes(table)) {
      return c.text('Table not found or not allowed for export', 404);
    }

    const res = await db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
    const data: any[] = res.results || [];
    
    if (data.length === 0) return c.text('No data available');

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${table}_export.csv"`);
    return c.text(`${headers}\n${rows}`);
  } catch (err: any) {
    return c.text('Export Error: ' + err.message, 500);
  }
});

export default exportApi;
