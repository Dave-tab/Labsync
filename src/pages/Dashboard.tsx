import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LecturerDashboard } from './lecturer/LecturerDashboard';
import { StudentDashboard } from './student/StudentDashboard';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.role === 'lecturer' 
            ? 'Manage your availability slots below.' 
            : 'Find a lecturer and book an appointment.'}
        </p>
      </div>

      {user?.role === 'lecturer' ? <LecturerDashboard /> : <StudentDashboard />}
    </div>
  );
};
