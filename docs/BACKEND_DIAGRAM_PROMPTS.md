# Backend Diagram Prompts

These prompts are based on the current backend implementation: Express 5, TypeScript, Prisma/PostgreSQL, JWT auth, Redis refresh-token revocation, Socket.io chat, and layered `Routes -> Middleware -> Controllers -> Services -> Repositories -> Prisma` architecture.

## 1. Class Diagram Prompt

Create a UML class diagram for the Zenora mental-care backend.

Use these layers and show dependency arrows from callers to callees:

- `Server` creates `App`, `DatabaseService`, `RedisService`, HTTP server, and `ChatSocketHandler`.
- `App` configures Express middleware: `helmet`, `cors`, JSON body parser, URL encoding, `LogMiddleware`, `RateLimitMiddleware`, registered route classes, 404 handler, and `ErrorMiddleware`.
- Every route class implements `Routes` with `path: string` and `router: Router`.
- Route classes depend on `AuthMiddleware`, `ValidationMiddleware`, `AsyncUtils`, and their matching controller.
- Controllers depend on services.
- Services depend on repositories and domain entities.
- Repositories depend on `DatabaseService` / Prisma Client.
- Entities contain business invariants and state transitions.

Include these route/controller/service groups:

- `AuthRoutes -> AuthController -> AuthService -> UserRepository -> User`
- `ProfileRoutes -> ProfileController -> ProfileService -> UserRepository`
- `TherapistRoutes -> TherapistController -> TherapistService`, plus `TherapistDocumentService`
- `AdminRoutes -> AdminTherapistController -> TherapistVerificationService`
- `AvailabilityRoutes -> AvailabilityController -> AvailabilityService -> AvailabilitySlotRepository`
- `SessionRoutes -> SessionController -> SessionService -> SessionRepository`, `AvailabilitySlotRepository`, `TherapistRepository`
- `SessionRoutes -> ChatController -> ChatService -> ChatMessageRepository`, `SessionRepository`
- `PaymentRoutes -> PaymentController -> PaymentService -> PaymentRepository`, `EarningRepository`, `SessionRepository`
- `SubscriptionRoutes -> SubscriptionController -> SubscriptionService -> SubscriptionRepository`
- `FinancialRoutes -> FinancialController -> FinancialService -> EarningRepository`, `WithdrawalRequestRepository`, `PaymentRepository`
- `AssessmentRoutes -> AssessmentController -> AssessmentService`, `CrisisMonitoringService`, `NotificationService`
- `TreatmentPlanRoutes -> TreatmentPlanController -> TreatmentPlanService`
- `PrescriptionRoutes -> PrescriptionController -> PrescriptionService`
- `RatingRoutes -> RatingController -> RatingService`
- `ComplaintRoutes -> ComplaintController -> ComplaintService`
- `NotificationRoutes -> NotificationController -> NotificationService`
- `AdminDashboardRoutes -> AdminDashboardController -> AdminDashboardService`
- `ChatSocketHandler -> AuthUtils`, `SessionRepository`, `ChatService`

Show domain classes with important methods:

- `User`: `create()`, `fromPersistence()`, `verifyPassword()`, `setPassword()`, `markEmailVerified()`, `completeOnboarding()`, `toResponse()`, `toPersistence()`, `getTokenPayload()`
- `Therapist`: `create()`, `fromPersistence()`, `updateProfile()`, `approve()`, `reject()`, `canAcceptBookings()`, `toResponse()`, `toPersistence()`
- `Session`: `create()`, `fromPersistence()`, `confirm()`, `start()`, `complete()`, `cancel()`, `reschedule()`, `setNotes()`, `isOwnedByClient()`, `isOwnedByTherapist()`, `canChat()`, `toResponse()`
- `Payment`: `create()`, `fromPersistence()`, `confirm()`, `fail()`, `refund()`, `isPending()`, `isCompleted()`, `isOwnedByClient()`, `toResponse()`
- `Earning`: `create()`, `fromPersistence()`, `markPaid()`, `isOwnedByTherapist()`, `toResponse()`
- `WithdrawalRequest`: `create()`, `fromPersistence()`, `approve()`, `reject()`, `complete()`, `isOwnedByTherapist()`, `toResponse()`
- `ChatMessage`: `create()`, `fromPersistence()`, `markAsRead()`, `toResponse()`

