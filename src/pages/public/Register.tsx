import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, generateId, LocalUser } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { registerSchema, RegisterFormValues } from '../../schemas/auth';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'student' | 'lecturer') || 'student';
  const { login, registerWithFirebase } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      try {
        // Create user with Firebase Auth & store profile in Firestore
        await registerWithFirebase(data.email, data.password, {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          department: data.department,
          faculty: data.faculty,
          level: data.level,
        });

        navigate('/dashboard');
        return;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          setError('email', { message: 'This email is already registered.' });
          return;
        }

        // Local fallback if Firebase network fails
        const newUser: LocalUser = {
          id: generateId(),
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: true,
          department: data.department,
          faculty: data.faculty,
          level: data.level,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        db.users.save(newUser);
        const { password, ...userProfile } = newUser;
        login(userProfile);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError('root', {
        message: 'An error occurred during registration. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${selectedRole === 'lecturer' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to={`/login?role=${selectedRole}`} className={`font-medium hover:text-opacity-80 ${selectedRole === 'lecturer' ? 'text-emerald-600' : 'text-indigo-600'}`}>
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First name</label>
                <div className="mt-1">
                  <input
                    id="first_name"
                    type="text"
                    placeholder="John"
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    {...register('first_name')}
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last name</label>
                <div className="mt-1">
                  <input
                    id="last_name"
                    type="text"
                    placeholder="Doe"
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    {...register('last_name')}
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john.doe@university.edu"
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm pr-10 ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a...</label>
              <div className="mt-1">
                <select
                  id="role"
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm bg-white dark:bg-gray-800 ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                  {...register('role')}
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">Faculty</label>
                <div className="mt-1">
                  <input
                    id="faculty"
                    type="text"
                    placeholder="e.g. Science"
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm bg-white dark:bg-gray-800 ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    {...register('faculty')}
                  />
                  {errors.faculty && <p className="mt-1 text-sm text-red-600">{errors.faculty.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                <div className="mt-1">
                  <input
                    id="department"
                    type="text"
                    placeholder="e.g. Computer Science"
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm bg-white dark:bg-gray-800 ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    {...register('department')}
                  />
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                {selectedRole === 'student' ? 'Current Level' : 'Levels Handled'}
              </label>
              <div className="mt-1">
                <input
                  id="level"
                  type="text"
                  placeholder={selectedRole === 'student' ? "e.g. Level 200" : "e.g. 100, 200, 400"}
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm bg-white dark:bg-gray-800 ${selectedRole === 'lecturer' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                  {...register('level')}
                />
                {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>}
              </div>
            </div>

          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">{errors.root.message}</h3>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${selectedRole === 'lecturer' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
