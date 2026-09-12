import { UserProfile, Role } from '../types';

export interface LocalUser extends UserProfile {
  password?: string; // For mock local authentication
}

export interface Slot {
  id: string;
  lecturer_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_booked: boolean;
}

export interface Appointment {
  id: string;
  student_id: string;
  lecturer_id: string;
  slot_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string;
  created_at: string;
}

// Utility functions for type-safe local storage access
const get = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const set = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Generate a random ID (UUID-like) for our mock DB
export const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultMockLecturers: LocalUser[] = [
  {
    id: 'lecturer-1',
    email: 'sarah.jenkins@university.edu',
    password: 'password123',
    first_name: 'Dr. Sarah',
    last_name: 'Jenkins',
    role: 'lecturer',
    is_active: true,
    faculty: 'Science',
    department: 'Computer Science',
    department_id: 'Computer Science',
    level: '100, 200, 400',
    office_location: 'Science Block B, Room 204',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lecturer-2',
    email: 'david.adebayo@university.edu',
    password: 'password123',
    first_name: 'Prof. David',
    last_name: 'Adebayo',
    role: 'lecturer',
    is_active: true,
    faculty: 'Engineering',
    department: 'Electrical & Electronics',
    department_id: 'Electrical & Electronics',
    level: '200, 300, 500',
    office_location: 'Engineering Complex Room 102',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lecturer-3',
    email: 'elena.rostova@university.edu',
    password: 'password123',
    first_name: 'Dr. Elena',
    last_name: 'Rostova',
    role: 'lecturer',
    is_active: true,
    faculty: 'Science',
    department: 'Mathematics & Statistics',
    department_id: 'Mathematics & Statistics',
    level: '100, 300',
    office_location: 'Math Annex Room 305',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lecturer-4',
    email: 'michael.chen@university.edu',
    password: 'password123',
    first_name: 'Dr. Michael',
    last_name: 'Chen',
    role: 'lecturer',
    is_active: true,
    faculty: 'Computing & Informatics',
    department: 'Software Engineering',
    department_id: 'Software Engineering',
    level: '200, 400',
    office_location: 'Tech Hub Room 12',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper to seed initial sample slots
const getInitialSlots = (): Slot[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 2);
  const nextDayStr = nextDay.toISOString().split('T')[0];

  return [
    {
      id: 'slot-1',
      lecturer_id: 'lecturer-1',
      date: tomorrowStr,
      start_time: '10:00',
      end_time: '11:00',
      is_booked: false
    },
    {
      id: 'slot-2',
      lecturer_id: 'lecturer-1',
      date: tomorrowStr,
      start_time: '14:00',
      end_time: '15:00',
      is_booked: false
    },
    {
      id: 'slot-3',
      lecturer_id: 'lecturer-2',
      date: nextDayStr,
      start_time: '09:00',
      end_time: '10:00',
      is_booked: false
    },
    {
      id: 'slot-4',
      lecturer_id: 'lecturer-3',
      date: tomorrowStr,
      start_time: '11:30',
      end_time: '12:30',
      is_booked: false
    },
    {
      id: 'slot-5',
      lecturer_id: 'lecturer-4',
      date: nextDayStr,
      start_time: '13:00',
      end_time: '14:00',
      is_booked: false
    }
  ];
};

// The mock database interface
export const db = {
  users: {
    getAll: () => {
      const users = get<LocalUser[]>('labsync_users', []);
      if (users.length === 0) {
        set('labsync_users', defaultMockLecturers);
        return defaultMockLecturers;
      }
      return users;
    },
    findByEmail: (email: string) => db.users.getAll().find(u => u.email === email),
    findById: (id: string) => db.users.getAll().find(u => u.id === id),
    save: (user: LocalUser) => {
      const users = db.users.getAll();
      const existingIdx = users.findIndex(u => u.id === user.id);
      if (existingIdx >= 0) {
        users[existingIdx] = user;
      } else {
        users.push(user);
      }
      set('labsync_users', users);
    },
    getLecturers: () => db.users.getAll().filter(u => u.role === 'lecturer' && u.is_active)
  },
  
  slots: {
    getAll: () => {
      const slots = get<Slot[]>('labsync_slots', []);
      if (slots.length === 0) {
        const initialSlots = getInitialSlots();
        set('labsync_slots', initialSlots);
        return initialSlots;
      }
      return slots;
    },
    getByLecturer: (lecturerId: string) => db.slots.getAll().filter(s => s.lecturer_id === lecturerId),
    getAvailable: (lecturerId: string) => db.slots.getAll().filter(s => s.lecturer_id === lecturerId && !s.is_booked),
    save: (slot: Slot) => {
      const slots = db.slots.getAll();
      slots.push(slot);
      set('labsync_slots', slots);
    },
    delete: (id: string) => {
      const slots = db.slots.getAll().filter(s => s.id !== id);
      set('labsync_slots', slots);
    },
    markBooked: (id: string, is_booked: boolean = true) => {
      const slots = db.slots.getAll();
      const slot = slots.find(s => s.id === id);
      if (slot) {
        slot.is_booked = is_booked;
        set('labsync_slots', slots);
      }
    }
  },

  appointments: {
    getAll: () => get<Appointment[]>('labsync_appointments', []),
    getByStudent: (studentId: string) => db.appointments.getAll().filter(a => a.student_id === studentId),
    getByLecturer: (lecturerId: string) => db.appointments.getAll().filter(a => a.lecturer_id === lecturerId),
    save: (appointment: Appointment) => {
      const appointments = db.appointments.getAll();
      appointments.push(appointment);
      set('labsync_appointments', appointments);
    },
    updateStatus: (id: string, status: Appointment['status']) => {
      const appointments = db.appointments.getAll();
      const appt = appointments.find(a => a.id === id);
      if (appt) {
        appt.status = status;
        set('labsync_appointments', appointments);
      }
    }
  }
};