Use UML arrows like this:

- Solid association `A --> B` when a class calls or owns another class.
- Dependency `A ..> B` when a class only uses a utility/middleware/helper.
- Realization `RouteClass ..|> Routes`.
- Composition `Server *-- App` and `ChatSocketHandler *-- SocketIOServer`.
- Aggregation `Service o-- Repository` where repositories are injected through constructors.
- Add stereotypes: `<<route>>`, `<<controller>>`, `<<service>>`, `<<repository>>`, `<<entity>>`, `<<middleware>>`, `<<utility>>`.

Add notes for important business rules:

- JWT auth attaches `{ id, role, isActive }` to `req.user`.
- Authorization is role-based with `CLIENT`, `THERAPIST`, and `ADMIN`.
- `Session` transitions: `PENDING -> CONFIRMED/CANCELLED/RESCHEDULED`, `CONFIRMED -> ONGOING/CANCELLED/RESCHEDULED`, `ONGOING -> COMPLETED`, `RESCHEDULED -> CONFIRMED/CANCELLED`.
- Chat is allowed only for `CONFIRMED` or `ONGOING` sessions.
- Payments create therapist earnings after confirmation with 10% platform commission.
- Therapist bookings require `verificationStatus = APPROVED` and `isVerified = true`.

## 2. Sequence Diagram Prompt

Create sequence diagrams for the main backend flows of the Zenora mental-care backend. Use separate diagrams or clearly separated sections.

### A. Client registers and logs in

Participants: `Client UI`, `AuthRoutes`, `ValidationMiddleware`, `AuthController`, `AuthService`, `UserRepository`, `User entity`, `AuthUtils`, `TokenService/Redis`, `Prisma/PostgreSQL`.

Flow:

1. `Client UI -> AuthRoutes: POST /api/v1/auth/register`
2. `AuthRoutes -> ValidationMiddleware: validate(registerSchema)`
3. `AuthRoutes -> AuthController: register(req, res)`
4. `AuthController -> AuthService: register(payload)`
5. `AuthService -> UserRepository: existsByEmail(email)`
6. If email exists, return conflict.
7. `AuthService -> User: create(name, email, password, role, phone)`
8. `User -> AuthUtils: hashPassword(password)`
9. `AuthService -> UserRepository: insert(user)`
10. `AuthService -> UserRepository: ensureRoleProfile(user.id, user.role)`
11. `AuthService -> AuthUtils: generateTokens(user.getTokenPayload())`
12. `AuthService --> AuthController: user + accessToken + refreshToken`
13. `AuthController -> ApiResponse: success(...)`

For login:

1. `Client UI -> AuthRoutes: POST /api/v1/auth/login`
2. Validate login body.
3. `AuthService -> UserRepository: findByEmail(email)`
4. `User -> AuthUtils: comparePassword(plaintext, passwordHash)`
5. Check account active and requested role.
6. Issue access and refresh tokens.

Use arrows:

- Synchronous calls as solid arrows.
- Return values as dashed arrows.
- Validation/auth failures as `alt` blocks.

### B. Client books a session

Participants: `Client UI`, `SessionRoutes`, `AuthMiddleware`, `SessionController`, `SessionService`, `TherapistRepository`, `AvailabilitySlotRepository`, `Session entity`, `DatabaseService`, `Prisma Transaction`, `PostgreSQL`.

Flow:

1. `Client UI -> SessionRoutes: POST /api/v1/sessions`
2. `SessionRoutes -> AuthMiddleware: authenticate Bearer JWT`
3. `AuthMiddleware -> AuthUtils: verifyToken(token)`
4. `AuthMiddleware -> Prisma: findUnique User by id, active`
5. `SessionRoutes -> AuthMiddleware: authorize(CLIENT)`
6. `SessionRoutes -> SessionController: book(req, res)`
7. `SessionController -> SessionService: book(userId, role, { therapistId, slotId, type })`
8. `SessionService -> TherapistRepository: findById(therapistId)`
9. `Therapist -> Therapist: canAcceptBookings()`
10. `SessionService -> AvailabilitySlotRepository: findById(slotId)`
11. Check slot belongs to therapist and `isBooked = false`.
12. `SessionService -> Session: create(clientId, therapistId, slotId, type, scheduledAt)`
13. `SessionService -> DatabaseService: getInstance()`
14. `SessionService -> Prisma Transaction: create Session + update AvailabilitySlot.isBooked=true`
15. Return created session response.

