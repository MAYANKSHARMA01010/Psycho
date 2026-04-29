# Zenora Mental Care Platform - Project Report

## 1. Project Overview

Zenora is a mental-care web platform built to connect clients with verified therapists, manage therapy sessions, support real-time chat, track payments, and provide clinical support features like assessments, prescriptions, treatment plans, complaints, notifications, and admin monitoring.

The backend follows a modular TypeScript and Express architecture with Prisma and PostgreSQL for persistence. The frontend is built with Next.js and uses a simple dashboard-based interface for clients, therapists, and admins.

The project was divided into five member-wise modules so that work could be done in parallel after the common foundation was completed.

## 2. Team Members and Module Allocation

| Member | Name | Module |
|---|---|---|
| Member 1 | Mayank Sharma | Foundation, Authentication, Authorization, User Profile, File Upload |
| Member 2 | Kunal Vats | Therapist Profile, Verification, Availability, Therapist Search |
| Member 3 | Aman Soni | Session Booking, Session Lifecycle, Chat, Notes, History |
| Member 4 | Shaurya Sharma | Payments, Subscriptions, Earnings, Withdrawals, Transactions |
| Member 5 | Tanishk Agarwal | Assessments, Treatment Plans, Prescriptions, Ratings, Complaints, Notifications, Admin Dashboard |

## 3. Technology Stack Used

### Backend

- Node.js with TypeScript
- Express.js for REST APIs
- Prisma ORM
- PostgreSQL database
- JWT-based authentication
- Redis support for refresh-token revocation
- Socket.io for real-time chat
- Zod for request validation
- Jest for unit tests

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hot Toast
- Role-based dashboard pages

### Development Tools

- pnpm package manager
- Prisma migrations
- ESLint
- Git

## 4. Overall Backend Architecture

The backend is designed as a layered modular system:

```text
Routes -> Middleware -> Controllers -> Services -> Repositories -> Prisma/PostgreSQL
```

Each layer has a clear responsibility:

- Routes define API endpoints.
- Middleware handles authentication, authorization, validation, logging, and rate limiting.
- Controllers convert HTTP requests into service calls.
- Services contain business logic.
- Repositories isolate database access.
- Entities contain domain rules and state transitions.

This makes the code easier to test, debug, and divide among team members.

## 5. Member 1 - Foundation and Auth

### Owner

Mayank Sharma

### Responsibility

This module forms the base of the entire project. Other modules depend on it because every protected feature requires user identity, role checking, and authenticated access.

### Tasks Covered

- User registration
- Login
- Logout
- Refresh token flow
- Email verification
- Forgot password and reset password
- Google OAuth login
- JWT authentication middleware
- Role-based authorization middleware
- User profile foundation
- File upload service planned for AWS S3

### Main Backend Files

- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/services/token.service.ts`
- `backend/src/middlewares/AuthMiddleware.ts`
- `backend/src/repositories/UserRepository.ts`
- `backend/src/entities/User.ts`
- `backend/src/validators/auth.validation.ts`
- `backend/src/config/redis.ts`

### What Is Used

- JWT access tokens for protected API access
- Refresh token revocation using Redis
- Bcrypt password hashing through auth utilities
- Role-based middleware for `CLIENT`, `THERAPIST`, and `ADMIN`
- Google OAuth through `google-auth-library`
- Zod validation for auth request bodies
- Central API error and response utilities

### What Is Not Fully Used / Pending

- Actual email sending is not connected to a real provider. Verification/reset tokens are generated, and in development they can be returned directly.
- AWS S3 file upload service is planned, but certificate/PDF/avatar upload is currently metadata-driven where required.
- Full user profile CRUD is partially split into role profile creation routes and onboarding/profile data.

### Design Notes

This module uses middleware-based request protection. The `AuthMiddleware.authenticate` function verifies the JWT, checks if the user still exists and is active, then attaches the user to `req.user`. `AuthMiddleware.authorize` checks whether the authenticated user has the required role.

The `DatabaseService` is implemented as a singleton so that the application uses one Prisma Client instance instead of creating new database connections repeatedly.

## 6. Member 2 - Therapist and Availability

### Owner

Kunal Vats

### Responsibility

This module handles therapist onboarding, profile management, verification by admin, availability slot management, and public therapist discovery.

### Tasks Covered

- Therapist profile setup
- Therapist profile update
- Get own therapist profile
- Get public therapist profile by ID
- Certificate and KYC document metadata upload
- Admin therapist verification and approval flow
- Availability slot create, list, update, delete
- Bulk slot creation
- Slot overlap checking
- Therapist discovery and search

### Main Backend Files

- `backend/src/routes/therapist.routes.ts`
- `backend/src/routes/availability.routes.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/controllers/therapist.controller.ts`
- `backend/src/controllers/availability.controller.ts`
- `backend/src/controllers/admin.therapist.controller.ts`
- `backend/src/services/therapist.service.ts`
- `backend/src/services/availability.service.ts`
- `backend/src/services/therapistDocument.service.ts`
- `backend/src/services/therapistVerification.service.ts`
- `backend/src/repositories/TherapistRepository.ts`
- `backend/src/repositories/AvailabilitySlotRepository.ts`
- `backend/src/repositories/TherapistDocumentRepository.ts`
- `backend/src/entities/Therapist.ts`
- `backend/src/entities/AvailabilitySlot.ts`
- `backend/src/validators/therapist.validation.ts`
- `backend/src/validators/availability.validation.ts`

### What Is Used

- Role-based access for therapist-only and admin-only operations
- Zod validation for profile, document, and availability inputs
- Repository pattern for therapist, document, and availability data
- Domain entities for therapist and availability business rules
- Prisma filtering for therapist search
- Admin approval and rejection flow
- Verification fields: `verificationStatus`, `isVerified`, `verifiedAt`, `rejectionReason`
- Document model for KYC/certificates
- Availability overlap detection

### What Is Not Fully Used / Pending

- Document upload stores `fileUrl` metadata only. Actual S3 upload is dependent on Member 1's file upload service.
- Therapist profile images or avatar uploads are not connected yet.
- Search is functional, but advanced ranking and recommendation logic are not used.

### Design Notes

This module strongly uses the repository pattern and domain model pattern. `Therapist` contains methods like `approve`, `reject`, `updateProfile`, and `canAcceptBookings`. `AvailabilitySlot` contains rules for date validation, rescheduling, deleting, and overlap checking.

Public therapist discovery only returns approved and verified therapists. This prevents unverified therapists from appearing in client booking flows.

## 7. Member 3 - Session and Chat

### Owner

Aman Soni

### Responsibility

This module manages therapy sessions after a verified therapist has available slots. It includes booking, session status changes, chat, notes, and history.

### Tasks Covered

- Session booking
- Therapist session confirmation
- Reschedule
- Cancel session
- Full lifecycle: `PENDING -> CONFIRMED -> ONGOING -> COMPLETED`
- Real-time chat using Socket.io
- Chat message persistence
- Chat history
- Read receipts
- Therapist session notes
- Session history for client and therapist

### Main Backend Files

- `backend/src/routes/session.routes.ts`
- `backend/src/controllers/session.controller.ts`
- `backend/src/controllers/chat.controller.ts`
- `backend/src/services/session.service.ts`
- `backend/src/services/chat.service.ts`
- `backend/src/socket/chatSocket.ts`
- `backend/src/repositories/SessionRepository.ts`
- `backend/src/repositories/ChatMessageRepository.ts`
- `backend/src/entities/Session.ts`
- `backend/src/entities/ChatMessage.ts`

### What Is Used

- Auth and role authorization from Member 1
- Availability slots from Member 2
- Session entity state transitions
- Database transaction for session booking and slot locking
- Socket.io room per session
- REST chat history and message APIs
- Read/unread tracking
- Participant checks before chat access

### What Is Not Fully Used / Pending

- Video/voice calling provider is not integrated. Session type exists, but actual video/voice infrastructure is not connected.
- Socket.io is implemented on backend, while the frontend currently uses lightweight polling for chat in the client session detail page.
- Calendar integration is not used.

### Design Notes

The `Session` entity controls valid lifecycle transitions. This avoids random status updates from controllers or services. Chat is allowed only when a session is `CONFIRMED` or `ONGOING`.

The booking flow uses a transaction so that a session is created and the selected availability slot is marked booked together.

## 8. Member 4 - Payments, Subscription and Earnings

### Owner

Shaurya Sharma

### Responsibility

This module handles payment creation, confirmation, refunds, subscriptions, earnings, commission calculation, withdrawal requests, and transaction history.

### Tasks Covered

- Payment initiation
- Payment confirmation
- Refund flow
- Invoice generation
- Subscription create, renew, cancel
- Therapist earnings tracking
- Platform commission calculation
- Withdrawal request creation
- Admin withdrawal processing
- Transaction history for clients and therapists

### Main Backend Files

- `backend/src/routes/payment.routes.ts`
- `backend/src/routes/subscription.routes.ts`
- `backend/src/routes/financial.routes.ts`
- `backend/src/controllers/payment.controller.ts`
- `backend/src/controllers/subscription.controller.ts`
- `backend/src/controllers/financial.controller.ts`
- `backend/src/services/payment.service.ts`
- `backend/src/services/subscription.service.ts`
- `backend/src/services/financial.service.ts`
- `backend/src/repositories/PaymentRepository.ts`
- `backend/src/repositories/EarningRepository.ts`
- `backend/src/repositories/WithdrawalRequestRepository.ts`
- `backend/src/entities/Payment.ts`
- `backend/src/entities/Earning.ts`
- `backend/src/entities/WithdrawalRequest.ts`

### What Is Used

- Payment entity with status transitions
- Mock payment gateway response
- Default session payment amount
- Payment confirmation creates therapist earning
- 10% platform commission calculation
- JSON invoice generation
- Withdrawal request flow
- Admin approval/rejection for withdrawals
- Unified transaction history

### What Is Not Fully Used / Pending

- Real payment gateway such as Razorpay, Stripe, or Paytm is not integrated yet.
- Invoice is JSON-based, not a styled downloadable PDF.
- Refund rollback for earnings is noted but not fully implemented as a separate accounting record.
- Subscription payment linkage is basic and can be improved.

### Design Notes

This module uses domain entities for payment and financial state. `Payment.confirm()` moves a payment from `PENDING` to `COMPLETED`. After confirmation, an `Earning` is created for the therapist with platform commission deducted.

The financial service combines payments, earnings, and withdrawals into a transaction-style view.

## 9. Member 5 - Assessment, Complaints, Notifications and Admin Dashboard

### Owner

Tanishk Agarwal

### Responsibility

This module handles clinical support and platform monitoring features. It supports assessments, treatment plans, prescriptions, ratings, complaints, notifications, crisis monitoring, and admin analytics.

### Tasks Covered

- Mental health assessment submission
- Score calculation
- Severity calculation
- Crisis monitoring signal
- High-risk user flagging
- Treatment plan creation
- Milestone progress tracking
- Prescription creation
- Prescription PDF generation
- Prescription sharing
- Rating and reviews
- Complaint raising
- Complaint review and resolution
- Notification creation
- Session reminders
- Payment update notifications
- Crisis alerts
- Admin analytics dashboard

### Main Backend Files

- `backend/src/routes/assessment.routes.ts`
- `backend/src/routes/treatmentPlan.routes.ts`
- `backend/src/routes/prescription.routes.ts`
- `backend/src/routes/rating.routes.ts`
- `backend/src/routes/complaint.routes.ts`
- `backend/src/routes/notification.routes.ts`
- `backend/src/routes/adminDashboard.routes.ts`
- `backend/src/controllers/assessment.controller.ts`
- `backend/src/controllers/treatmentPlan.controller.ts`
- `backend/src/controllers/prescription.controller.ts`
- `backend/src/controllers/rating.controller.ts`
- `backend/src/controllers/complaint.controller.ts`
- `backend/src/controllers/notification.controller.ts`
- `backend/src/controllers/adminDashboard.controller.ts`
- `backend/src/services/assessment.service.ts`
- `backend/src/services/treatmentPlan.service.ts`
- `backend/src/services/prescription.service.ts`
- `backend/src/services/rating.service.ts`
- `backend/src/services/complaint.service.ts`
- `backend/src/services/notification.service.ts`
- `backend/src/services/crisisMonitoring.service.ts`
- `backend/src/services/adminDashboard.service.ts`

### What Is Used

- Assessment scoring from numeric JSON responses
- Severity levels such as low, mild, moderate, high, critical
- Crisis risk evaluation
- AI interaction record for assessment signal persistence
- Treatment plan milestones stored as JSON
- Prescription generation and simple PDF data URL creation
- Notification records for push/email/SMS channels
- Complaint workflow with status changes
- Admin dashboard summaries

### What Is Not Fully Used / Pending

- Real push, email, and SMS providers are not connected. Notifications are stored and logged.
- Prescription PDF is generated in a simple backend format, not through a professional PDF template engine.
- Crisis escalation is internal to the system and not connected to an external emergency response provider.
- Admin analytics exists at backend level, while the frontend admin dashboard is currently mostly static/sample UI.

### Design Notes

This module is service-heavy because it combines clinical workflow, notifications, and admin reporting. It uses database queries directly in several services and relies on Prisma for relationships and filtering.

Assessment submission also triggers notification and crisis monitoring side effects.

## 10. Frontend Work Completed

The frontend includes role-based dashboards and client workflows.

### Existing Pages

- Landing page
- Login and onboarding
- Client dashboard
- Therapist dashboard
- Admin dashboard
- Therapist browse page
- Therapist detail and booking page
- Client session list
- Client session detail and chat

### Recently Added Pages

- Client assessments page
- Client prescriptions page
- Client payments page

### UI Direction

The frontend now follows a cleaner shadcn-style theme with:

- Neutral zinc/slate color palette
- Simple cards
- Subtle borders
- Small border radius
- Minimal shadows
- Reduced gradients and decorative colors

## 11. Database Design Summary

The database is designed around users and their role-specific profiles.

Important models include:

- `User`
- `Client`
- `Therapist`
- `Admin`
- `TherapistDocument`
- `AvailabilitySlot`
- `Session`
- `ChatMessage`
- `Payment`
- `Subscription`
- `Earning`
- `WithdrawalRequest`
- `Assessment`
- `TreatmentPlan`
- `Prescription`
- `Rating`
- `Complaint`
- `Notification`
- `AIInteraction`

The schema uses enums for roles, session status, payment status, verification status, document type, notification type, and crisis level.

## 12. Design Principles and Patterns Used

### Layered Architecture

The project separates routes, controllers, services, repositories, and entities. This keeps business logic away from route files.

### Repository Pattern

Repositories are used for database operations in many modules, especially users, therapists, sessions, payments, earnings, and availability.

### Domain Model Pattern

Important business objects like `User`, `Therapist`, `Session`, `Payment`, `AvailabilitySlot`, `Earning`, and `WithdrawalRequest` contain their own behavior.

### Factory Method

Static methods like `create()` and `fromPersistence()` are used to create domain objects safely.

### Singleton

`DatabaseService` provides a singleton Prisma Client instance.

### Middleware Pattern

Authentication, authorization, validation, logging, rate limiting, and error handling are middleware-based.

### Validation Layer

Zod schemas validate request body, params, and query data before controllers receive it.

### Transaction Handling

Transactions are used where multiple database operations must succeed together, such as slot creation and session booking.

## 13. Current Limitations

- Real AWS S3 upload is not fully wired.
- Real email, SMS, and push notification providers are not connected.
- Real payment gateway integration is not connected.
- Video/voice calling provider is not connected.
- Admin frontend is not fully dynamic yet.
- Some analytics and invoice/PDF features are basic but functional.

## 14. Testing and Verification

The backend includes Jest tests for validation and entity behavior.

Current verification status:

- Backend build passes.
- Backend tests pass.
- Frontend build passes.
- Frontend lint has no errors, only existing warnings.

## 15. Conclusion

The project has a strong backend foundation and most major modules are implemented with clean separation of responsibility. The authentication and role-based access system supports the whole application. Therapist discovery, availability, session management, payments, clinical workflows, and notifications are all represented in the backend.

Some external integrations are still pending, mainly AWS S3, real payment gateway, email/SMS/push providers, and video/voice infrastructure. These are good next steps because the internal backend structure is already prepared for them.
