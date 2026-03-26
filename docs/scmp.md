# Software Configuration Management Plan (SCMP)
## Habit Tracking System with Analytics Dashboard

**Version:** 1.0  
**Date:** March 2026

---

### 1. Introduction

This SCMP defines the configuration management processes for the Habit Tracking System project. It covers version control, environment configuration, build management, and change control.

### 2. Configuration Items (CIs)

| CI Name            | Type        | Location                     |
|--------------------|-------------|------------------------------|
| Source Code        | Code        | `src/`                       |
| Database Schema    | Data        | `database/schema.sql`        |
| Environment Config | Config      | `.env` (not committed to VCS)|
| Package Manifest   | Config      | `package.json`               |
| Build Script       | Script      | `build/build.sh`             |
| Documentation      | Docs        | `docs/`                      |
| Test Cases         | Test        | `test/`                      |

### 3. Version Control

- **System:** Git
- **Branching Strategy:**
  - `main` – stable, production-ready code
  - `develop` – integration branch
  - `feature/*` – individual features
  - `hotfix/*` – urgent production fixes

### 4. Environment Configuration

| Variable    | Description               | Default              |
|-------------|---------------------------|----------------------|
| PORT        | Server port               | 3000                 |
| JWT_SECRET  | JWT signing secret        | (must be set)        |
| DB_PATH     | SQLite database file path | ./database/habit_tracker.db |

- `.env` file is **never committed** to version control (listed in `.gitignore`)
- `.env.example` is provided as a template

### 5. Build Management

```bash
# Install dependencies
npm install

# Development (hot-reload)
npm run dev

# Production start
npm start

# Full build script
bash build/build.sh
```

### 6. Change Control Process

1. Developer creates `feature/` branch from `develop`
2. Implements and tests the change locally
3. Submits Pull Request to `develop`
4. Code review required before merge
5. Merged changes tested in `develop`
6. Release: merge `develop` → `main` with version tag

### 7. Database Schema Versioning

- Schema is defined in `database/schema.sql`
- Uses `CREATE TABLE IF NOT EXISTS` for idempotent initialization
- Future migrations should be numbered: `migrations/001_add_column.sql`

### 8. Dependency Management

All dependencies pinned via `package-lock.json`. To update:
```bash
npm outdated          # Check for updates
npm update            # Update within semver range
npm audit             # Check for vulnerabilities
```
