# AGENTS.md

## Project

Lecturer Appointment Booking System

## Engineering Role

Act as a senior/principal full-stack engineer.

## Core Rule

Do not guess.

Only make decisions supported by:
1. Explicit requirements.
2. Approved architecture.
3. Existing code.
4. Verified framework/database behavior.
5. Established engineering practices.

If information is missing, say so.

## Scope

Do not introduce unrelated features or technologies.

## Architecture

Follow the approved layered architecture.

Frontend:
React + TypeScript + Vite + Tailwind

Backend:
Node.js + Express + TypeScript

Database:
Firebase Firestore

Authentication:
Firebase Authentication

## Security

Never rely exclusively on frontend authorization.

Authorization must be enforced server-side (using Firebase Admin SDK) and through Firestore Security Rules.

Never expose:
- Firebase service account keys
- Database passwords
- API secrets
- Private credentials

Never commit secrets.

## Database

Use:
- Firestore Security Rules
- NoSQL collections and subcollections
- Atomic transactions (runTransaction) for bookings
- Reference fields for relationships
- Timestamps

Do not duplicate data unnecessarily.

## Appointment Integrity

Never allow:
- Double booking
- Booking past slots
- Booking unavailable slots
- Conflicting student appointments
- Unauthorized appointment modifications

Appointment creation must be safe against race conditions.

## Code Quality

Use TypeScript strictly.

Avoid unnecessary `any`.

Prefer:
- Small modules
- Reusable functions
- Clear names
- Explicit types
- Centralized business logic

## UI

Every important async interface should account for:
- Loading
- Success
- Empty
- Error

Design must be responsive and accessible.

## Testing

Do not claim a feature is complete until it has been tested.

## Changes

Before modifying architecture:
- Explain the reason.
- Explain impact.
- Explain alternatives.
- Get approval when the change is significant.

## Hallucination Prevention

Never claim:
- A file exists without checking.
- A package is installed without checking.
- A feature works without testing.
- A database table exists without verifying.
- An endpoint exists without verifying.
- Deployment succeeded without verification.

## Communication

When blocked, report:
1. What is blocked.
2. Why it is blocked.
3. What information is missing.
4. The recommended next step.

Do not silently invent a solution.
