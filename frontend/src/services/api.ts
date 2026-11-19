import type {
  ApiResponse,
  PaginatedData,
  User,
  AcademicYear,
  GradeLevel,
  ClassSection,
  Subject,
  SubjectAssignment,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  StudentGuardian,
  AttendanceRecord,
  AbsenceSummary,
  AssessmentCategory,
  Grade,
  SubjectTotal,
  ReportCard,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Tokens
  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  setTokens(tokens: { access: string; refresh: string }) {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
  }

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Request core with automatic token refresh
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // Handle 401 and try token refresh once
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.getAccessToken()}`;
          response = await fetch(url, { ...options, headers });
        } else {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent("sms:auth-expired"));
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          data: null as any,
          error: data.error || {
            status_code: response.status,
            message: data.message || "An unexpected error occurred.",
            details: data,
          },
        };
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      return {
        success: false,
        data: null as any,
        error: {
          status_code: 0,
          message: err.message || "Network request failed. Is the server running?",
        },
      };
    }
  }

  async refreshToken(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const json = await res.json();
        const newAccess = json.data?.access || json.access;
        if (newAccess) {
          localStorage.setItem("access_token", newAccess);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // ---------------- AUTH ----------------
  async login(credentials: { email: string; password: string }) {
    const res = await this.request<{
      user: User;
      tokens: { access: string; refresh: string };
    }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (res.success && res.data) {
      this.setTokens(res.data.tokens);
      this.setCurrentUser(res.data.user);
    }
    return res;
  }

  async register(payload: any) {
    const res = await this.request<{
      user: User;
      tokens?: { access: string; refresh: string };
    }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success && res.data?.tokens) {
      this.setTokens(res.data.tokens);
      this.setCurrentUser(res.data.user);
    }
    return res;
  }

  async logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      try {
        await this.request("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // ignore
      }
    }
    this.clearTokens();
  }

  async getMe() {
    return this.request<User>("/auth/me/");
  }

  async updateMe(data: Partial<User>) {
    return this.request<User>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) {
    return this.request("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ---------------- ACADEMICS ----------------
  async getAcademicYears() {
    return this.request<PaginatedData<AcademicYear> | AcademicYear[]>(
      "/academics/years/"
    );
  }

  async getActiveAcademicYear() {
    return this.request<AcademicYear>("/academics/years/active/");
  }

  async createAcademicYear(data: Partial<AcademicYear>) {
    return this.request<AcademicYear>("/academics/years/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAcademicYear(id: string, data: Partial<AcademicYear>) {
    return this.request<AcademicYear>(`/academics/years/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAcademicYear(id: string) {
    return this.request(`/academics/years/${id}/`, {
      method: "DELETE",
    });
  }

  async getGradeLevels(yearId?: string) {
    const query = yearId ? `?academic_year=${yearId}` : "";
    return this.request<PaginatedData<GradeLevel> | GradeLevel[]>(
      `/academics/grades/${query}`
    );
  }

  async createGradeLevel(data: Partial<GradeLevel>) {
    return this.request<GradeLevel>("/academics/grades/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGradeLevel(id: string, data: Partial<GradeLevel>) {
    return this.request<GradeLevel>(`/academics/grades/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteGradeLevel(id: string) {
    return this.request(`/academics/grades/${id}/`, {
      method: "DELETE",
    });
  }

  async getSections(gradeId?: string) {
    const query = gradeId ? `?grade_level=${gradeId}` : "";
    return this.request<PaginatedData<ClassSection> | ClassSection[]>(
      `/academics/sections/${query}`
    );
  }

  async createSection(data: Partial<ClassSection>) {
    return this.request<ClassSection>("/academics/sections/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSection(id: string, data: Partial<ClassSection>) {
    return this.request<ClassSection>(`/academics/sections/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSection(id: string) {
    return this.request(`/academics/sections/${id}/`, {
      method: "DELETE",
    });
  }

  async getSubjects() {
    return this.request<PaginatedData<Subject> | Subject[]>("/academics/subjects/");
  }

  async createSubject(data: Partial<Subject>) {
    return this.request<Subject>("/academics/subjects/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: string, data: Partial<Subject>) {
    return this.request<Subject>(`/academics/subjects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: string) {
    return this.request(`/academics/subjects/${id}/`, {
      method: "DELETE",
    });
  }

  async getSubjectAssignments(params?: { teacher?: string; section?: string }) {
    let query = "";
    if (params?.teacher) query = `?teacher=${params.teacher}`;
    else if (params?.section) query = `?section=${params.section}`;
    return this.request<PaginatedData<SubjectAssignment> | SubjectAssignment[]>(
      `/academics/assignments/${query}`
    );
  }

  async createSubjectAssignment(data: Partial<SubjectAssignment>) {
    return this.request<SubjectAssignment>("/academics/assignments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteSubjectAssignment(id: string) {
    return this.request(`/academics/assignments/${id}/`, {
      method: "DELETE",
    });
  }

  // ---------------- ENROLLMENT ----------------
  async getMyProfile() {
    return this.request<{ role: string; profile_id: string; profile: any }>(
      "/enrollment/me/"
    );
  }

  async getStudents(sectionId?: string) {
    const query = sectionId ? `?section=${sectionId}` : "";
    return this.request<PaginatedData<StudentProfile> | StudentProfile[]>(
      `/enrollment/students/${query}`
    );
  }

  async getStudentDetail(id: string) {
    return this.request<StudentProfile>(`/enrollment/students/${id}/`);
  }

  async createStudentProfile(data: any) {
    return this.request<StudentProfile>("/enrollment/students/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStudentProfile(id: string, data: any) {
    return this.request<StudentProfile>(`/enrollment/students/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteStudentProfile(id: string) {
    return this.request(`/enrollment/students/${id}/`, {
      method: "DELETE",
    });
  }

  async getTeachers() {
    return this.request<PaginatedData<TeacherProfile> | TeacherProfile[]>(
      "/enrollment/teachers/"
    );
  }

  async createTeacherProfile(data: any) {
    return this.request<TeacherProfile>("/enrollment/teachers/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getParents() {
    return this.request<PaginatedData<ParentProfile> | ParentProfile[]>(
      "/enrollment/parents/"
    );
  }

  async createParentProfile(data: any) {
    return this.request<ParentProfile>("/enrollment/parents/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getGuardians() {
    return this.request<PaginatedData<StudentGuardian> | StudentGuardian[]>(
      "/enrollment/guardians/"
    );
  }

  async getStudentGuardians(studentId: string) {
    return this.request<StudentGuardian[]>(`/enrollment/guardians/student/${studentId}/`);
  }

  async getParentChildren(parentId: string) {
    return this.request<StudentGuardian[]>(`/enrollment/guardians/parent/${parentId}/`);
  }

  async linkParentStudent(data: {
    parent_id: string;
    student_id: string;
    relationship: string;
    is_primary?: boolean;
  }) {
    return this.request<StudentGuardian>("/enrollment/guardians/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async unlinkGuardian(id: string) {
    return this.request(`/enrollment/guardians/${id}/`, {
      method: "DELETE",
    });
  }

  // ---------------- ATTENDANCE ----------------
  async getAttendanceRecords(params?: {
    student?: string;
    assignment?: string;
    date?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.student) q.append("student", params.student);
    if (params?.assignment) q.append("subject_assignment", params.assignment);
    if (params?.date) q.append("date", params.date);
    const query = q.toString() ? `?${q.toString()}` : "";
    return this.request<PaginatedData<AttendanceRecord> | AttendanceRecord[]>(
      `/attendance/${query}`
    );
  }

  async bulkSubmitAttendance(payload: {
    subject_assignment_id: string;
    date: string;
    records: { student_id: string; status: string; remarks?: string }[];
  }) {
    return this.request<any>("/attendance/bulk-submit/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getStudentAbsences(studentId: string) {
    return this.request<AbsenceSummary>(`/attendance/student/${studentId}/absences/`);
  }

  // ---------------- GRADING ----------------
  async getAssessmentCategories(assignmentId?: string) {
    const query = assignmentId ? `?subject_assignment=${assignmentId}` : "";
    return this.request<PaginatedData<AssessmentCategory> | AssessmentCategory[]>(
      `/grading/categories/${query}`
    );
  }

  async createAssessmentCategory(data: Partial<AssessmentCategory>) {
    return this.request<AssessmentCategory>("/grading/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getGrades(params?: { student?: string; category?: string }) {
    const q = new URLSearchParams();
    if (params?.student) q.append("student", params.student);
    if (params?.category) q.append("assessment_category", params.category);
    const query = q.toString() ? `?${q.toString()}` : "";
    return this.request<PaginatedData<Grade> | Grade[]>(`/grading/grades/${query}`);
  }

  async bulkSubmitGrades(payload: {
    assessment_category_id: string;
    grades: { student_id: string; score: number; max_score: number; remarks?: string }[];
  }) {
    return this.request<any>("/grading/grades/bulk-submit/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSubjectTotal(studentId: string, subjectId: string) {
    return this.request<SubjectTotal>(
      `/grading/subject-total/${studentId}/${subjectId}/`
    );
  }

  async getReportCard(studentId: string, yearId: string) {
    return this.request<ReportCard>(`/grading/report-card/${studentId}/${yearId}/`);
  }

  async getMyReportCard(yearId: string) {
    return this.request<ReportCard>(`/grading/my-report-card/${yearId}/`);
  }
}

export const api = new APIClient();

/**
 * Helper to unwrap Paginated or Direct arrays safely
 */
export function extractList<T>(res: ApiResponse<PaginatedData<T> | T[]>): T[] {
  if (!res.success || !res.data) return [];
  if (Array.isArray(res.data)) return res.data;
  if ("results" in res.data && Array.isArray(res.data.results)) {
    return res.data.results;
  }
  return [];
}
