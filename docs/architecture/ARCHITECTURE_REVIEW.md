# Architecture Review: Lecturer Appointment Booking System

## 1. Professional System Overview
The Lecturer Appointment Booking System is a robust, layered, full-stack web application designed to eliminate scheduling friction in a university environment. It enforces strict role-based access control, utilizes atomic transactional bookings to prevent race conditions, and provides a clear, responsive UI for Students, Lecturers, and Administrators. 

## 2. Functional Requirements
- **Authentication:** Secure login/registration using Firebase Auth.
- **Profile Management:** Manage identity and role-specific data.
- **Availability Management:** Lecturers define explicit timeslots for meetings.
- **Appointment Booking:** Students discover lecturers, view availability, and request bookings safely.
- **Appointment Lifecycle:** Approve, reject, reschedule, cancel, and complete.
- **Notifications:** In-app alerts for status changes.
- **Administration:** Oversight of system data, users, and audit logs.

## 3. Non-Functional Requirements
- **Security:** Firestore Security Rules and backend middleware RBAC to prevent IDOR and privilege escalation.
- **Integrity:** ACID-compliant operations via Firestore transactions preventing double bookings.
- **Performance:** Efficient indexed queries; fast client-side routing.
- **Maintainability:** Strict separation of concerns (Presentation -> Controller -> Service -> DB).
- **Usability:** Responsive, accessible UI with comprehensive loading/empty/error states.

## 4. System Architecture
A standard 3-tier architecture:
- **Client (React SPA):** Handles UI, client state, and API communication.
- **Server (Node/Express):** Handles business logic, RBAC validation, and DB orchestration via Firebase Admin SDK.
- **Database (Firebase Firestore):** Handles durable storage and security constraints.

## 5. Recommended Frontend Architecture
- **Framework:** React 18+ with TypeScript and Vite.
- **Styling:** Tailwind CSS + Lucide React.
- **State/Data Fetching:** React Query (or standard hooks + context) for server state; React Hook Form for form state.
- **Validation:** Zod (shared schemas with backend).
- **Structure:** Feature-based folder structure inside `src/`.

## 6. Recommended Backend Architecture
- **Framework:** Express.js with TypeScript.
- **Layering:** 
  - `Routes` (map HTTP to controllers)
  - `Middleware` (Auth via Firebase Admin, RBAC, Validation)
  - `Controllers` (HTTP extraction/responses)
  - `Services` (Core business logic)
  - `Repositories/DB` (Data access via Firebase Admin)
- **Error Handling:** Centralized error-handling middleware utilizing standard envelopes.

## 7. Complete Folder Structure
(Follows the exact structure provided in Section 13 of the project prompt).

## 8. Database Schema Proposal (Firestore Collections)
- `users`: (Handles profiles, students, and lecturers) Document ID = Auth UID. Fields: email, first_name, last_name, role, is_active, department_id, level (if student), office_location (if lecturer), timestamps.
- `departments`: Document ID = Auto. Fields: name, code, faculty, timestamps.
- `availability_slots`: Document ID = Auto. Fields: lecturer_id, date, start_time, end_time, is_available, timestamps.
- `appointments`: Document ID = Auto. Fields: student_id, lecturer_id, availability_slot_id, appointment_date, start_time, end_time, status, timestamps.
- `notifications`: Document ID = Auto. Fields: recipient_id, message, type, related_appointment_id, is_read, timestamps.
- `audit_logs`: Document ID = Auto. Fields: actor_id, action, entity_type, entity_id, timestamps.

## 9. Database Relationships
NoSQL relationships managed via referencing Document IDs (e.g., `student_id` points to a `users` document where `role == 'student'`).

## 10. Appointment Concurrency Strategy
To prevent double bookings (race conditions), we will use **Firestore Transactions (`runTransaction`)**. When a student requests a slot, the transaction reads the `availability_slots` document to verify `is_available == true`. If true, it writes the new `appointments` document and updates the slot to `is_available == false` atomically.

