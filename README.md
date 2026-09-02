# Student Management System (SMS)

A Django REST Framework-based Student Management System built with a **Modular Monolith** architecture.

## Project Structure

```
sms/
├── .env                          # Environment variables
├── .gitignore
├── README.md
├── requirements.txt              # Python dependencies
├── manage.py                     # Django management script
│
├── config/                       # Project configuration
│   ├── __init__.py
│   ├── settings.py               # Django settings (JWT, DRF, etc.)
│   ├── urls.py                   # Root URL configuration
│   ├── wsgi.py                   # WSGI entry point
│   └── asgi.py                   # ASGI entry point
│
└── apps/                         # Application modules
    ├── __init__.py
    │
    ├── common/                   # Shared utilities
    │   ├── __init__.py
    │   ├── models.py             # TimeStampedModel base class
    │   ├── permissions.py        # Shared permissions (IsOwner, etc.)
    │   └── exceptions.py         # Custom DRF exception handler
    │
    ├── authentication/           # Authentication & User management
    │   ├── __init__.py
    │   ├── models.py             # Custom User model (UUID PK, roles)
    │   ├── services.py           # Business logic (create_user, etc.)
    │   ├── selectors.py          # Query functions
    │   ├── permissions.py        # Role-based permissions
    │   ├── api/
    │   │   ├── __init__.py
    │   │   ├── serializers.py    # API serializers
    │   │   ├── views.py          # API views
    │   │   └── urls.py           # API URL patterns
    │   └── migrations/
    │
    ├── academics/                # Academic Infrastructure
    │   ├── __init__.py
    │   ├── models.py             # AcademicYear, GradeLevel, ClassSection, Subject, SubjectAssignment
    │   ├── services.py           # Business logic
    │   ├── selectors.py          # Query functions
    │   ├── api/
    │   │   ├── __init__.py
    │   │   ├── serializers.py    # API serializers
    │   │   ├── views.py          # Director-only API views
    │   │   └── urls.py           # API URL patterns
    │   └── migrations/
    │
    └── enrollment/               # Enrollment & Profile Management
        ├── __init__.py
        ├── models.py             # StudentProfile, TeacherProfile, ParentProfile, StudentGuardian
        ├── services.py           # Business logic (register_student, link_parent_to_student)
        ├── selectors.py          # Query functions (get_student_guardians, get_parent_children)
        ├── api/
        │   ├── __init__.py
        │   ├── serializers.py    # API serializers
        │   ├── views.py          # Profile CRUD & guardian management views
        │   └── urls.py           # API URL patterns
        └── migrations/
```

## Features

### Modular Monolith Architecture
- **`config/`** - Project settings, root URLs, WSGI/ASGI configuration
- **`apps/`** - All Django applications in a single directory
- **`apps/common/`** - Shared utilities (base models, permissions, exceptions)
- Auto-discovery of apps via `sys.path` configuration

### Authentication System
- **Custom User Model** with UUID primary keys
- **Role-based system**: DIRECTOR, TEACHER, STUDENT, PARENT
- **JWT Authentication** using `djangorestframework-simplejwt`
- Token blacklisting for secure logout
- Password validation using Django's built-in validators

### Academic Infrastructure
- **AcademicYear** - Manage academic years (e.g., 2024-2025) with active year tracking
- **GradeLevel** - Grade levels 9-12 tied to academic years
- **ClassSection** - Sections within grades (e.g., 11-A, 12-B) with capacity management
- **Subject** - Subjects/courses (e.g., Mathematics, Physics) with grade level associations
- **SubjectAssignment** - Teacher-subject-section mappings with conflict prevention

### Enrollment & Profile Management
- **StudentProfile** - Student profiles with institutional ID, section assignment, DOB
- **TeacherProfile** - Teacher profiles with employee ID, department, qualifications
- **ParentProfile** - Parent profiles with occupation, address, secondary contact
- **StudentGuardian** - Junction model linking parents to children with relationship type and primary flag

### REST Framework Configuration
- Standard JSON formatting
- JWT/Session/Basic authentication
- Pagination (20 items per page)
- Throttling (100 anon/hour, 1000 user/hour)
- Custom exception handler for consistent error responses

## API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register/` | POST | Register a new user | No |
| `/api/auth/login/` | POST | Login and get JWT tokens | No |
| `/api/auth/logout/` | POST | Blacklist refresh token | Yes |
| `/api/auth/me/` | GET | Get current user profile | Yes |
| `/api/auth/me/` | PUT/PATCH | Update current user profile | Yes |
| `/api/auth/change-password/` | POST | Change password | Yes |

