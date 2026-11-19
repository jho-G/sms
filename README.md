# 🎓 Student Management System (SMS)

A modern, production-ready, full-stack Student Management System engineered with a **Django Modular Monolith** backend, a **React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** frontend, containerized with **Docker & Compose**, and continuously verified with **GitHub Actions CI/CD**.

---

## 🚀 Key Features & Capabilities

- 🔐 **Role-Based Authentication & Authorization**: JWT token auth (access & refresh tokens) with distinct roles: **Admin**, **Teacher**, and **Student/Guardian**.
- 📚 **Academic & Curriculum Management**: Academic years, terms, classes/sections, subjects, and teacher assignments.
- 👨‍🎓 **Student Enrollment & Records**: Student profiles, roll numbers, guardian contacts, emergency information, and class assignments.
- 📅 **Interactive Attendance Tracking**: Single-date & bulk attendance recording with real-time analytics (Present, Absent, Late, Excused).
- 📊 **Grading, Assessments & Report Cards**: Configurable grading scales, categories (Exams, Quizzes, Homework), term report card generation, and GPA calculations.
- 🎨 **Modern React 19 Frontend**:
  - **Tailwind CSS v4** styling with glassmorphism, fluid responsive layouts, and dark mode support.
  - **shadcn/ui & Radix UI** accessible primitives (dialogs, select dropdowns, tabs, dropdown menus).
  - **Framer Motion** smooth page transitions, stagger animations, and micro-interactions.
  - **Impeccable UI** with Lucide icons, stats cards, and interactive data tables.
- 🐳 **Enterprise Containerization**:
  - Multi-stage Docker builds for backend and frontend.
  - PostgreSQL 16 database with persistent storage.
  - Nginx reverse proxy serving optimized SPA static files with gzip compression and caching.
  - Automatic database socket wait, migrations, static collection, and demo data seeding on startup.
- 🔄 **Automated CI/CD Pipelines**:
  - Full backend test suite execution (70 tests) and Django system checks.
  - Frontend TypeScript verification and production Vite bundling.
  - Docker Compose configuration validation and dry-run container builds.
  - Automated dependency vulnerability scanning with `pip-audit` and `npm audit`.
  - Continuous Delivery to GitHub Container Registry (`ghcr.io`).

---

## 🛠️ Architecture & Tech Stack

```
                             +-------------------+
                             |   Web Browser     |
                             +---------+---------+
                                       |
                                       | HTTP :80
                                       v
                             +-------------------+
                             |   Nginx Proxy     |
                             |  (Frontend SPA)   |
                             +----+---------+----+
           Static React Bundle    |         |  /api/* Proxy
                                  v         v
                     +----------------+   +-------------------+
                     | React 19 + TS  |   | Django 6.1 + Gunicorn |
                     | Tailwind v4    |   | Modular Monolith  |
                     | shadcn/ui      |   +---------+---------+
                     +----------------+             |
                                                    | TCP :5432
                                                    v
                                          +-------------------+
                                          |   PostgreSQL 16   |
                                          +-------------------+
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion, Lucide React, Axios |
| **Backend** | Python 3.12, Django 6.1 (Modular Monolith), Django REST Framework, SimpleJWT, Gunicorn, psycopg2 |
| **Database** | PostgreSQL 16 (production container) / SQLite (zero-config local fallback) |
| **Web Server / Proxy** | Nginx Alpine (Reverse proxy, Gzip compression, SPA fallback routing) |
| **DevOps / CI/CD** | Docker, Docker Compose, GitHub Actions (CI, CD, Security), Dependabot |

---

## ⚡ Quick Start with Docker (Recommended)

### 1. Clone the repository & setup environment

```bash
git clone https://github.com/jho-G/sms.git
cd sms