Use `alt` blocks for unverified therapist, missing slot, slot already booked, and forbidden role.

### C. Therapist confirms, starts, completes session

Participants: `Therapist UI`, `SessionRoutes`, `AuthMiddleware`, `SessionController`, `SessionService`, `SessionRepository`, `Session entity`, `Prisma/PostgreSQL`.

Flow:

1. `PATCH /api/v1/sessions/{sessionId}/confirm`
2. Authenticate and authorize `THERAPIST`.
3. `SessionService -> SessionRepository: findById(sessionId)`
4. Check `session.isOwnedByTherapist(userId)`.
5. `Session -> Session: confirm()` with transition `PENDING -> CONFIRMED`.
6. `SessionService -> SessionRepository: save(session)`.
7. Repeat same shape for:
   - `PATCH /start`: `CONFIRMED -> ONGOING`, set `startedAt`.
   - `PATCH /complete`: `ONGOING -> COMPLETED`, set `endedAt`.

Show invalid state transitions with `alt invalid transition -> ApiError.badRequest`.

### D. Session chat over Socket.io

Participants: `Client/Therapist Socket`, `ChatSocketHandler`, `AuthUtils`, `SessionRepository`, `Session entity`, `ChatService`, `ChatMessage`, `ChatMessageRepository`, `Socket.io Room`.

Flow:

1. `Socket -> ChatSocketHandler: connect(auth.token or Authorization header)`
2. `ChatSocketHandler -> AuthUtils: verifyToken(token)`
3. On `join_room(sessionId)`, load session.
4. Check participant: `session.isOwnedByClient(user.id)` or `session.isOwnedByTherapist(user.id)`.
5. Check `session.canChat()` is true.
6. `socket.join("session:{sessionId}")`
7. On `send_message`, call `ChatService.persistSocketMessage(senderId, sessionId, content)`.
8. `ChatService -> ChatMessage: create(...)`
9. `ChatService -> ChatMessageRepository: save(message)`
10. `ChatSocketHandler -> Socket.io Room: emit receive_message(message.toResponse())`
11. On `read_receipt`, mark messages read and emit `messages_read`.

Use `alt` blocks for missing token, invalid token, not participant, and chat unavailable.

### E. Payment confirmation creates earning

Participants: `Client UI`, `PaymentRoutes`, `AuthMiddleware`, `PaymentController`, `PaymentService`, `PaymentRepository`, `Payment entity`, `SessionRepository`, `Earning entity`, `EarningRepository`, `NotificationService`, `Prisma/PostgreSQL`.

Flow:

1. `POST /api/v1/payments/initiate`
2. Client authenticated and authorized.
3. Verify session belongs to client.
4. Reject duplicate payment by session.
5. Create `Payment` with default amount `1500 INR`, status `PENDING`, and mock gateway order.
6. `POST /api/v1/payments/confirm`
7. Load payment, verify ownership.
8. `Payment.confirm(transactionId, gatewayResponse)` changes `PENDING -> COMPLETED`, sets `paidAt`.
9. Save payment.
10. Load session by `payment.sessionId`.
11. `Earning.create(therapistId, sessionId, amount, commissionRate=0.10)` calculates `platformCommission` and `netAmount`.
12. Save earning.
13. `NotificationService.sendToUsers()` creates payment update notifications.

Use composition-style note: one `Payment` belongs to exactly one `Session`; one confirmed payment can create one `Earning`.

### F. Assessment creates crisis signal and treatment plan uses assessment

