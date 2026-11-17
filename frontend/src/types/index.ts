export type Role = "DIRECTOR" | "TEACHER" | "STUDENT" | "PARENT";

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone_number?: string;
  profile_picture?: string;
  is_active: boolean;
  date_joined?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    status_code: number;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PaginatedData<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Academics
export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface GradeLevel {
  id: string;
  name: string;
  level: number;
  academic_year: string;
  academic_year_name?: string;
  description?: string;
}

export interface ClassSection {
  id: string;
  grade_level: string;
  grade_level_name?: string;
  name: string;
  capacity: number;
  room_number?: string;
  is_active: boolean;
  student_count?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  grade_levels?: string[];
  grade_level_names?: string[];
  is_active: boolean;
}

export interface SubjectAssignment {
  id: string;
  teacher: string;
  teacher_name?: string;
  teacher_email?: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  section: string;
  section_name?: string;
  grade_level_name?: string;
  academic_year: string;
  academic_year_name?: string;
  is_active: boolean;
}

// Enrollment
export interface StudentProfile {
  id: string;
  user: User | string;
  student_id: string;
  section: string | null;
  section_name?: string;
  grade_level_name?: string;
  date_of_birth: string;
  enrollment_date: string;
  guardian_contact?: string;
  medical_notes?: string;
  is_active: boolean;
  user_details?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
}

export interface TeacherProfile {
  id: string;
  user: User | string;
  employee_id: string;
  department: string;
  specialization?: string;
  qualification?: string;
  hire_date: string;
  is_active: boolean;
  user_details?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
}

export interface ParentProfile {
  id: string;
  user: User | string;
  occupation?: string;
  address?: string;
  secondary_phone?: string;
  is_active: boolean;
  user_details?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
}

export interface StudentGuardian {
  id: string;
  parent: string | ParentProfile;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  student: string | StudentProfile;
  student_name?: string;
  student_id_number?: string;
  relationship: "FATHER" | "MOTHER" | "GUARDIAN" | "SIBLING" | "OTHER";
  is_primary: boolean;
}

// Attendance
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  id: string;
  student: string;
  student_name?: string;
  student_id_number?: string;
  subject_assignment: string;
  subject_name?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  recorded_by?: string;
  recorded_by_name?: string;
}

export interface AbsenceSummary {
  student_id: string;
  student_name: string;
  total_absences: number;
  recent_absences: {
    date: string;
    subject: string;
    remarks?: string;
  }[];
}

// Grading
export interface AssessmentCategory {
  id: string;
  name: string;
  subject_assignment: string;
  subject_name?: string;
  weight: number;
  description?: string;
}

export interface Grade {
  id: string;
  student: string;
  student_name?: string;
  student_id_number?: string;
  assessment_category: string;
  category_name?: string;
  score: number;
  max_score: number;
  percentage?: number;
  weighted_score?: number;
  remarks?: string;
  recorded_by?: string;
}

export interface SubjectTotal {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  weighted_total: number;
  letter_grade: string;
  grade_point: number;
}

export interface ReportCardSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  score: number;
  letter_grade: string;
  grade_point: number;
  categories: {
    name: string;
    weight: number;
    score: number;
    max_score: number;
    percentage: number;
  }[];
}

export interface ReportCard {
  student_id: string;
  student_name: string;
  student_id_number: string;
  section_name: string;
  academic_year: string;
  academic_year_name: string;
  subjects: ReportCardSubject[];
  overall_percentage: number;
  gpa: number;
  letter_grade: string;
}
