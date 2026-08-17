-- Nusantara HRIS Cloudflare D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HRD', 'KARYAWAN')),
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT DEFAULT '',
  base_salary REAL NOT NULL DEFAULT 5000000,
  allowance_transport REAL NOT NULL DEFAULT 500000,
  allowance_meal REAL NOT NULL DEFAULT 500000,
  join_date TEXT NOT NULL,
  leave_quota INTEGER NOT NULL DEFAULT 12,
  avatar TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  check_in_lat REAL,
  check_in_lng REAL,
  check_in_location TEXT,
  is_late INTEGER NOT NULL DEFAULT 0,
  late_minutes INTEGER NOT NULL DEFAULT 0,
  work_hours REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('PRESENT', 'LATE', 'LEAVE', 'SICK', 'ALPHA')),
  notes TEXT,
  selfie_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reimbursements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  receipt_date TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
  approved_by TEXT,
  approved_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  base_salary REAL NOT NULL,
  allowance_transport REAL NOT NULL DEFAULT 0,
  allowance_meal REAL NOT NULL DEFAULT 0,
  overtime_pay REAL NOT NULL DEFAULT 0,
  reimburse_pay REAL NOT NULL DEFAULT 0,
  late_deduction REAL NOT NULL DEFAULT 0,
  tax_deduction REAL NOT NULL DEFAULT 0,
  bpjs_deduction REAL NOT NULL DEFAULT 0,
  gross_salary REAL NOT NULL,
  net_salary REAL NOT NULL,
  total_attendance_days INTEGER NOT NULL DEFAULT 0,
  total_late_days INTEGER NOT NULL DEFAULT 0,
  total_leave_days INTEGER NOT NULL DEFAULT 0,
  total_alpha_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'APPROVED', 'PAID')),
  paid_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, period_month, period_year)
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room_location TEXT NOT NULL,
  is_online INTEGER NOT NULL DEFAULT 0,
  meeting_link TEXT,
  organizer_id TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'DECLINED')),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(meeting_id, user_id)
);
