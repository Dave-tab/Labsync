import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          <span className="block">Welcome to</span>
          <span className="block text-indigo-600">LabSync</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          The easiest way to schedule and manage consultation appointments between students and lecturers. Select your role below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Student Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="p-8">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">I am a Student</h2>
            <p className="text-gray-600 mb-8 h-12">
              Find your lecturers, view their available time slots, and book consultation appointments instantly.
            </p>
            <div className="flex flex-col space-y-3">
              <Link
                to="/register?role=student"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Sign up as Student
              </Link>
              <Link
                to="/login?role=student"
                className="w-full flex items-center justify-center px-4 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white dark:bg-gray-800 hover:bg-indigo-50 transition-colors"
              >
                Log in to existing account
              </Link>
            </div>
          </div>
        </div>

        {/* Lecturer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="p-8">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">I am a Lecturer</h2>
            <p className="text-gray-600 mb-8 h-12">
              Manage your availability, set consultation hours, and keep track of your upcoming student meetings.
            </p>
            <div className="flex flex-col space-y-3">
              <Link
                to="/register?role=lecturer"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Sign up as Lecturer
              </Link>
              <Link
                to="/login?role=lecturer"
                className="w-full flex items-center justify-center px-4 py-3 border border-emerald-600 text-base font-medium rounded-md text-emerald-600 bg-white dark:bg-gray-800 hover:bg-emerald-50 transition-colors"
              >
                Log in to existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
