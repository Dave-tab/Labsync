# RPD.md

# Lecturer Appointment Booking System

## 1. Product Goal

Provide a secure university appointment platform that allows students to schedule meetings with lecturers based on lecturer-defined availability.

## 2. Users

### Student

Can:
- Register
- Login
- Manage profile
- Search lecturers
- View lecturer profiles
- View availability
- Book appointments
- Cancel permitted appointments
- View appointment history
- Receive notifications

### Lecturer

Can:
- Login
- Manage profile
- Manage availability
- View appointment requests
- Approve requests
- Reject requests
- Reschedule appointments
- Cancel appointments
- Mark appointments completed
- View schedule
- Receive notifications

### Administrator

Can:
- Login
- View system dashboard
- Manage students
- Manage lecturers
- Manage departments
- Activate/deactivate accounts
- View appointments
- Filter appointments
- Monitor activity
- Manage appropriate system settings

## 3. Appointment Lifecycle

```text
Student creates request
        ↓
Pending
        ↓
 ┌──────┼─────────┐
 ↓      ↓         ↓
Approved Rejected Rescheduled
 ↓                  ↓
Completed           Approved
```

Cancellation may occur where permitted.

## 4. Core Rules

A student may only book:

* An existing lecturer.
* An active lecturer.
* A valid availability slot.
* A future slot.
* A slot that is still available.

A student must not have conflicting appointments.

A lecturer may only manage their own availability and appointments.

Administrators have administrative access according to their role.

## 5. Non-Goals

Unless explicitly approved, do not implement:

* Payments
* Video conferencing
* Chat
* SMS
* AI scheduling
* Complex external calendar synchronization
* Multi-university support
* Microservices
* Blockchain
* Cryptocurrency

## 6. Success Criteria

The application must:

* Authenticate users securely.
* Enforce roles.
* Prevent unauthorized access.
* Prevent double booking.
* Store appointments reliably.
* Provide status updates.
* Provide notifications.
* Provide responsive interfaces.
* Pass defined tests.
* Be deployable.
