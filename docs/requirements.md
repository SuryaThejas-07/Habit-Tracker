# Requirements Document
## Habit Tracking System with Analytics Dashboard

### 1. Functional Requirements

#### 1.1 User Authentication
- FR-01: Users shall be able to register with name, email, and password
- FR-02: Users shall be able to login with email and password
- FR-03: Sessions shall be maintained using JWT tokens (7-day expiry)
- FR-04: Protected routes shall reject unauthenticated requests
- FR-05: Passwords shall be hashed using bcrypt (salt rounds ≥ 10)

#### 1.2 Habit Management
- FR-06: Authenticated users shall create habits with title, frequency (daily/weekly), icon, and description
- FR-07: Users shall update any of their own habits
- FR-08: Users shall delete habits (cascades to all logs)
- FR-09: Users shall view all their habits with today's completion status
- FR-10: Each habit shall belong to exactly one user

#### 1.3 Daily Logging
- FR-11: Users shall mark/unmark a habit as complete for any given day
- FR-12: Only one log entry shall exist per habit per day (enforced by DB constraint)
- FR-13: Log history shall be retrievable for a specified date range

#### 1.4 Analytics
- FR-14: System shall calculate current streak for each habit
- FR-15: System shall calculate 30-day completion rate
- FR-16: System shall provide daily, weekly, monthly breakdowns
- FR-17: Dashboard shall display Chart.js visualizations (bar, line, doughnut)

### 2. Non-Functional Requirements

#### 2.1 Performance
- NFR-01: API responses shall complete within 500ms for typical datasets
- NFR-02: Frontend pages shall load within 2 seconds on 4G connection

#### 2.2 Security
- NFR-03: Passwords shall never be stored in plain text
- NFR-04: JWT secrets shall be stored in environment variables, not source code
- NFR-05: All habit operations shall be scoped to the authenticated user

#### 2.3 Usability
- NFR-06: UI shall be responsive and work on mobile, tablet, and desktop
- NFR-07: All critical actions shall provide user feedback (toast notifications)
- NFR-08: Error states and empty states shall be clearly communicated

#### 2.4 Maintainability
- NFR-09: Code shall follow MVC pattern
- NFR-10: Each module shall have a single, well-defined responsibility
- NFR-11: All public functions shall have JSDoc comments

### 3. System Constraints
- SC-01: Database: SQLite (via better-sqlite3), file-based, no external server required
- SC-02: Runtime: Node.js v18+
- SC-03: No third-party authentication providers required (custom JWT)
- SC-04: Charts rendered client-side using Chart.js v4
