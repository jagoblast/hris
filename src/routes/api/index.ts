import { Hono } from 'hono';
import authApi from './auth';
import attendanceApi from './attendance';
import leavesApi from './leaves';
import reimburseApi from './reimbursements';
import payrollApi from './payroll';
import meetingsApi from './meetings';
import exportApi from './export';
import usersApi from './users';

const api = new Hono();

// Health check endpoint for container & mobile clients
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'Nusantara HRIS Cloud API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    security: {
      auth: 'JWT HS256',
      database: 'Cloudflare D1 Compatible'
    }
  });
});

api.route('/auth', authApi);
api.route('/attendance', attendanceApi);
api.route('/leaves', leavesApi);
api.route('/reimbursements', reimburseApi);
api.route('/payroll', payrollApi);
api.route('/meetings', meetingsApi);
api.route('/export', exportApi);
api.route('/users', usersApi);

export default api;
