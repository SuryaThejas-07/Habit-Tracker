# Design Document
## Habit Tracking System with Analytics Dashboard

### 1. System Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (Client)               │
│  login.html  │  index.html  │ dashboard.html │
│  auth.js     │  app.js      │ analytics.js  │
└──────────────────────┬──────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────┐
│            Express.js Server                │
│  /api/users  │ /api/habits │ /api/analytics  │
│  userRoutes  │ habitRoutes │ analyticsRoutes │
│  userCtrl    │ habitCtrl   │ analyticsCtrl   │
└──────────────────────┬──────────────────────┘
                       │ better-sqlite3
┌──────────────────────▼──────────────────────┐
│            SQLite Database                  │
│  users table │ habits table │ logs table    │
└─────────────────────────────────────────────┘
```

### 2. Database Design

#### 2.1 Entity Relationship Diagram
```
Users (1) ──< Habits (1) ──< Logs
```

#### 2.2 Table Schemas

**users**
| Column     | Type     | Constraints           |
|------------|----------|-----------------------|
| id         | INTEGER  | PK, AUTOINCREMENT     |
| name       | TEXT     | NOT NULL              |
| email      | TEXT     | NOT NULL, UNIQUE      |
| password   | TEXT     | NOT NULL (bcrypt)     |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

**habits**
| Column      | Type     | Constraints           |
|-------------|----------|-----------------------|
| id          | INTEGER  | PK, AUTOINCREMENT     |
| user_id     | INTEGER  | FK → users.id         |
| title       | TEXT     | NOT NULL              |
| frequency   | TEXT     | daily / weekly        |
| icon        | TEXT     | fitness/study/water/sleep |
| description | TEXT     |                       |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP |

**logs**
| Column       | Type     | Constraints                  |
|--------------|----------|------------------------------|
| id           | INTEGER  | PK, AUTOINCREMENT            |
| habit_id     | INTEGER  | FK → habits.id               |
| date         | TEXT     | YYYY-MM-DD format            |
| status       | TEXT     | completed / missed           |
| completed_at | DATETIME | DEFAULT CURRENT_TIMESTAMP    |
| —            | UNIQUE   | (habit_id, date)             |

### 3. API Design

| Method | Endpoint                     | Auth | Description               |
|--------|------------------------------|------|---------------------------|
| POST   | /api/users/register          | No   | Register new user         |
| POST   | /api/users/login             | No   | Login, receive JWT        |
| GET    | /api/users/profile           | JWT  | Get profile               |
| GET    | /api/habits                  | JWT  | List all habits (w/ today)|
| POST   | /api/habits                  | JWT  | Create habit              |
| PUT    | /api/habits/:id              | JWT  | Update habit              |
| DELETE | /api/habits/:id              | JWT  | Delete habit              |
| POST   | /api/habits/:id/log          | JWT  | Toggle daily log          |
| GET    | /api/habits/:id/logs         | JWT  | Get log history           |
| GET    | /api/analytics/summary       | JWT  | Overall stats             |
| GET    | /api/analytics/daily?days=N  | JWT  | Daily breakdown           |
| GET    | /api/analytics/weekly        | JWT  | Weekly breakdown          |
| GET    | /api/analytics/monthly       | JWT  | Monthly breakdown         |
| GET    | /api/analytics/streaks       | JWT  | Per-habit streaks         |

### 4. Frontend Architecture

- **login.html** – Public page. Tab-switched login/register forms. Background image.
- **index.html** – Protected. Habit list with add/edit/delete modals, daily check-off.
- **dashboard.html** – Protected. Chart.js analytics: bar (daily), doughnut (today), line (monthly), bar (weekly).

### 5. Security Design

- Passwords hashed with bcrypt, 10 salt rounds
- JWT signed with HS256, stored in `localStorage`
- All `/api/habits` and `/api/analytics` routes protected by `authenticate` middleware
- Habits queried with `user_id = req.user.id` to prevent cross-user access

### 6. Streak Algorithm

```
For each habit:
  1. Fetch all completed logs ordered by date DESC
  2. Starting from today, walk backwards day by day
  3. Increment streak while consecutive day matches a log
  4. Stop on first gap
```
