import { User, Attendance, LeaveRequest, Reimbursement, PayrollRecord, Meeting, MeetingAttendee, AppSetting } from '../types';

export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id?: number;
    changes?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run<T = any>(): Promise<D1Result<T>>;
  raw<T = any>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface DatabaseStore {
  users: User[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  reimbursements: Reimbursement[];
  payroll: PayrollRecord[];
  meetings: Meeting[];
  meeting_attendees: MeetingAttendee[];
  settings: AppSetting[];
}

class D1DatabaseEngine implements D1Database {
  private store: DatabaseStore;

  constructor() {
    this.store = this.loadData();
  }

  private getDefaultSettings(): AppSetting[] {
    return [
      {
        key: 'COMPANY_NAME',
        value: 'PT Nusantara Digital Pratama',
        description: 'Nama Resmi Perusahaan untuk Kop Surat & Slip Gaji',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'WORK_START_TIME',
        value: '08:30',
        description: 'Jam Masuk Kerja Standar (Batas Telat WIB)',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'WORK_END_TIME',
        value: '17:30',
        description: 'Jam Pulang Kerja Standar Kantor (WIB)',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'OFFICE_LATITUDE',
        value: '-6.2088',
        description: 'Koordinat Latitude Kantor Pusat Jakarta',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'OFFICE_LONGITUDE',
        value: '106.8456',
        description: 'Koordinat Longitude Kantor Pusat Jakarta',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'OFFICE_RADIUS_METERS',
        value: '100',
        description: 'Radius Geofencing Presensi GPS (Meter)',
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Load Data sekarang hanya menggunakan Initial Seed (In-Memory)
  // Tidak ada lagi pembacaan sistem file lokal (fs)
  private loadData(): DatabaseStore {
    return this.getInitialSeed();
  }

  // Save Data dinonaktifkan sementara untuk environment Cloudflare
  // (Data akan hilang saat worker restart selama belum dihubungkan ke real Cloudflare D1 binding)
  public saveData() {
      // Intentionally left blank. 
      // Do not write to file system in Cloudflare environment.
  }

  public getRawStore(): DatabaseStore {
    return this.store;
  }

  private getInitialSeed(): DatabaseStore {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const users: User[] = [
      {
        id: 'usr_admin_01',
        nip: 'ADM-2026-001',
        name: 'Budi Santoso, S.Kom',
        email: 'admin@nusantara.id',
        password_hash: 'admin123', 
        role: 'ADMIN',
        position: 'Head of IT & System Administrator',
        department: 'Information Technology',
        phone: '081234567890',
        base_salary: 12500000,
        allowance_transport: 1000000,
        allowance_meal: 1000000,
        join_date: '2023-01-15',
        leave_quota: 12,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        created_at: '2023-01-15T08:00:00.000Z',
      },
      {
        id: 'usr_hrd_01',
        nip: 'HRD-2026-002',
        name: 'Siti Rahmawati, S.Psi',
        email: 'hrd@nusantara.id',
        password_hash: 'hrd123',
        role: 'HRD',
        position: 'Human Resource Manager',
        department: 'Human Resources',
        phone: '081298765432',
        base_salary: 10500000,
        allowance_transport: 800000,
        allowance_meal: 800000,
        join_date: '2023-03-01',
        leave_quota: 12,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        created_at: '2023-03-01T08:00:00.000Z',
      },
      {
        id: 'usr_emp_01',
        nip: 'EMP-2026-003',
        name: 'Ahmad Fauzi',
        email: 'karyawan@nusantara.id',
        password_hash: 'karyawan123',
        role: 'KARYAWAN',
        position: 'Senior Fullstack Engineer',
        department: 'Engineering',
        phone: '081377889900',
        base_salary: 8500000,
        allowance_transport: 600000,
        allowance_meal: 600000,
        join_date: '2024-02-10',
        leave_quota: 10,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        created_at: '2024-02-10T08:00:00.000Z',
      },
      {
        id: 'usr_emp_02',
        nip: 'EMP-2026-004',
        name: 'Dewi Lestari',
        email: 'dewi@nusantara.id',
        password_hash: 'dewi123',
        role: 'KARYAWAN',
        position: 'UI/UX Product Designer',
        department: 'Product & Design',
        phone: '081355443322',
        base_salary: 7800000,
        allowance_transport: 600000,
        allowance_meal: 600000,
        join_date: '2024-05-01',
        leave_quota: 11,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        created_at: '2024-05-01T08:00:00.000Z',
      },
      {
        id: 'usr_emp_03',
        nip: 'EMP-2026-005',
        name: 'Rizky Pratama',
        email: 'rizky@nusantara.id',
        password_hash: 'rizky123',
        role: 'KARYAWAN',
        position: 'Digital Marketing & Growth',
        department: 'Marketing',
        phone: '081311223344',
        base_salary: 6500000,
        allowance_transport: 500000,
        allowance_meal: 500000,
        join_date: '2025-01-10',
        leave_quota: 12,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        created_at: '2025-01-10T08:00:00.000Z',
      }
    ];

    const attendance: Attendance[] = [
      {
        id: 'att_001',
        user_id: 'usr_admin_01',
        date: today,
        check_in_time: '08:15:20',
        check_out_time: null,
        check_in_lat: -6.2088,
        check_in_lng: 106.8456,
        check_in_location: 'Kantor Pusat Jakarta (Radius 25m)',
        is_late: 0,
        late_minutes: 0,
        work_hours: 0,
        status: 'PRESENT',
        notes: 'Check-in kantor tepat waktu',
        selfie_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        created_at: `${today}T08:15:20.000Z`,
      },
      {
        id: 'att_002',
        user_id: 'usr_hrd_01',
        date: today,
        check_in_time: '08:24:11',
        check_out_time: null,
        check_in_lat: -6.2089,
        check_in_lng: 106.8458,
        check_in_location: 'Kantor Pusat Jakarta',
        is_late: 0,
        late_minutes: 0,
        work_hours: 0,
        status: 'PRESENT',
        notes: 'Absen pagi via web portal',
        selfie_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        created_at: `${today}T08:24:11.000Z`,
      },
      {
        id: 'att_003',
        user_id: 'usr_emp_01',
        date: today,
        check_in_time: '08:48:30',
        check_out_time: null,
        check_in_lat: -6.2085,
        check_in_lng: 106.8450,
        check_in_location: 'Kantor Pusat Jakarta',
        is_late: 1,
        late_minutes: 18,
        work_hours: 0,
        status: 'LATE',
        notes: 'Macet di jalan tol dalam kota',
        selfie_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        created_at: `${today}T08:48:30.000Z`,
      },
      {
        id: 'att_004',
        user_id: 'usr_emp_02',
        date: today,
        check_in_time: '08:10:00',
        check_out_time: null,
        check_in_lat: -6.2087,
        check_in_lng: 106.8455,
        check_in_location: 'Kantor Pusat Jakarta',
        is_late: 0,
        late_minutes: 0,
        work_hours: 0,
        status: 'PRESENT',
        notes: 'Work from Office',
        selfie_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        created_at: `${today}T08:10:00.000Z`,
      },
      {
        id: 'att_005',
        user_id: 'usr_emp_01',
        date: yesterday,
        check_in_time: '08:20:00',
        check_out_time: '17:35:00',
        check_in_lat: -6.2088,
        check_in_lng: 106.8456,
        check_in_location: 'Kantor Pusat Jakarta',
        is_late: 0,
        late_minutes: 0,
        work_hours: 8.5,
        status: 'PRESENT',
        notes: 'Lembur sprint release',
        created_at: `${yesterday}T08:20:00.000Z`,
      }
    ];

    const leaves: LeaveRequest[] = [
      {
        id: 'lv_001',
        user_id: 'usr_emp_01',
        leave_type: 'TAHUNAN',
        start_date: '2026-08-25',
        end_date: '2026-08-26',
        total_days: 2,
        reason: 'Acara keluarga dan mudik ke Yogyakarta',
        attachment_url: null,
        status: 'PENDING',
        created_at: '2026-08-15T09:30:00.000Z',
      },
      {
        id: 'lv_002',
        user_id: 'usr_emp_02',
        leave_type: 'SAKIT',
        start_date: '2026-08-10',
        end_date: '2026-08-11',
        total_days: 2,
        reason: 'Flu berat dan demam tinggi, istirahat dokter',
        attachment_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300',
        status: 'APPROVED',
        approved_by: 'usr_hrd_01',
        approved_at: '2026-08-10T10:00:00.000Z',
        created_at: '2026-08-10T07:45:00.000Z',
      },
      {
        id: 'lv_003',
        user_id: 'usr_emp_03',
        leave_type: 'IZIN_KHUSUS',
        start_date: '2026-08-28',
        end_date: '2026-08-28',
        total_days: 1,
        reason: 'Perpanjangan dokumen paspor di Kantor Imigrasi',
        attachment_url: null,
        status: 'PENDING',
        created_at: '2026-08-16T14:20:00.000Z',
      }
    ];

    const reimbursements: Reimbursement[] = [
      {
        id: 'rmb_001',
        user_id: 'usr_emp_01',
        category: 'TRANSPORT',
        amount: 145000,
        description: 'Taksi Grab kunjungan klien ke SCBD Jakarta',
        receipt_date: '2026-08-14',
        receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
        status: 'APPROVED',
        approved_by: 'usr_hrd_01',
        approved_at: '2026-08-15T11:00:00.000Z',
        created_at: '2026-08-14T18:00:00.000Z',
      },
      {
        id: 'rmb_002',
        user_id: 'usr_emp_02',
        category: 'KONSUMSI',
        amount: 280000,
        description: 'Makan siang meeting user testing tim Product di Senayan',
        receipt_date: '2026-08-15',
        receipt_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=300',
        status: 'PENDING',
        created_at: '2026-08-15T16:30:00.000Z',
      },
      {
        id: 'rmb_003',
        user_id: 'usr_emp_03',
        category: 'MEDIS',
        amount: 350000,
        description: 'Klaim resep vitamin & konsultasi dokter umum',
        receipt_date: '2026-08-12',
        receipt_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300',
        status: 'APPROVED',
        approved_by: 'usr_hrd_01',
        approved_at: '2026-08-13T09:15:00.000Z',
        paid_at: '2026-08-16T15:00:00.000Z',
        created_at: '2026-08-12T13:00:00.000Z',
      }
    ];

    const payroll: PayrollRecord[] = [
      {
        id: 'pay_2026_07_01',
        user_id: 'usr_emp_01',
        period_month: 7,
        period_year: 2026,
        base_salary: 8500000,
        allowance_transport: 600000,
        allowance_meal: 600000,
        overtime_pay: 450000,
        reimburse_pay: 250000,
        late_deduction: 50000,
        tax_deduction: 250000,
        bpjs_deduction: 180000,
        gross_salary: 10400000,
        net_salary: 9920000,
        total_attendance_days: 22,
        total_late_days: 1,
        total_leave_days: 0,
        total_alpha_days: 0,
        status: 'PAID',
        paid_at: '2026-07-28T10:00:00.000Z',
        created_at: '2026-07-25T08:00:00.000Z',
      },
      {
        id: 'pay_2026_07_02',
        user_id: 'usr_emp_02',
        period_month: 7,
        period_year: 2026,
        base_salary: 7800000,
        allowance_transport: 600000,
        allowance_meal: 600000,
        overtime_pay: 0,
        reimburse_pay: 150000,
        late_deduction: 0,
        tax_deduction: 210000,
        bpjs_deduction: 160000,
        gross_salary: 9150000,
        net_salary: 8780000,
        total_attendance_days: 21,
        total_late_days: 0,
        total_leave_days: 1,
        total_alpha_days: 0,
        status: 'PAID',
        paid_at: '2026-07-28T10:00:00.000Z',
        created_at: '2026-07-25T08:00:00.000Z',
      }
    ];

    const meetings: Meeting[] = [
      {
        id: 'mtg_001',
        title: 'Weekly Engineering & Sprint Planning Q3',
        description: 'Review tiket sprint berjalan, koordinasi arsitektur cloud D1, dan evaluasi blocker.',
        date: today,
        start_time: '10:00',
        end_time: '11:30',
        room_location: 'Ruang Rapat Garuda Lt. 3',
        is_online: 1,
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        organizer_id: 'usr_admin_01',
        department: 'Engineering',
        created_at: `${today}T08:00:00.000Z`,
      },
      {
        id: 'mtg_002',
        title: 'HR All-Hands: Sosialisasi Kebijakan Cuti & BPJS Ketenagakerjaan',
        description: 'Pemaparan aturan baru plafon klaim medis dan simulasi payroll otomatis 2026.',
        date: today,
        start_time: '14:00',
        end_time: '15:30',
        room_location: 'Auditorium Utama & Zoom',
        is_online: 1,
        meeting_link: 'https://zoom.us/j/9876543210',
        organizer_id: 'usr_hrd_01',
        department: 'Human Resources',
        created_at: `${today}T08:00:00.000Z`,
      },
      {
        id: 'mtg_003',
        title: 'Product Design Critique & UX Testing Review',
        description: 'Review mockup UI flow mobile app HRIS dan feedback karyawan.',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        start_time: '13:00',
        end_time: '14:30',
        room_location: 'Creative Room Lt. 2',
        is_online: 0,
        meeting_link: null,
        organizer_id: 'usr_emp_02',
        department: 'Product & Design',
        created_at: `${today}T08:00:00.000Z`,
      }
    ];

    const meeting_attendees: MeetingAttendee[] = [
      { id: 'attnd_1', meeting_id: 'mtg_001', user_id: 'usr_admin_01', status: 'CONFIRMED' },
      { id: 'attnd_2', meeting_id: 'mtg_001', user_id: 'usr_emp_01', status: 'CONFIRMED' },
      { id: 'attnd_3', meeting_id: 'mtg_001', user_id: 'usr_emp_02', status: 'PENDING' },
      { id: 'attnd_4', meeting_id: 'mtg_002', user_id: 'usr_hrd_01', status: 'CONFIRMED' },
      { id: 'attnd_5', meeting_id: 'mtg_002', user_id: 'usr_emp_01', status: 'CONFIRMED' },
      { id: 'attnd_6', meeting_id: 'mtg_002', user_id: 'usr_emp_03', status: 'CONFIRMED' },
    ];

    const seed: DatabaseStore = {
      users,
      attendance,
      leaves,
      reimbursements,
      payroll,
      meetings,
      meeting_attendees,
      settings: this.getDefaultSettings(),
    };

    return seed;
  }

  public prepare(query: string): D1PreparedStatement {
    return new D1PreparedStatementImpl(this, query);
  }

  public async batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const stmt of statements) {
      results.push(await stmt.all<T>());
    }
    return results;
  }

  public async exec(query: string): Promise<{ count: number; duration: number }> {
    return { count: 1, duration: 2 };
  }
}

class D1PreparedStatementImpl implements D1PreparedStatement {
  private engine: D1DatabaseEngine;
  private query: string;
  private params: any[] = [];

  constructor(engine: D1DatabaseEngine, query: string) {
    this.engine = engine;
    this.query = query.trim();
  }

  public bind(...values: any[]): D1PreparedStatement {
    this.params = values;
    return this;
  }

  public async first<T = any>(colName?: string): Promise<T | null> {
    const res = await this.all<T>();
    if (res.results && res.results.length > 0) {
      const item = res.results[0];
      if (colName && typeof item === 'object' && item !== null) {
        return (item as any)[colName] ?? null;
      }
      return item;
    }
    return null;
  }

  public async raw<T = any>(): Promise<T[]> {
    const res = await this.all<T>();
    return res.results;
  }

  public async run<T = any>(): Promise<D1Result<T>> {
    return this.executeWrite<T>();
  }

  public async all<T = any>(): Promise<D1Result<T>> {
    const q = this.query.toUpperCase();
    if (q.startsWith('INSERT') || q.startsWith('UPDATE') || q.startsWith('DELETE')) {
      return this.executeWrite<T>();
    }
    return this.executeRead<T>();
  }

  private executeRead<T>(): D1Result<T> {
    const store = this.engine.getRawStore();
    const query = this.query;
    const params = this.params;

    let results: any[] = [];
    const getUser = (id: string) => store.users.find(u => u.id === id);

    if (/FROM users/i.test(query)) {
      results = [...store.users];
      if (/WHERE email = \?/i.test(query)) {
        results = results.filter(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
      } else if (/WHERE id = \?/i.test(query)) {
        results = results.filter(u => u.id === params[0]);
      } else if (/WHERE role = \?/i.test(query)) {
        results = results.filter(u => u.role === params[0]);
      }
    } else if (/FROM attendance/i.test(query)) {
      results = store.attendance.map(a => {
        const u = getUser(a.user_id);
        return {
          ...a,
          user_name: u?.name || 'Unknown',
          user_department: u?.department || '-',
        };
      });

      if (/WHERE user_id = \? AND date = \?/i.test(query)) {
        results = results.filter(a => a.user_id === params[0] && a.date === params[1]);
      } else if (/WHERE date = \?/i.test(query)) {
        results = results.filter(a => a.date === params[0]);
      } else if (/WHERE user_id = \?/i.test(query)) {
        results = results.filter(a => a.user_id === params[0]);
      }
      results.sort((a, b) => (b.date + (b.check_in_time || '')).localeCompare(a.date + (a.check_in_time || '')));
    } else if (/FROM leaves/i.test(query)) {
      results = store.leaves.map(l => {
        const u = getUser(l.user_id);
        const appr = l.approved_by ? getUser(l.approved_by) : null;
        return {
          ...l,
          user_name: u?.name || 'Unknown',
          user_position: u?.position || '-',
          user_department: u?.department || '-',
          approved_by_name: appr?.name || null,
        };
      });

      if (/WHERE id = \?/i.test(query)) {
        results = results.filter(l => l.id === params[0]);
      } else if (/WHERE user_id = \?/i.test(query)) {
        results = results.filter(l => l.user_id === params[0]);
      }
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (/FROM reimbursements/i.test(query)) {
      results = store.reimbursements.map(r => {
        const u = getUser(r.user_id);
        const appr = r.approved_by ? getUser(r.approved_by) : null;
        return {
          ...r,
          user_name: u?.name || 'Unknown',
          user_department: u?.department || '-',
          approved_by_name: appr?.name || null,
        };
      });

      if (/WHERE id = \?/i.test(query)) {
        results = results.filter(r => r.id === params[0]);
      } else if (/WHERE user_id = \?/i.test(query)) {
        results = results.filter(r => r.user_id === params[0]);
      }
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (/FROM payroll/i.test(query)) {
      results = store.payroll.map(p => {
        const u = getUser(p.user_id);
        return {
          ...p,
          user_name: u?.name || 'Unknown',
          user_position: u?.position || '-',
          user_department: u?.department || '-',
        };
      });

      if (/WHERE user_id = \? AND period_month = \? AND period_year = \?/i.test(query)) {
        results = results.filter(p => p.user_id === params[0] && Number(p.period_month) === Number(params[1]) && Number(p.period_year) === Number(params[2]));
      } else if (/WHERE id = \?/i.test(query)) {
        results = results.filter(p => p.id === params[0]);
      } else if (/WHERE period_month = \? AND period_year = \?/i.test(query)) {
        results = results.filter(p => Number(p.period_month) === Number(params[0]) && Number(p.period_year) === Number(params[1]));
      } else if (/WHERE user_id = \?/i.test(query)) {
        results = results.filter(p => p.user_id === params[0]);
      }
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (/FROM meetings/i.test(query)) {
      results = store.meetings.map(m => {
        const org = getUser(m.organizer_id);
        const attendees = store.meeting_attendees
          .filter(ma => ma.meeting_id === m.id)
          .map(ma => {
            const u = getUser(ma.user_id);
            return {
              ...ma,
              user_name: u?.name,
              user_avatar: u?.avatar,
            };
          });
        return {
          ...m,
          organizer_name: org?.name || 'HR Team',
          attendees,
        };
      });

      if (/WHERE id = \?/i.test(query)) {
        results = results.filter(m => m.id === params[0]);
      } else if (/WHERE date = \?/i.test(query)) {
        results = results.filter(m => m.date === params[0]);
      }
      results.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
    } else if (/FROM settings/i.test(query)) {
      results = [...store.settings];
      if (/WHERE key = \?/i.test(query)) {
        results = results.filter(s => s.key === params[0]);
      }
      results.sort((a, b) => a.key.localeCompare(b.key));
    }

    return {
      results: results as T[],
      success: true,
      meta: {
        duration: 1,
        rows_read: results.length,
        rows_written: 0,
      }
    };
  }

  private executeWrite<T>(): D1Result<T> {
    const store = this.engine.getRawStore();
    const query = this.query;
    const params = this.params;
    let changes = 0;

    if (/INSERT INTO users/i.test(query)) {
      const newUser: User = {
        id: params[0],
        nip: params[1],
        name: params[2],
        email: params[3],
        password_hash: params[4],
        role: params[5],
        position: params[6],
        department: params[7],
        phone: params[8] || '',
        base_salary: Number(params[9] || 0),
        allowance_transport: Number(params[10] || 0),
        allowance_meal: Number(params[11] || 0),
        join_date: params[12],
        leave_quota: Number(params[13] || 12),
        avatar: params[14] || '',
        status: params[15] || 'ACTIVE',
        created_at: new Date().toISOString(),
      };
      store.users.push(newUser);
      changes = 1;
    } else if (/INSERT INTO attendance/i.test(query)) {
      const newAtt: Attendance = {
        id: params[0],
        user_id: params[1],
        date: params[2],
        check_in_time: params[3],
        check_out_time: params[4],
        check_in_lat: params[5] ? Number(params[5]) : null,
        check_in_lng: params[6] ? Number(params[6]) : null,
        check_in_location: params[7] || null,
        is_late: Number(params[8] || 0),
        late_minutes: Number(params[9] || 0),
        work_hours: Number(params[10] || 0),
        status: params[11] || 'PRESENT',
        notes: params[12] || null,
        selfie_url: params[13] || null,
        created_at: new Date().toISOString(),
      };
      const idx = store.attendance.findIndex(a => a.user_id === newAtt.user_id && a.date === newAtt.date);
      if (idx >= 0) {
        store.attendance[idx] = newAtt;
      } else {
        store.attendance.push(newAtt);
      }
      changes = 1;
    } else if (/UPDATE attendance SET/i.test(query)) {
      if (/WHERE id = \?/i.test(query)) {
        const attId = params[params.length - 1];
        const att = store.attendance.find(a => a.id === attId);
        if (att) {
          if (/check_out_time = \?/i.test(query)) {
            att.check_out_time = params[0];
            att.work_hours = Number(params[1] || 0);
            if (params[2]) att.notes = params[2];
            changes = 1;
          }
        }
      }
    } else if (/INSERT INTO leaves/i.test(query)) {
      const newLeave: LeaveRequest = {
        id: params[0],
        user_id: params[1],
        leave_type: params[2],
        start_date: params[3],
        end_date: params[4],
        total_days: Number(params[5]),
        reason: params[6],
        attachment_url: params[7] || null,
        status: params[8] || 'PENDING',
        created_at: new Date().toISOString(),
      };
      store.leaves.push(newLeave);
      changes = 1;
    } else if (/UPDATE leaves SET/i.test(query)) {
      const leaveId = params[params.length - 1];
      const leave = store.leaves.find(l => l.id === leaveId);
      if (leave) {
        leave.status = params[0];
        leave.approved_by = params[1] || null;
        leave.approved_at = params[2] || new Date().toISOString();
        leave.rejection_reason = params[3] || null;
        if (leave.status === 'APPROVED' && leave.leave_type === 'TAHUNAN') {
          const u = store.users.find(usr => usr.id === leave.user_id);
          if (u) {
            u.leave_quota = Math.max(0, u.leave_quota - leave.total_days);
          }
        }
        changes = 1;
      }
    } else if (/INSERT INTO reimbursements/i.test(query)) {
      const newReimburse: Reimbursement = {
        id: params[0],
        user_id: params[1],
        category: params[2],
        amount: Number(params[3]),
        description: params[4],
        receipt_date: params[5],
        receipt_url: params[6] || '',
        status: params[7] || 'PENDING',
        created_at: new Date().toISOString(),
      };
      store.reimbursements.push(newReimburse);
      changes = 1;
    } else if (/UPDATE reimbursements SET/i.test(query)) {
      const rmbId = params[params.length - 1];
      const rmb = store.reimbursements.find(r => r.id === rmbId);
      if (rmb) {
        rmb.status = params[0];
        if (params[1]) rmb.approved_by = params[1];
        if (params[2]) rmb.approved_at = params[2];
        if (params[3]) rmb.paid_at = params[3];
        changes = 1;
      }
    } else if (/INSERT INTO payroll/i.test(query)) {
      const newPay: PayrollRecord = {
        id: params[0],
        user_id: params[1],
        period_month: Number(params[2]),
        period_year: Number(params[3]),
        base_salary: Number(params[4]),
        allowance_transport: Number(params[5] || 0),
        allowance_meal: Number(params[6] || 0),
        overtime_pay: Number(params[7] || 0),
        reimburse_pay: Number(params[8] || 0),
        late_deduction: Number(params[9] || 0),
        tax_deduction: Number(params[10] || 0),
        bpjs_deduction: Number(params[11] || 0),
        gross_salary: Number(params[12]),
        net_salary: Number(params[13]),
        total_attendance_days: Number(params[14] || 0),
        total_late_days: Number(params[15] || 0),
        total_leave_days: Number(params[16] || 0),
        total_alpha_days: Number(params[17] || 0),
        status: params[18] || 'DRAFT',
        created_at: new Date().toISOString(),
      };
      const idx = store.payroll.findIndex(p => p.user_id === newPay.user_id && p.period_month === newPay.period_month && p.period_year === newPay.period_year);
      if (idx >= 0) {
        store.payroll[idx] = newPay;
      } else {
        store.payroll.push(newPay);
      }
      changes = 1;
    } else if (/UPDATE payroll SET status = \?/i.test(query)) {
      const payId = params[params.length - 1];
      const p = store.payroll.find(pay => pay.id === payId);
      if (p) {
        p.status = params[0];
        if (params[0] === 'PAID') {
          p.paid_at = new Date().toISOString();
        }
        changes = 1;
      }
    } else if (/INSERT INTO meetings/i.test(query)) {
      const newMtg: Meeting = {
        id: params[0],
        title: params[1],
        description: params[2],
        date: params[3],
        start_time: params[4],
        end_time: params[5],
        room_location: params[6],
        is_online: Number(params[7] || 0),
        meeting_link: params[8] || null,
        organizer_id: params[9],
        department: params[10] || 'General',
        created_at: new Date().toISOString(),
      };
      store.meetings.push(newMtg);
      changes = 1;
    } else if (/INSERT INTO meeting_attendees/i.test(query)) {
      const newAtnd: MeetingAttendee = {
        id: params[0],
        meeting_id: params[1],
        user_id: params[2],
        status: params[3] || 'PENDING',
      };
      store.meeting_attendees.push(newAtnd);
      changes = 1;
    } else if (/UPDATE meeting_attendees SET status = \?/i.test(query)) {
      const meetingId = params[1];
      const userId = params[2];
      const atnd = store.meeting_attendees.find(a => a.meeting_id === meetingId && a.user_id === userId);
      if (atnd) {
        atnd.status = params[0];
        changes = 1;
      }
    } else if (/INSERT INTO settings/i.test(query) || /REPLACE INTO settings/i.test(query)) {
      const key = params[0];
      const value = String(params[1]);
      const description = params[2] || '';
      const now = new Date().toISOString();
      const idx = store.settings.findIndex(s => s.key === key);
      if (idx >= 0) {
        store.settings[idx] = {
          ...store.settings[idx],
          value,
          description: description || store.settings[idx].description,
          updated_at: now,
        };
      } else {
        store.settings.push({
          key,
          value,
          description,
          updated_at: now,
        });
      }
      changes = 1;
    } else if (/UPDATE settings SET/i.test(query)) {
      const key = params[params.length - 1];
      const val = String(params[0]);
      const setting = store.settings.find(s => s.key === key);
      if (setting) {
        setting.value = val;
        setting.updated_at = new Date().toISOString();
        changes = 1;
      }
    }

    if (changes > 0) {
      this.engine.saveData();
    }

    return {
      results: [] as T[],
      success: true,
      meta: {
        duration: 1,
        rows_read: 0,
        rows_written: changes,
        changes,
      }
    };
  }
}

export const db: D1Database = new D1DatabaseEngine();
export const getDatabase = (): D1Database => db;

export async function getSettingValue(key: string, defaultValue = ''): Promise<string> {
  const row = await db.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first<AppSetting>();
  return row?.value ?? defaultValue;
}

export async function getAllSettingsMap(): Promise<Record<string, string>> {
  const res = await db.prepare('SELECT * FROM settings').all<AppSetting>();
  const map: Record<string, string> = {};
  for (const item of res.results) {
    map[item.key] = item.value;
  }
  return map;
}
