import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  runTransaction 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, firestore } from './firebase';
import { UserProfile } from '../types';
import { Slot, Appointment } from './storage';

export { auth, firestore };

// Firestore collection names
const USERS_COLLECTION = 'users';
const SLOTS_COLLECTION = 'slots';
const APPOINTMENTS_COLLECTION = 'appointments';

// Default initial lecturers for seeding if database is empty
const defaultSeedLecturers: UserProfile[] = [
  {
    id: 'lecturer-1',
    email: 'sarah.jenkins@university.edu',
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

export const firebaseDb = {
  users: {
    get: async (id: string): Promise<UserProfile | null> => {
      const snap = await getDoc(doc(firestore, USERS_COLLECTION, id));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    },
    
    save: async (user: UserProfile): Promise<void> => {
      await setDoc(doc(firestore, USERS_COLLECTION, user.id), user, { merge: true });
    },

    getLecturers: async (): Promise<UserProfile[]> => {
      const q = query(
        collection(firestore, USERS_COLLECTION),
        where('role', '==', 'lecturer')
      );
      const snap = await getDocs(q);
      const lecturers = snap.docs.map(d => d.data() as UserProfile);

      // If empty, seed default lecturers
      if (lecturers.length === 0) {
        for (const l of defaultSeedLecturers) {
          await setDoc(doc(firestore, USERS_COLLECTION, l.id), l);
        }
        return defaultSeedLecturers;
      }
      return lecturers;
    }
  },

  slots: {
    getAll: async (): Promise<Slot[]> => {
      const snap = await getDocs(collection(firestore, SLOTS_COLLECTION));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Slot));
    },

    getByLecturer: async (lecturerId: string): Promise<Slot[]> => {
      const q = query(
        collection(firestore, SLOTS_COLLECTION),
        where('lecturer_id', '==', lecturerId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Slot));
    },

    getAvailable: async (lecturerId: string): Promise<Slot[]> => {
      const q = query(
        collection(firestore, SLOTS_COLLECTION),
        where('lecturer_id', '==', lecturerId),
        where('is_booked', '==', false)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Slot));
    },

    save: async (slot: Slot): Promise<void> => {
      await setDoc(doc(firestore, SLOTS_COLLECTION, slot.id), slot);
    },

    delete: async (id: string): Promise<void> => {
      await deleteDoc(doc(firestore, SLOTS_COLLECTION, id));
    },

    markBooked: async (id: string, is_booked: boolean = true): Promise<void> => {
      await updateDoc(doc(firestore, SLOTS_COLLECTION, id), { is_booked });
    }
  },

  appointments: {
    getByStudent: async (studentId: string): Promise<Appointment[]> => {
      const q = query(
        collection(firestore, APPOINTMENTS_COLLECTION),
        where('student_id', '==', studentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
    },

    getByLecturer: async (lecturerId: string): Promise<Appointment[]> => {
      const q = query(
        collection(firestore, APPOINTMENTS_COLLECTION),
        where('lecturer_id', '==', lecturerId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
    },

    // Safe transaction-based booking to prevent race conditions and double-booking
    bookSlotWithTransaction: async (appointment: Appointment): Promise<boolean> => {
      const slotRef = doc(firestore, SLOTS_COLLECTION, appointment.slot_id);
      const apptRef = doc(firestore, APPOINTMENTS_COLLECTION, appointment.id);

      return await runTransaction(firestore, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) {
          throw new Error('Slot does not exist');
        }

        const slotData = slotDoc.data();
        if (slotData.is_booked) {
          throw new Error('Slot has already been booked by another student');
        }

        // Mark slot as booked
        transaction.update(slotRef, { is_booked: true });
        // Save appointment
        transaction.set(apptRef, appointment);
        return true;
      });
    },

    updateStatus: async (id: string, status: Appointment['status']): Promise<void> => {
      await updateDoc(doc(firestore, APPOINTMENTS_COLLECTION, id), { status });
    }
  }
};