## 11. Authentication Architecture
Firebase Auth (Email/Password). 
1. Client logs in via Firebase JS Client SDK.
2. Client receives ID Token.
3. Client attaches ID Token as `Authorization: Bearer <token>` to API requests.
4. Express middleware validates ID Token utilizing Firebase Admin SDK.

## 12. Authorization/RBAC Model
- The authenticated JWT maps to a Firebase Auth user.
- The backend queries the `users` collection to determine the user's secure role (`student`, `lecturer`, `administrator`).
- Route-level middleware (e.g., `requireRole(['student'])`) enforces access before hitting controllers.

## 13. Security Rules Strategy
- **Defense in Depth:** Even though the backend API handles business logic, strict Firestore Security Rules will be implemented.
- Example for `appointments` collection: `allow read: if request.auth.uid == resource.data.student_id || request.auth.uid == resource.data.lecturer_id`.
- The Express backend uses the Firebase Admin SDK, which bypasses Firestore Security Rules, but enforcing rules is a critical fallback against direct client access.

## 14. API Endpoint Architecture
RESTful conventions structured logically (e.g., `/api/appointments`, `/api/lecturers/:id/availability`). Endpoints will return standard JSON matching `{ success: boolean, data?: any, error?: { code, message } }`.

## 15. Main UI Pages
(Matches Section 25 of the project prompt: Public, Student, Lecturer, Admin domains).

## 16. Component Architecture
- **UI:** Reusable dumb components (Buttons, Inputs, Modals).
- **Forms:** Smart components composing React Hook Form + Zod.
- **Layouts:** Shared structural wrappers (Sidebar, Navbar).
- **Features:** Domain-specific composites (AppointmentCard, AvailabilityCalendar).

## 17. Validation Strategy
- **Frontend:** Real-time form validation via Zod schemas.
- **Backend:** Middleware validation using identical Zod schemas to guarantee input integrity before processing.

## 18. Error-Handling Strategy
- Backend throws customized `AppError` classes (e.g., `NotFoundError`, `ConflictError`).
- Global Express error handler catches exceptions, logs securely, and maps to standardized HTTP response envelopes.
- Frontend uses Axios/Fetch interceptors to catch generic errors and trigger Toast notifications.

## 19. Notification Architecture
- Triggered synchronously within backend services upon state changes (e.g., `AppointmentService.approve` creates a notification row).
- Polled client-side (or fetched on mount) via a `/api/notifications/me` endpoint.

## 20. Testing Strategy
- **Unit:** Test isolated services and utilities.
- **Integration (API):** Supertest + test database to verify endpoint contracts and auth.
- **Security:** Ensure failure when tokens are invalid, expired, or roles are insufficient.

## 21. Security Threat Model
- **Threat:** Student booking another student's appointment. **Mitigation:** Backend authorization verifies JWT matches `student_id`.
- **Threat:** Double booking. **Mitigation:** Firestore transactions.
- **Threat:** Client manipulating roles. **Mitigation:** Role is sourced strictly from DB, never trusted from client payloads.

## 22. Technical Risks
- **Timezone Drift:** Handled by strictly enforcing UTC on the backend/DB and rendering localized times on the frontend.
- **Transaction Failures:** Handled by wrapping multi-step booking processes in Firestore transactions.
- **Stale Client Data:** Mitigated by refetching availability immediately upon booking modal interactions.

## 23. Development Phases
Phases 0 through 12 perfectly sequence the project from architecture, through DB/Auth, modular roles, up to testing and deployment.

## 24. Definition of Done
Requirement understood -> Architecture verified -> Implemented -> Validated (FE & BE) -> Authorized -> DB constrained -> UI states mapped -> Tested -> Error-handled -> Documented -> Approved.

## 25. Proposed contents of AGENTS.md
Defined in project root.

## 26. Proposed contents of RPD.md
Defined in project root.

## 27. Architectural Decisions that require approval
Approved by Project Owner. Proceeding to Phase 1 and 2.
