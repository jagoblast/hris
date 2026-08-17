import { Hono } from 'hono';
import authApi from './auth';
import attendanceApi from './attendance';
import leavesApi from './leaves';
import reimbursementsApi from './reimbursements';
import payrollApi from './payroll';
import meetingsApi from './meetings';
import usersApi from './users';
import settingsApi from './settings';
import exportApi from './export';

const api = new Hono();

api.route('/auth', authApi);
api.route('/attendance', attendanceApi);
api.route('/leaves', leavesApi);
api.route('/reimbursements', reimbursementsApi);
api.route('/payroll', payrollApi);
api.route('/meetings', meetingsApi);
api.route('/users', usersApi);
api.route('/settings', settingsApi);
api.route('/export', exportApi);

export default api;
