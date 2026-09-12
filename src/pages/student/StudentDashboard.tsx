import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, Slot, LocalUser, Appointment, generateId } from '../../lib/storage';
import { Search, Calendar, Clock, User, ChevronRight, BookOpen, CheckCircle, Clock as ClockIcon, Settings, Trash2, GraduationCap, Building, MapPin, Mail } from 'lucide-react';
import { Profile } from '../Profile';
import { useAppointmentReminder } from '../../hooks/useAppointmentReminder';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'book' | 'appointments' | 'profile'>('book');
  const [lecturers, setLecturers] = useState<LocalUser[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [myAppointments, setMyAppointments] = useState<(Appointment & { lecturer: LocalUser, slot: Slot })[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [lecturerSearch, setLecturerSearch] = useState('');

  // Initialize appointment reminder hook
  useAppointmentReminder(myAppointments);

  
  // Loading states
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  const loadLecturersAndAppointments = () => {
    if (!user) return;
    
    // Simulate network delay for lecturers
    setIsLoadingLecturers(true);
    setTimeout(() => {
      setLecturers(db.users.getLecturers());
      setIsLoadingLecturers(false);
    }, 600);

    // Simulate network delay for appointments
    setIsLoadingAppointments(true);
    setTimeout(() => {
      const rawAppointments = db.appointments.getByStudent(user.id);
      const enriched = rawAppointments.map(app => ({
        ...app,
        lecturer: db.users.findById(app.lecturer_id)!,
        slot: db.slots.getAll().find(s => s.id === app.slot_id)!
      })).filter(app => app.slot && app.lecturer);
      
      enriched.sort((a, b) => new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime());
      setMyAppointments(enriched);
      setIsLoadingAppointments(false);
    }, 800);
  };

  const loadSlots = (lecturerId: string) => {
    setIsLoadingSlots(true);
    setTimeout(() => {
      setAvailableSlots(db.slots.getAvailable(lecturerId));
      setIsLoadingSlots(false);
    }, 500);
  };

  useEffect(() => {
    loadLecturersAndAppointments();
  }, [user]);

  useEffect(() => {
    if (selectedLecturer) {
      loadSlots(selectedLecturer);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedLecturer]);

  const handleBookSlot = (slotId: string) => {
    if (!user || !selectedLecturer) return;
    
    // Create actual appointment record
    const appointment: Appointment = {
      id: generateId(),
      student_id: user.id,
      lecturer_id: selectedLecturer,
      slot_id: slotId,
      status: 'pending',
      notes: '',
      created_at: new Date().toISOString()
    };
    
    db.appointments.save(appointment);
    db.slots.markBooked(slotId);
    
    loadLecturersAndAppointments();
    loadSlots(selectedLecturer);
    toast.success("Appointment successfully booked!");
    setActiveTab('appointments');
  };

  const handleCancelAppointment = (appointmentId: string, slotId: string) => {
    db.appointments.updateStatus(appointmentId, 'cancelled' as any);
    db.slots.markBooked(slotId, false);
    loadLecturersAndAppointments();
    toast.info("Appointment cancelled successfully.");
  };

  const SkeletonLecturer = () => (
    <div className="p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="bg-gray-200 dark:bg-gray-700 h-10 w-10 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );

  const SkeletonSlot = () => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-full">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="w-full h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    </div>
  );

  const SkeletonAppointment = () => (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 w-12 rounded-full"></div>
          <div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );

  const filteredAppointments = myAppointments.filter(app => {
    const endDateTime = new Date(`${app.slot.date}T${app.slot.end_time}`);
    const isPast = endDateTime < new Date();
    return appointmentFilter === 'upcoming' ? !isPast : isPast;
  });

  const filteredLecturers = lecturers.filter(lecturer => {
    const searchLower = lecturerSearch.toLowerCase();
    const fullName = `${lecturer.first_name} ${lecturer.last_name}`.toLowerCase();
    const department = (lecturer.department || lecturer.department_id || 'Computer Science').toLowerCase();
    const faculty = (lecturer.faculty || '').toLowerCase();
    const level = (lecturer.level || '').toLowerCase();
    return fullName.includes(searchLower) || department.includes(searchLower) || faculty.includes(searchLower) || level.includes(searchLower);
  });

  const selectedLecturerObj = lecturers.find(l => l.id === selectedLecturer);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Dashboard Tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'book'}
            aria-controls="tabpanel-book"
            id="tab-book"
            onClick={() => setActiveTab('book')}
            className={`${
              activeTab === 'book'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Search className="h-4 w-4 mr-2" aria-hidden="true" />
            Find & Book
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'appointments'}
            aria-controls="tabpanel-appointments"
            id="tab-appointments"
            onClick={() => setActiveTab('appointments')}
            className={`${
              activeTab === 'appointments'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
            My Appointments
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="tabpanel-profile"
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            Profile Setup
          </button>
        </nav>
      </div>

      {activeTab === 'book' ? (
        <div id="tabpanel-book" role="tabpanel" aria-labelledby="tab-book" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lecturers List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow lg:col-span-1 border border-gray-100 dark:border-gray-700 h-fit flex flex-col max-h-[700px]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                Find a Lecturer
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  value={lecturerSearch}
                  onChange={(e) => setLecturerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  aria-label="Search lecturers"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto flex-1">
              {isLoadingLecturers ? (
                <>
                  <SkeletonLecturer />
                  <SkeletonLecturer />
                  <SkeletonLecturer />
                  <SkeletonLecturer />
                </>
              ) : filteredLecturers.length === 0 ? (
                <li className="p-8 text-gray-500 text-sm text-center">
                  {lecturers.length === 0 ? "No lecturers available." : "No lecturers match your search."}
                </li>
              ) : (
                filteredLecturers.map(lecturer => (
                  <li key={lecturer.id}>
                    <button
                      onClick={() => setSelectedLecturer(lecturer.id)}
                      className={`w-full text-left p-4 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${selectedLecturer === lecturer.id ? 'bg-indigo-50 dark:bg-gray-700 border-l-4 border-indigo-600 dark:border-indigo-400' : 'border-l-4 border-transparent'}`}
                      aria-pressed={selectedLecturer === lecturer.id}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5" aria-hidden="true">
                          {lecturer.first_name[0]}{lecturer.last_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lecturer.first_name} {lecturer.last_name}</p>
                          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {lecturer.faculty && <span className="font-medium text-gray-700 dark:text-gray-300">{lecturer.faculty}</span>}
                            {lecturer.faculty && (lecturer.department || lecturer.department_id) && <span>•</span>}
                            <span>{lecturer.department || lecturer.department_id || 'Computer Science'}</span>
                          </div>
                          {lecturer.level && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <GraduationCap className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                                Levels: {lecturer.level}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 shrink-0 ml-2 ${selectedLecturer === lecturer.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} aria-hidden="true" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Available Slots */}
          <div className="lg:col-span-2">
            {selectedLecturer && selectedLecturerObj ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                {/* Lecturer Academic Information Card */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50/60 via-white to-gray-50/40 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-600 text-white h-14 w-14 rounded-full flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                        {selectedLecturerObj.first_name[0]}{selectedLecturerObj.last_name[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedLecturerObj.first_name} {selectedLecturerObj.last_name}
                          </h2>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                            Lecturer
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 pt-1">
                          {selectedLecturerObj.faculty && (
                            <div className="flex items-center gap-1.5">
                              <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span><strong className="text-gray-700 dark:text-gray-200">Faculty:</strong> {selectedLecturerObj.faculty}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span><strong className="text-gray-700 dark:text-gray-200">Department:</strong> {selectedLecturerObj.department || selectedLecturerObj.department_id || 'Computer Science'}</span>
                          </div>
                          {selectedLecturerObj.office_location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span><strong className="text-gray-700 dark:text-gray-200">Office:</strong> {selectedLecturerObj.office_location}</span>
                            </div>
                          )}
                        </div>

                        {selectedLecturerObj.level && (
                          <div className="pt-1 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Levels Taking:</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                              {selectedLecturerObj.level}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Consultation Slots */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Available Consultation Slots
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'} available
                  </span>
                </div>
                
                {isLoadingSlots ? (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SkeletonSlot />
                    <SkeletonSlot />
                    <SkeletonSlot />
                    <SkeletonSlot />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center flex-1">
                    <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="font-medium">This lecturer has no available slots at the moment.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please check back later or choose another lecturer.</p>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {availableSlots.map(slot => (
                      <div key={slot.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-gray-700/30 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-1">
                              <Calendar className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookSlot(slot.id)}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                          aria-label={`Book slot on ${new Date(slot.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} at ${slot.start_time}`}
                        >
                          Book Slot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 border-dashed rounded-lg h-full flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500 min-h-[400px]">
                <User className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 text-center">Select a lecturer to view their schedule</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'appointments' ? (
        /* My Appointments Tab */
        <div id="tabpanel-appointments" role="tabpanel" aria-labelledby="tab-appointments" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-transparent dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Booked Appointments</h3>
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
              <SkeletonAppointment />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p>You haven't booked any {appointmentFilter} appointments.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.map(app => (
                <li key={app.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg mt-1 shrink-0">
                        {app.lecturer.first_name[0]}{app.lecturer.last_name[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {app.lecturer.first_name} {app.lecturer.last_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
                          {app.lecturer.faculty && <span className="font-medium text-gray-700 dark:text-gray-300">{app.lecturer.faculty}</span>}
                          {app.lecturer.faculty && (app.lecturer.department || app.lecturer.department_id) && <span>•</span>}
                          <span>{app.lecturer.department || app.lecturer.department_id || 'Computer Science'}</span>
                          {app.lecturer.level && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Levels: {app.lecturer.level}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 shrink-0" />
                            {new Date(app.slot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 shrink-0" />
                            {app.slot.start_time} - {app.slot.end_time}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      {app.status === 'pending' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                          <ClockIcon className="h-4 w-4 mr-1.5" />
                          Pending
                        </span>
                      ) : app.status === 'approved' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Approved
                        </span>
                      ) : app.status === 'rejected' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Cancelled
                        </span>
                      )}
                      
                      {(app.status === 'pending' || app.status === 'approved') && (
                        <button
                          onClick={() => handleCancelAppointment(app.id, app.slot_id)}
                          className="mt-2 inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                          aria-label={`Cancel appointment with ${app.lecturer.first_name} ${app.lecturer.last_name} on ${new Date(app.slot.date).toLocaleDateString()}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1 text-gray-400" aria-hidden="true" />
                          Cancel Booking
                        </button>
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
        <div id="tabpanel-profile" role="tabpanel" aria-labelledby="tab-profile">
          <Profile />
        </div>
      )}
    </div>
  );
};