Participants: `Client UI`, `AssessmentRoutes`, `AssessmentController`, `AssessmentService`, `CrisisMonitoringService`, `NotificationService`, `Prisma/PostgreSQL`, `Therapist UI`, `TreatmentPlanRoutes`, `TreatmentPlanController`, `TreatmentPlanService`.

Flow:

1. Client submits `POST /api/v1/assessments`.
2. `AssessmentService` verifies role `CLIENT` and existing client profile.
3. Calculate score from numeric values inside JSON responses.
4. Compute severity: `LOW`, `MILD`, `MODERATE`, `HIGH`, `CRITICAL`.
5. Create `Assessment`.
6. Evaluate crisis risk.
7. Persist assessment signal as `AIInteraction`.
8. Send crisis alert when needed and send client AI nudge notification.
9. Therapist creates `POST /api/v1/treatment-plans`.
10. Verify therapist role, client exists, assessment exists and belongs to client, and no treatment plan already exists for that assessment.
11. Normalize milestones and create `TreatmentPlan`.

Use `alt` blocks for no numeric response values, unauthorized role, assessment/client mismatch, duplicate treatment plan, and high/critical crisis alert path.

## 3. ER Diagram Prompt

Create an ER diagram for the Zenora Prisma/PostgreSQL schema. Use crow's foot cardinality. Mark primary keys as `PK`, foreign keys as `FK`, unique constraints as `UK`, and optional relations as nullable. Include enums.

Entities and key fields:

- `User`: `id PK`, `email UK`, `phone UK nullable`, `name`, `passwordHash`, `role`, `isActive`, `isEmailVerified`, `onboardingCompleted`, `onboardingCompletedAt`, `onboardingProfile JSON`, timestamps.
- `Client`: `id PK/FK -> User.id`, `language`, `gender nullable`, `emergencyContact nullable`, `dataVisibility`.
- `Therapist`: `id PK/FK -> User.id`, `licenseNumber UK`, `specialization`, `languages[]`, `isVerified`, `verificationStatus`, `rejectionReason`, `verifiedAt`, `rating`, `totalRatings`, `workingHours JSON`, `bio`, `experience`, `hourlyRate`, `bankAccountInfo JSON`.
- `Admin`: `id PK/FK -> User.id`, `adminLevel`, `department`.
- `TherapistDocument`: `id PK`, `therapistId FK`, `type`, `fileUrl`, `fileName`, `notes`, `createdAt`.
- `AvailabilitySlot`: `id PK`, `therapistId FK`, `startTime`, `endTime`, `isBooked`, `createdAt`.
- `Session`: `id PK`, `clientId FK`, `therapistId FK`, `slotId FK`, `status`, `type`, `scheduledAt`, `startedAt`, `endedAt`, `notes`, `recordingUrl`, `cancellationReason`, timestamps.
- `Payment`: `id PK`, `clientId FK`, `sessionId FK UK`, `amount`, `currency`, `status`, `method`, `transactionId UK nullable`, `gatewayResponse JSON`, `refundReason`, `paidAt`, timestamps.
- `Subscription`: `id PK`, `clientId FK UK`, `planName`, `price`, `currency`, `status`, `autoRenew`, `startDate`, `endDate`, timestamps.
- `Assessment`: `id PK`, `clientId FK`, `responses JSON`, `score`, `severity`, `completedAt`, `createdAt`.
- `TreatmentPlan`: `id PK`, `clientId FK`, `therapistId FK`, `assessmentId FK UK`, `goals`, `milestones JSON`, `status`, `startDate`, `endDate`, timestamps.
- `Prescription`: `id PK`, `therapistId FK`, `clientId FK`, `medications JSON`, `instructions`, `pdfUrl`, `issuedAt`, `createdAt`.
- `Complaint`: `id PK`, `raisedById FK -> User.id`, `againstId FK -> User.id`, `description`, `status`, `resolution`, `resolvedAt`, timestamps, `clientId FK nullable`, `therapistId FK nullable`.
- `AIInteraction`: `id PK`, `clientId FK`, `sessionId FK UK nullable`, `inputText`, `responseText`, `moodScore`, `crisisFlag`, `crisisLevel`, `createdAt`.
- `Notification`: `id PK`, `userId FK`, `clientId FK nullable`, `type`, `channel`, `title`, `message`, `isRead`, `metadata JSON`, `sentAt`.
- `Rating`: `id PK`, `clientId FK`, `therapistId FK`, `sessionId FK UK`, `score`, `review`, `createdAt`.
- `Earning`: `id PK`, `therapistId FK`, `sessionId FK UK`, `amount`, `platformCommission`, `netAmount`, `isPaid`, `paidAt`, `withdrawalId FK nullable`, `createdAt`.
- `WithdrawalRequest`: `id PK`, `therapistId FK`, `amount`, `status`, `notes`, `processedAt`, `requestedAt`, timestamps.
- `ChatMessage`: `id PK`, `sessionId FK`, `senderId FK -> User.id`, `content`, `isRead`, `createdAt`.

