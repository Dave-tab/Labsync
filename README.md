# Lecturer Appointment Booking System

A full-stack web application designed for higher education institutions to streamline consultation scheduling between students and lecturers, prevent scheduling conflicts, and provide academic visibility.

---

## 🌟 Key Features

### 🎓 For Students
- **Lecturer Directory & Filtering**: Search and filter lecturers by name, faculty, department, or handled academic levels (e.g., 100L, 200L, 400L).
- **Conflict-Free Booking**: View real-time availability slots and book consultations instantly.
- **Race Condition Protection**: Uses Firestore atomic transactions (`runTransaction`) to eliminate double-booking under concurrent access.
- **My Appointments Dashboard**: Track upcoming, approved, rejected, and completed consultation requests with cancellation options.
- **In-App Appointment Reminders**: Real-time notifications for upcoming consultation schedules.

### 👨‍🏫 For Lecturers
- **Slot Management**: Create, view, and delete available consultation time windows with precise date and time pickers.
- **Appointment Approval Workflow**: Review student consultation requests with one-click **Approve** or **Reject** actions.
- **Automatic Slot Reclaiming**: Rejecting or cancelling an appointment automatically reopens the slot for other students.
- **Departmental Visibility**: Configure faculties, departments, office locations, and levels handled.

### 🔒 Core Architecture & Security
- **Firebase Authentication**: Email & password authentication with role-based routing (`student` | `lecturer`).
- **Cloud Firestore**: Real-time NoSQL persistent database with declarative security rules (`firestore.rules`).
- **Responsive Theme Engine**: Light and dark mode support with tailored contrast and mobile-friendly touch targets.
- **Universal Layout & Branding**: Consistent navigation and global footer (`© 2026 Designed & Developed by | DAYAN`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Database & Auth**: Firebase Firestore, Firebase Authentication
- **Forms & Validation**: React Hook Form, Zod
- **Date & Time**: React-Datepicker, Date-Fns

---

## 📁 Project Structure

```text
├── firestore.rules               # Cloud Firestore security rules
├── firebase-applet-config.json   # Firebase project credentials
├── firebase-blueprint.json       # Firestore schema definition
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Main application layout with global footer
│   │   │   └── Navbar.tsx        # Navigation bar with role badge & theme toggle
│   │   └── ui/                   # Reusable UI elements (Skeleton, Toast, etc.)
│   ├── context/
│   │   ├── AuthContext.tsx       # Firebase Auth & session management
│   │   ├── ThemeContext.tsx      # Dark / Light theme provider
│   │   └── ToastContext.tsx      # Global notification toast provider
│   ├── hooks/
│   │   └── useAppointmentReminder.ts # Real-time appointment reminder engine
│   ├── lib/
│   │   ├── firebase.ts           # Firebase SDK initialization
│   │   ├── firebaseService.ts    # Firestore queries, seeders & atomic transactions
│   │   └── storage.ts            # Local fallback data store & schemas
│   ├── pages/
│   │   ├── lecturer/
│   │   │   └── LecturerDashboard.tsx # Slot creation & appointment approvals
│   │   ├── public/
│   │   │   ├── LandingPage.tsx   # Hero landing page
│   │   │   ├── Login.tsx         # Role-aware authentication
│   │   │   └── Register.tsx      # Registration with Faculty/Dept/Level selection
│   │   ├── student/
│   │   │   └── StudentDashboard.tsx  # Lecturer discovery & booking flow
│   │   └── Profile.tsx           # Academic profile settings
│   ├── types/                    # Shared TypeScript interfaces and types
│   ├── App.tsx                   # Main routing configuration
│   └── main.tsx                  # App entry point
└── package.json