### JWT Token Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/token/refresh/` | POST | Refresh access token | No |
| `/api/auth/token/verify/` | POST | Verify JWT token | No |

### Academic Management (Director Only)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/academics/years/` | GET/POST | List/Create academic years | Director |
| `/api/academics/years/active/` | GET | Get active academic year | Director |
| `/api/academics/years/<uuid>/` | GET/PUT/PATCH/DELETE | Academic year detail | Director |
| `/api/academics/grades/` | GET/POST | List/Create grade levels | Director |
| `/api/academics/grades/<uuid>/` | GET/PUT/PATCH/DELETE | Grade level detail | Director |
| `/api/academics/sections/` | GET/POST | List/Create class sections | Director |
| `/api/academics/sections/by-grade/<uuid>/` | GET | Sections by grade level | Director |
| `/api/academics/sections/<uuid>/` | GET/PUT/PATCH/DELETE | Class section detail | Director |
| `/api/academics/subjects/` | GET/POST | List/Create subjects | Director |
| `/api/academics/subjects/<uuid>/` | GET/PUT/PATCH/DELETE | Subject detail | Director |
| `/api/academics/assignments/` | GET/POST | List/Create assignments | Director |
| `/api/academics/assignments/<uuid>/` | GET/DELETE | Assignment detail/deactivate | Director |
| `/api/academics/assignments/teacher/<uuid>/` | GET | Teacher's assignments | Director |
| `/api/academics/assignments/section/<uuid>/` | GET | Section's assignments | Director |

### Enrollment & Profiles

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/enrollment/students/` | GET/POST | List/Create student profiles | Yes |
| `/api/enrollment/students/<uuid>/` | GET/PUT/PATCH/DELETE | Student profile detail | Yes |
| `/api/enrollment/students/by-section/<uuid>/` | GET | Students in a section | Yes |
| `/api/enrollment/teachers/` | GET/POST | List/Create teacher profiles | Yes |
| `/api/enrollment/teachers/<uuid>/` | GET/PUT/PATCH/DELETE | Teacher profile detail | Yes |
| `/api/enrollment/parents/` | GET/POST | List/Create parent profiles | Yes |
| `/api/enrollment/parents/<uuid>/` | GET/PUT/PATCH/DELETE | Parent profile detail | Yes |
| `/api/enrollment/guardians/` | GET/POST | List/Create guardian links | Yes |
| `/api/enrollment/guardians/<uuid>/` | GET/DELETE | Guardian link detail/unlink | Yes |
| `/api/enrollment/guardians/student/<uuid>/` | GET | Guardians of a student | Yes |
| `/api/enrollment/guardians/parent/<uuid>/` | GET | Children of a parent | Yes |
| `/api/enrollment/guardians/set-primary/` | POST | Set primary guardian | Yes |

## Setup

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create or update `.env` file:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser (Director)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

## Usage Examples

### Register a New User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "username": "student1",
    "first_name": "John",
    "last_name": "Doe",
    "password": "securepassword123",
    "password_confirm": "securepassword123",
    "role": "STUDENT"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepassword123"
  }'
```

### Access Protected Endpoint

```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <your-access-token>"
```

### Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<your-refresh-token>"
  }'
```

### Create Academic Year (Director)

```bash
curl -X POST http://localhost:8000/api/academics/years/ \
  -H "Authorization: Bearer <director-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-06-30",
    "is_active": true
  }'
```

### Create Grade Level (Director)

```bash
curl -X POST http://localhost:8000/api/academics/grades/ \
  -H "Authorization: Bearer <director-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grade 11",
    "level": 11,
    "academic_year": "<academic-year-uuid>",
    "description": "Junior year"
  }'
```

### Create Class Section (Director)

```bash
curl -X POST http://localhost:8000/api/academics/sections/ \
  -H "Authorization: Bearer <director-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "grade_level": "<grade-level-uuid>",
    "name": "A",
    "capacity": 35,
    "room_number": "101"
  }'
```

### Create Subject (Director)

```bash
curl -X POST http://localhost:8000/api/academics/subjects/ \
  -H "Authorization: Bearer <director-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mathematics",
    "code": "MATH101",
    "description": "Advanced mathematics",
    "grade_levels": ["<grade-level-uuid>"]
  }'
