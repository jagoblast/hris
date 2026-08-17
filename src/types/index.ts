export type UserRole = 'ADMIN' | 'HRD' | 'KARYAWAN';

export interface User {
  id: string;
  nip: string;
  name: string;
  email: string;
  password_hash: string;
  password?: string;
  role: UserRole;
  position: string;
  department: string;
  phone: string;
  base_salary: number;
  allowance_transport: number;
  allowance_meal: number;
  join_date: string;
  leave_quota: number;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  user_name?: string;
  user_department?: string;
  date: string; // YYYY-MM-DD
  check_in_time: string | null; // HH:mm:ss
  check_out_time: string | null; // HH:mm:ss
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  check_in_location?: string | null;
  is_late: number; // 0 or 1
  late_minutes: number;
  work_hours: number;
  status: 'PRESENT' | 'LATE' | 'LEAVE' | 'SICK' | 'ALPHA';
  notes?: string | null;
  selfie_url?: string | null;
  created_at: string;
}

export type LeaveType = 'TAHUNAN' | 'SAKIT' | 'IZIN_KHUSUS' | 'MELAHIRKAN' | 'MENIKAH';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_position?: string;
  user_department?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url?: string | null;
  status: LeaveStatus;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export type ReimburseCategory = 'TRANSPORT' | 'KONSUMSI' | 'MEDIS' | 'OPERASIONAL' | 'PELATIHAN' | 'LAINNYA';
export type ReimburseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface Reimbursement {
  id: string;
  user_id: string;
  user_name?: string;
  user_department?: string;
  category: ReimburseCategory;
  amount: number;
  description: string;
  receipt_date: string;
  receipt_url: string;
  status: ReimburseStatus;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  user_id: string;
  user_name?: string;
  user_position?: string;
  user_department?: string;
  period_month: number; // 1-12
  period_year: number; // e.g. 2026
  base_salary: number;
  allowance_transport: number;
  allowance_meal: number;
  overtime_pay: number;
  reimburse_pay: number;
  late_deduction: number;
  tax_deduction: number;
  bpjs_deduction: number;
  gross_salary: number;
  net_salary: number;
  total_attendance_days: number;
  total_late_days: number;
  total_leave_days: number;
  total_alpha_days: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paid_at?: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  room_location: string;
  is_online: number; // 0 or 1
  meeting_link?: string | null;
  organizer_id: string;
  organizer_name?: string;
  department: string;
  created_at: string;
  attendees?: MeetingAttendee[];
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
}

export interface JWTPayload {
  sub: string; // user id
  nip: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatar?: string;
  exp?: number;
  iat?: number;
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