# Copy the environment template
cp .env.docker.example .env
```

### 2. Run in Production Mode

```bash
docker compose up --build -d
```

Services will start in order with automatic health checks:
1. `sms-db` (PostgreSQL 16) spins up and initializes `sms_db`.
2. `sms-backend` waits for database readiness, runs migrations, collects static assets, optionally seeds initial demo data, and boots Gunicorn on `:8000`.
3. `sms-frontend` compiles the React bundle, starts Nginx on `:80`, and proxies `/api/` calls to the backend.

- **Frontend App**: [http://localhost](http://localhost)
- **Django Admin**: [http://localhost/admin/](http://localhost/admin/)
- **API Health Check**: [http://localhost/api/health/](http://localhost/api/health/)

To stop containers:
```bash
docker compose down
```

---

### 3. Run in Local Development Mode (with Hot Reloading)

For active code development with live code editing and instant reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- **Frontend Dev Server (Vite HMR)**: [http://localhost:5173](http://localhost:5173)
- **Backend Dev Server**: [http://localhost:8000](http://localhost:8000)

Any changes saved to `./frontend` or `./backend` will immediately trigger live reload inside the running containers!

---

## ⚙️ Environment Variables Reference

Key variables defined in `.env.docker.example`:

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django cryptographic secret key | *Insecure default provided for dev* |
| `DEBUG` | Enable/disable Django debug mode (`0` or `1`) | `0` |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1,backend,frontend` |
| `CORS_ALLOWED_ORIGINS` | Authorized origins for cross-origin requests | `http://localhost,http://127.0.0.1` |
| `POSTGRES_DB` | PostgreSQL database name | `sms_db` |
| `POSTGRES_USER` | PostgreSQL username | `sms_user` |
| `POSTGRES_PASSWORD` | PostgreSQL user password | `sms_secure_password` |
| `SEED_DEMO` | Populate demo data on first container startup (`1` or `0`) | `1` |
| `BACKEND_PORT` | Published host port for Django backend | `8000` |
| `FRONTEND_PORT` | Published host port for Frontend / Nginx | `80` |

---

## 🔒 Security & API Rate Limiting

To prevent credential stuffing and brute-force attacks, the API enforces tiered rate limiting via Django REST Framework:

| Scope | Rate Limit | Target Endpoints | Behavior when Exceeded |
|---|---|---|---|
| **Auth Burst** | 10 requests / minute | `/api/auth/login/`, `/api/auth/register/` | HTTP 429 Too Many Requests (`Retry-After` header) |
| **Auth Sustained** | 100 requests / hour | `/api/auth/login/`, `/api/auth/register/` | HTTP 429 Too Many Requests |
| **Password Operations** | 5 requests / hour | `/api/auth/change-password/` | HTTP 429 Too Many Requests |
| **Anonymous Global** | 100 requests / hour | Unauthenticated endpoints | HTTP 429 Too Many Requests |
| **Authenticated User** | 1000 requests / hour | Authenticated session queries | HTTP 429 Too Many Requests |

---

## 🧪 Testing & Code Quality

### Running Backend Tests
```bash
# In local venv
python backend/manage.py test backend/

# Inside running backend container
docker compose exec backend python manage.py test .
```

### Running Frontend Build Verification
```bash
# In local frontend directory
cd frontend
npm run build
```

---

## 🔄 GitHub Actions CI/CD Pipeline

The repository includes a comprehensive, 3-tier GitHub Actions workflow:

1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - `backend-test`: Tests Django models, views, API endpoints, and runs `manage.py check`.
   - `frontend-verify`: Validates TypeScript typings and compiles production Vite bundle.
   - `docker-validate`: Runs `docker compose config` validation and dry-run container builds.
2. **Security & Vulnerability Scanning (`.github/workflows/security.yml`)**:
   - Automated scans of Python packages via `pip-audit`.
   - Security audit of npm dependencies via `npm audit`.
   - Runs on PRs and weekly scheduled scans.
3. **Continuous Delivery (`.github/workflows/cd.yml`)**:
   - Builds multi-platform Docker container images.
   - Automatically publishes versioned images to **GitHub Container Registry** (`ghcr.io/jho-g/sms/backend` and `frontend`).
4. **Dependabot (`.github/dependabot.yml`)**:
   - Automated weekly dependency update PRs for Python, npm, Docker, and GitHub Actions.

---

## 👥 Demo Credentials (when `SEED_DEMO=1`)

The login form uses **Email** and **Password** (or click any role card on the login screen for 1-click login):

| Role | Email | Username | Password | Access Scope |
|---|---|---|---|---|
| **School Director (Admin)** | `director@sms.com` | `director` | `director123` | Full administrative control (Years, Sections, Subjects, Users) |
| **Teacher** | `teacher@sms.com` | `teacher` | `teacher123` | Class assignments, Attendance recording, Grades & grading categories |
| **Student** | `student@sms.com` | `student` | `student123` | Personal Attendance history, Report Card & GPA |
| **Parent / Guardian** | `parent@sms.com` | `parent` | `parent123` | Child academic overview, attendance tracking, and report cards |
| **Django Superuser** | `admin@sms.com` | `admin` | `admin123` | Access to native Django Admin at `/admin/` |

---

## 📄 License

This project is licensed under the MIT License.
