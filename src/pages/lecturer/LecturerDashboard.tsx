import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, Slot, LocalUser, Appointment, generateId } from '../../lib/storage';
import { firebaseDb } from '../../lib/firebaseService';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, BookOpen, Check, X, Settings } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { Profile } from '../Profile';
import { useAppointmentReminder } from '../../hooks/useAppointmentReminder';

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'schedule' | 'appointments' | 'profile'>('schedule');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<(Appointment & { student: LocalUser, slot: Slot })[]>([]);
  
  // Initialize appointment reminder hook
  useAppointmentReminder(appointments);
  
  // Loading states
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  
  const [appointmentFilter, setAppointmentFilter] = useState<'upcoming' | 'past'>('upcoming');

  // New slot form state
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoadingSlots(true);
    try {
      const fbSlots = await firebaseDb.slots.getByLecturer(user.id);
      const localSlots = db.slots.getByLecturer(user.id);
      const combined = [...fbSlots];
      for (const s of localSlots) {
        if (!combined.some(c => c.id === s.id)) {
          combined.push(s);
        }
      }
      setSlots(combined);
    } catch {
      setSlots(db.slots.getByLecturer(user.id));
    } finally {
      setIsLoadingSlots(false);
    }
    
    setIsLoadingAppointments(true);
    try {
      const rawAppointments = await firebaseDb.appointments.getByLecturer(user.id);
      const allSlots = await firebaseDb.slots.getAll();
      const localSlots = db.slots.getAll();
      const mergedSlots = [...allSlots, ...localSlots];

      const enriched: (Appointment & { student: LocalUser, slot: Slot })[] = [];
      for (const app of rawAppointments) {
        let student = await firebaseDb.users.get(app.student_id) as LocalUser;
        if (!student) {
          student = db.users.findById(app.student_id)!;
        }
        const slot = mergedSlots.find(s => s.id === app.slot_id);
        if (student && slot) {
          enriched.push({ ...app, student, slot });
        }
      }

      // Merge local appointments
      const localApps = db.appointments.getByLecturer(user.id);
      for (const app of localApps) {
        if (!enriched.some(e => e.id === app.id)) {
          const student = db.users.findById(app.student_id);
          const slot = db.slots.getAll().find(s => s.id === app.slot_id);
          if (student && slot) {
            enriched.push({ ...app, student, slot });
          }
        }
      }

      enriched.sort((a, b) => new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime());
      setAppointments(enriched);
    } catch {
      const rawAppointments = db.appointments.getByLecturer(user.id);
      const enriched = rawAppointments.map(app => ({
        ...app,
        student: db.users.findById(app.student_id)!,
        slot: db.slots.getAll().find(s => s.id === app.slot_id)!
      })).filter(app => app.slot && app.student);
      
      enriched.sort((a, b) => new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime());
      setAppointments(enriched);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !startTime || !endTime) return;

    const newSlot: Slot = {
      id: generateId(),
      lecturer_id: user.id,
      date: format(date, 'yyyy-MM-dd'),
      start_time: format(startTime, 'HH:mm'),
      end_time: format(endTime, 'HH:mm'),
      is_booked: false
    };

    try {
      await firebaseDb.slots.save(newSlot);
    } catch (err) {
      console.warn('Firestore slot save note:', err);
    }

    db.slots.save(newSlot);
    await loadData();
    
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    toast.success('Consultation slot added successfully.');
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await firebaseDb.slots.delete(id);
    } catch (err) {
      console.warn('Firestore slot delete note:', err);
    }

    db.slots.delete(id);
    await loadData();
    toast.info('Slot removed.');
  };

  const handleUpdateAppointment = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await firebaseDb.appointments.updateStatus(id, status);
      if (status === 'rejected') {
        const app = appointments.find(a => a.id === id);
        if (app) {
          await firebaseDb.slots.markBooked(app.slot_id, false);
        }
      }
    } catch (err) {
      console.warn('Firestore appointment status note:', err);
    }

    db.appointments.updateStatus(id, status);
    if (status === 'rejected') {
      const app = db.appointments.getByLecturer(user!.id).find(a => a.id === id);
      if (app) {
        db.slots.markBooked(app.slot_id, false);
      }
      toast.info('Appointment rejected and slot freed.');
    } else {
      toast.success('Appointment approved!');
    }
    await loadData();
  };

  const SkeletonSlot = () => (
    <div className="p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  const SkeletonAppointment = () => (
    <div className="p-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 w-12 rounded-full shrink-0"></div>
          <div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-64"></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  const filteredAppointments = appointments.filter(app => {
    const endDateTime = new Date(`${app.slot.date}T${app.slot.end_time}`);
    const isPast = endDateTime < new Date();
    return appointmentFilter === 'upcoming' ? !isPast : isPast;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Dashboard Tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'schedule'}
            aria-controls="tabpanel-schedule"
            id="tab-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`${
              activeTab === 'schedule'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Manage Schedule
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'appointments'}
            aria-controls="tabpanel-appointments"
            id="tab-appointments"
            onClick={() => setActiveTab('appointments')}
            className={`${
              activeTab === 'appointments'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
            Student Appointments
            {appointments.filter(a => a.status === 'pending').length > 0 && (
              <span className="ml-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 py-0.5 px-2 rounded-full text-xs font-bold" aria-label={`${appointments.filter(a => a.status === 'pending').length} pending`}>
                {appointments.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="tabpanel-profile"
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            Profile Setup
          </button>
        </nav>
      </div>

      {activeTab === 'schedule' ? (
        <div id="tabpanel-schedule" role="tabpanel" aria-labelledby="tab-schedule" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Availability Slot</h2>
            <form onSubmit={handleAddSlot} className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="w-full lg:w-auto flex-1">
                <label htmlFor="slot_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <div className="relative w-full">
                  <DatePicker
                    id="slot_date"
                    selected={date}
                    onChange={(d: Date | null) => d && setDate(d)}
                    dateFormat="MMMM d, yyyy"
                    minDate={new Date()}
                    placeholderText="Select date"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-auto flex-1">
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                <div className="relative w-full">
                  <DatePicker
                    id="start_time"
                    selected={startTime}
                    onChange={(d: Date | null) => d && setStartTime(d)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    placeholderText="Start time"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-auto flex-1">
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                <div className="relative w-full">
                  <DatePicker
                    id="end_time"
                    selected={endTime}
                    onChange={(d: Date | null) => d && setEndTime(d)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    minTime={startTime || undefined}
                    maxTime={startTime ? new Date(new Date(startTime).setHours(23, 59)) : undefined}
                    placeholderText="End time"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Upcoming Slots</h3>
            </div>
            {isLoadingSlots ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <SkeletonSlot />
                <SkeletonSlot />
                <SkeletonSlot />
              </div>
            ) : slots.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No availability slots configured yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {slots.map((slot) => (
                  <li key={slot.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 gap-4 transition-colors">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white font-medium">
                        <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div>
                        {slot.is_booked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                            Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                    {!slot.is_booked && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors self-end sm:self-auto"
                        title="Delete slot"
                        aria-label={`Delete slot on ${new Date(slot.date).toLocaleDateString()} at ${slot.start_time}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : activeTab === 'appointments' ? (
        /* Appointments Tab */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Student Appointments</h3>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              <button
                onClick={() => setAppointmentFilter('upcoming')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  appointmentFilter === 'upcoming' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setAppointmentFilter('past')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  appointmentFilter === 'past' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Past
              </button>
            </div>
          </div>
          {isLoadingAppointments ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <SkeletonAppointment />
              <SkeletonAppointment />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p>You don't have any {appointmentFilter} appointments.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.map(app => (
                <li key={app.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg mt-1 shrink-0">
                        {app.student.first_name[0]}{app.student.last_name[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {app.student.first_name} {app.student.last_name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{app.student.email}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {app.student.faculty && <span className="font-medium text-gray-700 dark:text-gray-300">Faculty: {app.student.faculty}</span>}
                          {app.student.faculty && (app.student.department || app.student.department_id) && <span>•</span>}
                          <span>Dept: {app.student.department || app.student.department_id || 'Computer Science'}</span>
                          {app.student.level && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Level: {app.student.level}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                          <div className="flex items-center font-medium">
                            <CalendarIcon className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                            {new Date(app.slot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="flex items-center font-medium">
                            <Clock className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                            {app.slot.start_time} - {app.slot.end_time}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 md:w-auto w-full mt-4 md:mt-0">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateAppointment(app.id, 'rejected')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-900 transition-colors"
                            aria-label={`Reject appointment with ${app.student.first_name} ${app.student.last_name}`}
                          >
                            <X className="h-4 w-4 mr-1.5 text-red-500 dark:text-red-400" aria-hidden="true" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateAppointment(app.id, 'approved')}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                            aria-label={`Approve appointment with ${app.student.first_name} ${app.student.last_name}`}
                          >
                            <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            Approve
                          </button>
                        </>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {app.status === 'approved' ? (
                            <><Check className="h-4 w-4 mr-1.5" /> Approved</>
                          ) : (
                            <><X className="h-4 w-4 mr-1.5" /> Rejected</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* Profile Tab */
        <Profile />
      )}
    </div>
  );
};
