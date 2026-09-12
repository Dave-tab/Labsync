import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export const useAppointmentReminder = (appointments: any[]) => {
  const { toast } = useToast();
  // Keep track of which appointments we have already notified the user about
  const notifiedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request browser notification permission if available and not yet requested
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }

    const checkReminders = () => {
      const now = new Date();
      
      appointments.forEach(app => {
        // Only notify for upcoming approved or pending appointments
        if (app.status !== 'approved' && app.status !== 'pending') return;
        if (notifiedSet.current.has(app.id)) return;

        if (app.slot && app.slot.date && app.slot.start_time) {
          // Parse slot date and time. Fallback to standard formats.
          const timeString = app.slot.start_time.length === 5 ? `${app.slot.start_time}:00` : app.slot.start_time;
          const apptDateTime = new Date(`${app.slot.date}T${timeString}`);
          
          if (isNaN(apptDateTime.getTime())) return; // Skip invalid date strings

          const timeDiffMs = apptDateTime.getTime() - now.getTime();
          const timeDiffMinutes = timeDiffMs / (1000 * 60);

          // If the appointment is within the next 15 minutes (and hasn't already started)
          if (timeDiffMinutes > 0 && timeDiffMinutes <= 15) {
            const minutesLeft = Math.ceil(timeDiffMinutes);
            const lecturerName = app.lecturer ? `${app.lecturer.first_name} ${app.lecturer.last_name}` : 'your lecturer';
            const message = `Reminder: Your appointment with ${lecturerName} starts in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`;
            
            // Show native browser notification if granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Upcoming Appointment', {
                  body: message,
                  // Optional: you can add an icon here if available
                });
              } catch (e) {
                console.error('Failed to trigger native browser notification', e);
              }
            }
            
            // Also show an in-app toast notification to ensure it is seen
            toast.info(message);
            
            // Mark as notified to prevent spamming
            notifiedSet.current.add(app.id);
          }
        }
      });
    };

    // Check immediately on mount/update
    checkReminders();

    // Set an interval to check every 30 seconds
    const intervalId = setInterval(checkReminders, 30000);

    return () => clearInterval(intervalId);
  }, [appointments, toast]);
};