Relationships and cardinalities:

- `User ||--o| Client`: one user can have zero or one client profile; each client profile belongs to exactly one user.
- `User ||--o| Therapist`: one user can have zero or one therapist profile; each therapist profile belongs to exactly one user.
- `User ||--o| Admin`: one user can have zero or one admin profile; each admin profile belongs to exactly one user.
- `User ||--o{ Complaint : raises` through `Complaint.raisedById`.
- `User ||--o{ Complaint : receives/against` through `Complaint.againstId`.
- `User ||--o{ Notification`.
- `User ||--o{ ChatMessage : sends`.
- `Client ||--o{ Session`.
- `Therapist ||--o{ Session`.
- `Therapist ||--o{ AvailabilitySlot`.
- `AvailabilitySlot ||--o{ Session`; each session references one slot.
- `Session ||--o| Payment`; payment has `sessionId UK`, so at most one payment per session.
- `Session ||--o| AIInteraction`; AI interaction has `sessionId UK nullable`, so at most one session-linked AI interaction.
- `Session ||--o| Rating`; rating has `sessionId UK`, so at most one rating per session.
- `Session ||--o| Earning`; earning has `sessionId UK`, so at most one earning per session.
- `Session ||--o{ ChatMessage`.
- `Client ||--o{ Payment`.
- `Client ||--o| Subscription`; subscription has `clientId UK`.
- `Client ||--o{ Assessment`.
- `Assessment ||--o| TreatmentPlan`; treatment plan has `assessmentId UK`.
- `Client ||--o{ TreatmentPlan`.
- `Therapist ||--o{ TreatmentPlan`.
- `Client ||--o{ Prescription`.
- `Therapist ||--o{ Prescription`.
- `Client ||--o{ Rating`.
- `Therapist ||--o{ Rating`.
- `Client ||--o{ AIInteraction`.
- `Client ||--o{ Notification` via optional `Notification.clientId`.
- `Therapist ||--o{ TherapistDocument`.
- `Therapist ||--o{ Earning`.
- `Therapist ||--o{ WithdrawalRequest`.
- `WithdrawalRequest ||--o{ Earning`; an earning may have nullable `withdrawalId`.
- `Client ||--o{ Complaint` optional relation through `Complaint.clientId`.
- `Therapist ||--o{ Complaint` optional relation through `Complaint.therapistId`.

Enums to include:

- `Role`: `CLIENT`, `THERAPIST`, `ADMIN`
- `SessionStatus`: `PENDING`, `CONFIRMED`, `ONGOING`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`
- `SessionType`: `VIDEO`, `VOICE`, `CHAT`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- `ComplaintStatus`: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`
- `SubscriptionStatus`: `ACTIVE`, `EXPIRED`, `CANCELLED`
- `WithdrawalStatus`: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`
- `NotificationType`: `SESSION_REMINDER`, `MEDICATION_REMINDER`, `AI_NUDGE`, `COMPLAINT_UPDATE`, `PAYMENT_UPDATE`, `CRISIS_ALERT`
- `NotificationChannel`: `PUSH`, `EMAIL`, `SMS`
- `CrisisLevel`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `VerificationStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `DocumentType`: `LICENSE`, `ID_PROOF`, `DEGREE`, `CERTIFICATE`, `OTHER`

## 4. Use Case Diagram Prompt

Create a UML use case diagram for the Zenora backend.

Actors:

