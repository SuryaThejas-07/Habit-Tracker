# 🌟 HabitFlow – Habit Tracking System with Analytics Dashboard

A full-stack habit tracking application with a premium dark UI, JWT authentication, REST API backend, and interactive analytics charts.

---

## ✨ Features

- 🔐 **Secure Auth** – JWT-based registration & login
- 📋 **Habit CRUD** – Create, edit, delete habits with icons
- ✅ **Daily Logging** – One-click habit completion toggle
- 🔥 **Streak Tracking** – Real-time streak calculation
- 📊 **Analytics Dashboard** – Chart.js charts: bar, line, doughnut, weekly
- 🎨 **Premium Dark UI** – Glassmorphism, animations, responsive design

---

## 🏗️ Project Structure

```
habit-tracker/
├── src/
│   ├── frontend/
│   │   ├── index.html          # Habits page
│   │   ├── dashboard.html      # Analytics dashboard
│   │   ├── login.html          # Login / Register
│   │   ├── styles/main.css
│   │   ├── scripts/
│   │   │   ├── auth.js         # Auth & API utilities
│   │   │   ├── app.js          # Habit management
│   │   │   └── analytics.js    # Charts & analytics
│   │   └── assets/images/      # Logo, background, icons
│   └── backend/
│       ├── app.js              # Express entry point
│       ├── config/db.js        # SQLite initialization
│       ├── models/             # userModel, habitModel
│       ├── controllers/        # userCtrl, habitCtrl, analyticsCtrl
│       ├── routes/             # userRoutes, habitRoutes, analyticsRoutes
│       └── middleware/auth.js  # JWT middleware
├── database/
│   └── schema.sql
├── docs/
│   ├── requirements.md
│   ├── design.md
│   └── scmp.md
├── test/
│   ├── apiTests.json
│   └── userTests.json
├── build/
│   └── build.sh
├── .env
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9+

### Installation

```bash
# 1. Navigate to the project directory
cd "Habit Tracking System/habit-tracker"

# 2. Install dependencies
npm install

# 3. Start development server (hot-reload)
npm run dev
```

### Open in Browser
```
http://localhost:3000/login.html
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` (already done for you):

| Variable    | Default                        | Description              |
|-------------|-------------------------------|--------------------------|
| `PORT`      | `3000`                        | Server port              |
| `JWT_SECRET`| `habit_tracker_jwt_secret_2024`| Change in production!   |
| `DB_PATH`   | `./database/habit_tracker.db`  | SQLite file location    |

---

## 📡 API Endpoints

| Method | Endpoint                      | Auth | Description            |
|--------|-------------------------------|------|------------------------|
| POST   | `/api/users/register`         | –    | Register               |
| POST   | `/api/users/login`            | –    | Login → JWT            |
| GET    | `/api/habits`                 | JWT  | List habits            |
| POST   | `/api/habits`                 | JWT  | Create habit           |
| PUT    | `/api/habits/:id`             | JWT  | Update habit           |
| DELETE | `/api/habits/:id`             | JWT  | Delete habit           |
| POST   | `/api/habits/:id/log`         | JWT  | Toggle daily check-off |
| GET    | `/api/analytics/summary`      | JWT  | Overall stats          |
| GET    | `/api/analytics/daily?days=7` | JWT  | Daily chart data       |
| GET    | `/api/analytics/streaks`      | JWT  | Per-habit streaks      |

---

## 🗄️ Database

Uses **SQLite** (via `better-sqlite3`) — no external database server required. The DB file is created automatically at `./database/habit_tracker.db` on first run.

**Tables:** `users`, `habits`, `logs`

---

## 🔨 Build Script

```bash
# Full build + optional auto-start
bash build/build.sh          # Build only
bash build/build.sh --dev    # Build + start dev server
bash build/build.sh --prod   # Build + start production server
```

---

## 🧪 Testing

Test cases are provided as JSON in `test/`:
- `apiTests.json` – REST API endpoint test cases
- `userTests.json` – User auth test cases

You can import `apiTests.json` into **Postman** or **Insomnia** for manual testing, or use tools like `curl`.

---

## 🛠️ Tech Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Frontend   | HTML5, CSS3, JavaScript (ES6+)|
| UI Charts  | Chart.js v4                  |
| Backend    | Node.js, Express.js          |
| Database   | SQLite (better-sqlite3)      |
| Auth       | JWT (jsonwebtoken + bcryptjs)|

---

## 📄 Documentation

- [`docs/requirements.md`](docs/requirements.md) – Functional & non-functional requirements
- [`docs/design.md`](docs/design.md) – Architecture, DB design, API reference
- [`docs/scmp.md`](docs/scmp.md) – Software Configuration Management Plan

---

## 📝 License

MIT © HabitFlow 2026