```

### Assign Teacher to Subject (Director)

```bash
curl -X POST http://localhost:8000/api/academics/assignments/ \
  -H "Authorization: Bearer <director-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teacher": "<teacher-uuid>",
    "subject": "<subject-uuid>",
    "section": "<section-uuid>",
    "academic_year": "<academic-year-uuid>"
  }'
```

## Models

### AcademicYear
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Year name (e.g., "2024-2025") |
| start_date | Date | Start date |
| end_date | Date | End date |
| is_active | Boolean | Active status (only one can be active) |

### GradeLevel
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Grade name (e.g., "Grade 11") |
| level | Integer | Numeric level (9-12) |
| academic_year | FK | Associated academic year |
| description | Text | Optional description |

### ClassSection
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| grade_level | FK | Associated grade level |
| name | String | Section name (e.g., "A") |
| capacity | Integer | Max students (default: 40) |
| room_number | String | Optional room number |
| is_active | Boolean | Active status |

### Subject
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Subject name (e.g., "Mathematics") |
| code | String | Subject code (e.g., "MATH101") |
| description | Text | Optional description |
| grade_levels | M2M | Associated grade levels |
| is_active | Boolean | Active status |

### SubjectAssignment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| teacher | FK | Teacher user (TEACHER role) |
| subject | FK | Subject |
| section | FK | Class section |
| academic_year | FK | Academic year |
| is_active | Boolean | Active status |

### StudentProfile
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user | FK | User with STUDENT role |
| student_id | String | Institutional ID (unique, indexed) |
| section | FK | Assigned class section |
| date_of_birth | Date | Student's DOB |
| enrollment_date | Date | Auto-set on creation |
| guardian_contact | String | Primary guardian phone |
| medical_notes | Text | Allergies/conditions |
| is_active | Boolean | Active status |

### TeacherProfile
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user | FK | User with TEACHER role |
| employee_id | String | Institutional employee ID (unique, indexed) |
| department | String | Department name |
| specialization | String | Areas of specialization |
| qualification | String | Highest qualification |
| hire_date | Date | Auto-set on creation |
| is_active | Boolean | Active status |

### ParentProfile
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user | FK | User with PARENT role |
| occupation | String | Parent's occupation |
| address | Text | Parent's address |
| secondary_phone | String | Secondary phone number |
| is_active | Boolean | Active status |

### StudentGuardian
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| parent | FK | ParentProfile |
| student | FK | StudentProfile |
| relationship | String | FATHER/MOTHER/GUARDIAN/SIBLING/OTHER |
| is_primary | Boolean | Primary guardian flag |

## Permissions

### Role-Based Permissions

| Permission | Description |
|------------|-------------|
| `IsDirector` | Allow access only to DIRECTOR role |
| `IsTeacher` | Allow access only to TEACHER role |
| `IsStudent` | Allow access only to STUDENT role |
| `IsParent` | Allow access only to PARENT role |
| `IsDirectorOrTeacher` | Allow access to DIRECTOR or TEACHER roles |

### Object-Level Permissions

| Permission | Description |
|------------|-------------|
| `IsOwner` | Allow access only to object owner |

## Dependencies

- **Django 6.1** - Web framework
- **Django REST Framework 3.18** - REST API toolkit
- **djangorestframework-simplejwt 5.4** - JWT authentication
- **django-cors-headers 4.9** - CORS handling
- **python-decouple 3.8** - Environment variable management
- **Pillow 12.3** - Image processing (for profile pictures)

## Development

### Adding New Apps

1. Create a new directory in `apps/`:
   ```bash
   mkdir apps/new_app
   touch apps/new_app/__init__.py
   ```

2. Add to `INSTALLED_APPS` in `config/settings.py`:
   ```python
   INSTALLED_APPS = [
       # ...
       "new_app",
   ]
   ```

3. Create models, services, selectors, and api/ structure following the authentication app pattern.

### Project Conventions

- **Models**: Use `common.models.TimeStampedModel` as base class
- **Services**: Business logic in `services.py`
- **Selectors**: Query functions in `selectors.py`
- **API Layer**: `api/serializers.py`, `api/views.py`, `api/urls.py`
- **Permissions**: Role-based permissions in each app's `permissions.py`
- **Imports**: Use module names without `apps.` prefix (e.g., `from academics.models import ...`)
- **No raw DB mutations in views**: All mutations go through `services.py`

## License

This project is for educational purposes.