- `Guest`
- `Authenticated User`
- `Client`
- `Therapist`
- `Admin`
- `Google OAuth Provider`
- `Payment Gateway (mock/current placeholder)`
- `Notification Provider (future push/email/SMS placeholder)`
- `Socket.io Client`

Actor generalization:

- `Client`, `Therapist`, and `Admin` specialize `Authenticated User`.

Guest use cases:

- Register account
- Login
- Start Google OAuth login
- Complete Google OAuth callback
- Refresh token
- Forgot password
- Reset password
- Search verified therapists
- View public therapist profile
- View therapist availability
- View therapist ratings

Authenticated User use cases:

- Get current user
- Complete onboarding
- Check onboarding status
- Change password
- Send email verification
- Verify email
- Logout
- View own notifications
- Mark notification read
- Mark all notifications read

Client use cases:

- Create client profile
- Submit assessment
- View own assessments
- Book session
- View session history
- View session details
- Cancel session
- Reschedule session
- View session notes
- Initiate payment
- Confirm payment
- View payment
- Download/view invoice
- Manage subscription: create, view mine, renew, cancel
- Send chat message
- View chat history
- Mark chat read
- View unread chat count
- View prescriptions
- View treatment plans
- Update treatment-plan milestone progress
- Create rating
- View own ratings
- Raise complaint
- View own complaints
- View transaction history

Therapist use cases:

- Create therapist profile
- Update own therapist profile
- View own therapist profile
- Upload therapist verification document
- List own documents
- Delete own document
- Create availability slots
- List own availability
- Update availability slot
- Delete availability slot
- Confirm session
- Start session
- Complete session
- Cancel session
- Add session notes
- View client assessments
- Create treatment plan
- View treatment plans
- Update treatment-plan milestone progress
- Update treatment-plan status
- Create prescription
- Generate prescription PDF
- Share prescription
- View ratings
- View earnings
- View earnings summary
- Request withdrawal
- View withdrawals
- View transaction history
- Send/read session chat
- Raise or view complaints

Admin use cases:

- Create admin profile
- Review therapist applications
- View therapist review bundle
- View therapist documents
- Approve therapist
- Reject therapist
- Refund payment
- Process withdrawal
- Review complaints
- Send custom notification
- Send session reminders
- Send payment update notification
- Send crisis alert
- View analytics dashboard
- View complaint summary
- View high-risk users
- View notification summary
- Access any session details, assessment details, treatment plan details, prescription details where allowed by routes

Use relationships:

- `Book session` includes `Authenticate`, `Authorize Client`, `Validate therapist approved`, `Validate slot available`, and `Lock slot`.
- `Confirm payment` includes `Authenticate`, `Authorize Client`, `Update payment status`, `Create earning`, and `Send payment notification`.
- `Submit assessment` includes `Calculate score`, `Compute severity`, `Evaluate crisis risk`, `Persist AIInteraction signal`, and `Send AI nudge`; it extends `Send crisis alert` when risk is high/critical.
- `Create treatment plan` includes `Validate client`, `Validate assessment belongs to client`, and `Normalize milestones`.
- `Review therapist application` includes `View therapist review bundle`; it is extended by `Approve therapist` and `Reject therapist`.
- `Process withdrawal` includes `Validate available withdrawal request`; `Approve withdrawal` includes `Mark earnings paid`; `Reject withdrawal` records rejection notes.
- `Send/read session chat` includes `Authenticate socket or REST request`, `Verify session participant`, and `Verify chat allowed`.
- `Manage subscription` is generalized into create, renew, cancel, and get current subscription.
- `View dashboard analytics` includes complaint summary, high-risk users, and notification summary.

Use arrow notation:

- Actor to use case: solid association line.
- `include`: dashed arrow from base use case to included use case labeled `<<include>>`.
- `extend`: dashed arrow from extension use case to base use case labeled `<<extend>>`.
- Actor inheritance: hollow triangle from specialized actor to `Authenticated User`.
- Group use cases into packages: `Authentication`, `Profiles`, `Therapists`, `Sessions & Chat`, `Payments & Finance`, `Clinical Care`, `Notifications`, `Admin`.
