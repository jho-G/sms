/**
 * API Client for Student Management System
 * Handles JWT authentication and all API requests
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Page to send the user back to when their session ends.
 * Resolved relative to the current document so the app keeps working when
 * it is served from a sub-path or opened straight off disk.
 */
const LOGIN_PAGE = 'index.html';
const DASHBOARD_PAGE = 'dashboard.html';

/**
 * Pull an array out of an API response.
 *
 * Every endpoint answers with `{success, data}`; `data` is the object for
 * detail routes and `{count, next, previous, results}` for paginated list
 * routes. This accepts either, plus a bare array, and never returns
 * undefined - callers can always `.map()` the result.
 */
function listOf(response) {
    const payload = response?.data ?? response;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
}

/**
 * Pull a single object out of an API response, or null when absent.
 */
function itemOf(response) {
    return response?.data ?? null;
}

/**
 * Escape text before it goes into an innerHTML template.
 *
 * Names, remarks and IDs all come from the database and are rendered into
 * markup; a teacher's remark containing markup would otherwise execute in a
 * student's browser.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Token management
    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    setTokens(access, refresh) {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    isAuthenticated() {
        return !!this.getAccessToken();
    }

    // Refresh access token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            // The refresh endpoint answers with the shared envelope, so the
            // tokens live under `data`. Reading them from the top level stored
            // `undefined` and signed the user out on the next request.
            const body = await response.json();
            const payload = body.data ?? body;

            if (!payload?.access) {
                throw new Error('Token refresh failed');
            }

            this.setTokens(payload.access, payload.refresh || refreshToken);
            return payload.access;
        } catch (error) {
            this.clearTokens();
            throw error;
        }
    }

    // Make API request with automatic token refresh
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        // Add authorization header if we have a token
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const accessToken = this.getAccessToken();
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers,
            });

            // If 401, try to refresh token
            if (response.status === 401 && this.getRefreshToken()) {
                try {
                    await this.refreshAccessToken();
                    headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    response = await fetch(url, {
                        ...options,
                        headers,
                    });
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    this.clearTokens();
                    window.location.href = LOGIN_PAGE;
                    throw new Error('Session expired. Please login again.');
                }
            }

            // 204 No Content carries no body to parse.
            if (response.status === 204) {
                return { success: true, data: null };
            }

            // Parse response
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.error?.message || data.message || 'Request failed',
                    data: data
                };
            }

            return data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw {
                status: 0,
                message: error.message || 'Network error. Please check your connection.',
                data: null
            };
        }
    }

    // Authentication API
    async login(email, password) {
        const data = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (data.success && data.data) {
            this.setTokens(data.data.tokens.access, data.data.tokens.refresh);
            this.setUser(data.data.user);
        }
        return data;
    }

    /**
     * Self-registration. Signs the new account straight in, so this replaces
     * whatever session is currently stored.
     */
    async register(userData) {
        const data = await this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (data.success && data.data?.tokens) {
            this.setTokens(data.data.tokens.access, data.data.tokens.refresh);
            this.setUser(data.data.user);
        }
        return data;
    }

    /**
     * Create an account on someone else's behalf (director adding a student,
     * teacher or parent).
     *
     * Deliberately never touches the stored tokens. `register()` used to be
     * reused here, and because the server issued a token pair for the new
     * account the director was silently swapped into the account they had
     * just created.
     */
    async createUser(userData) {
        return await this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        const refreshToken = this.getRefreshToken();
        try {
            await this.request('/auth/logout/', {
                method: 'POST',
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } finally {
            this.clearTokens();
        }
    }

    async getMe() {
        return await this.request('/auth/me/');
    }

    async updateMe(userData) {
        return await this.request('/auth/me/', {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    }

    async changePassword(oldPassword, newPassword) {
        return await this.request('/auth/change-password/', {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                // Required by the serializer; omitting it always returned 400.
                new_password_confirm: newPassword,
            }),
        });
    }

    /**
     * Resolve the signed-in user's own domain profile.
     *
     * Attendance, grades and guardian links are keyed by StudentProfile /
     * ParentProfile UUIDs, not the User UUID held in localStorage.
     */
    async getMyProfile() {
        return await this.request('/enrollment/me/');
    }

    // Academic Years API
    async getAcademicYears() {
        return await this.request('/academics/years/');
    }

    async createAcademicYear(data) {
        return await this.request('/academics/years/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getAcademicYear(id) {
        return await this.request(`/academics/years/${id}/`);
    }

    async updateAcademicYear(id, data) {
        return await this.request(`/academics/years/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteAcademicYear(id) {
        return await this.request(`/academics/years/${id}/`, {
            method: 'DELETE',
        });
    }

    async getActiveAcademicYear() {
        return await this.request('/academics/years/active/');
    }

    // Grade Levels API
    async getGradeLevels(academicYearId = null) {
        const params = academicYearId ? `?academic_year_id=${academicYearId}` : '';
        return await this.request(`/academics/grades/${params}`);
    }

    async createGradeLevel(data) {
        return await this.request('/academics/grades/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getGradeLevel(id) {
        return await this.request(`/academics/grades/${id}/`);
    }

    async updateGradeLevel(id, data) {
        return await this.request(`/academics/grades/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteGradeLevel(id) {
        return await this.request(`/academics/grades/${id}/`, {
            method: 'DELETE',
        });
    }

    // Class Sections API
    async getClassSections(gradeId = null) {
        const params = gradeId ? `?grade_id=${gradeId}` : '';
        return await this.request(`/academics/sections/${params}`);
    }

    async createClassSection(data) {
        return await this.request('/academics/sections/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getClassSection(id) {
        return await this.request(`/academics/sections/${id}/`);
    }

    async updateClassSection(id, data) {
        return await this.request(`/academics/sections/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteClassSection(id) {
        return await this.request(`/academics/sections/${id}/`, {
            method: 'DELETE',
        });
    }

    async getSectionsByGrade(gradeId) {
        return await this.request(`/academics/sections/by-grade/${gradeId}/`);
    }

    // Subjects API
    async getSubjects() {
        return await this.request('/academics/subjects/');
    }

    async createSubject(data) {
        return await this.request('/academics/subjects/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSubject(id) {
        return await this.request(`/academics/subjects/${id}/`);
    }

    async updateSubject(id, data) {
        return await this.request(`/academics/subjects/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteSubject(id) {
        return await this.request(`/academics/subjects/${id}/`, {
            method: 'DELETE',
        });
    }

    // Subject Assignments API
    async getSubjectAssignments(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/academics/assignments/?${params}`);
    }

    async createSubjectAssignment(data) {
        return await this.request('/academics/assignments/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSubjectAssignment(id) {
        return await this.request(`/academics/assignments/${id}/`);
    }

    async deleteSubjectAssignment(id) {
        return await this.request(`/academics/assignments/${id}/`, {
            method: 'DELETE',
        });
    }

    async getTeacherAssignments(teacherId, academicYearId = null) {
        const params = academicYearId ? `?academic_year_id=${academicYearId}` : '';
        return await this.request(`/academics/assignments/teacher/${teacherId}/${params}`);
    }

    async getSectionAssignments(sectionId) {
        return await this.request(`/academics/assignments/section/${sectionId}/`);
    }

    // Student Profiles API
    async getStudentProfiles() {
        return await this.request('/enrollment/students/');
    }

    async createStudentProfile(data) {
        return await this.request('/enrollment/students/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getStudentProfile(id) {
        return await this.request(`/enrollment/students/${id}/`);
    }

    async updateStudentProfile(id, data) {
        return await this.request(`/enrollment/students/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteStudentProfile(id) {
        return await this.request(`/enrollment/students/${id}/`, {
            method: 'DELETE',
        });
    }

    async getStudentsBySection(sectionId) {
        return await this.request(`/enrollment/students/by-section/${sectionId}/`);
    }

    // Teacher Profiles API
    async getTeacherProfiles() {
        return await this.request('/enrollment/teachers/');
    }

    async createTeacherProfile(data) {
        return await this.request('/enrollment/teachers/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTeacherProfile(id) {
        return await this.request(`/enrollment/teachers/${id}/`);
    }

    async updateTeacherProfile(id, data) {
        return await this.request(`/enrollment/teachers/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteTeacherProfile(id) {
        return await this.request(`/enrollment/teachers/${id}/`, {
            method: 'DELETE',
        });
    }

    // Parent Profiles API
    async getParentProfiles() {
        return await this.request('/enrollment/parents/');
    }

    async createParentProfile(data) {
        return await this.request('/enrollment/parents/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getParentProfile(id) {
        return await this.request(`/enrollment/parents/${id}/`);
    }

    async updateParentProfile(id, data) {
        return await this.request(`/enrollment/parents/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteParentProfile(id) {
        return await this.request(`/enrollment/parents/${id}/`, {
            method: 'DELETE',
        });
    }

    // Guardian Links API
    async getGuardianLinks() {
        return await this.request('/enrollment/guardians/');
    }

    async createGuardianLink(data) {
        return await this.request('/enrollment/guardians/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteGuardianLink(id) {
        return await this.request(`/enrollment/guardians/${id}/`, {
            method: 'DELETE',
        });
    }

    async getStudentGuardians(studentId) {
        return await this.request(`/enrollment/guardians/student/${studentId}/`);
    }

    async getParentChildren(parentId) {
        return await this.request(`/enrollment/guardians/parent/${parentId}/`);
    }

    async setPrimaryGuardian(data) {
        return await this.request('/enrollment/guardians/set-primary/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Attendance API
    async getAttendanceRecords(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/attendance/?${params}`);
    }

    async getAttendanceRecord(id) {
        return await this.request(`/attendance/${id}/`);
    }

    async updateAttendanceRecord(id, data) {
        return await this.request(`/attendance/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteAttendanceRecord(id) {
        return await this.request(`/attendance/${id}/`, {
            method: 'DELETE',
        });
    }

    async recordAttendance(data) {
        return await this.request('/attendance/record/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async bulkSubmitAttendance(data) {
        return await this.request('/attendance/bulk-submit/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSubjectDateAttendance(subjectAssignmentId, date) {
        return await this.request(`/attendance/subject/${subjectAssignmentId}/date/${date}/`);
    }

    async getStudentAbsences(studentId, academicYearId = null) {
        const params = academicYearId ? `?academic_year_id=${academicYearId}` : '';
        return await this.request(`/attendance/student/${studentId}/absences/${params}`);
    }

    // Grading API - Assessment Categories
    async getAssessmentCategories(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/grading/categories/?${params}`);
    }

    async createAssessmentCategory(data) {
        return await this.request('/grading/categories/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getAssessmentCategory(id) {
        return await this.request(`/grading/categories/${id}/`);
    }

    async updateAssessmentCategory(id, data) {
        return await this.request(`/grading/categories/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteAssessmentCategory(id) {
        return await this.request(`/grading/categories/${id}/`, {
            method: 'DELETE',
        });
    }

    // Grading API - Grades
    async getGrades(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/grading/grades/?${params}`);
    }

    async getGrade(id) {
        return await this.request(`/grading/grades/${id}/`);
    }

    async updateGrade(id, data) {
        return await this.request(`/grading/grades/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async recordGrade(data) {
        return await this.request('/grading/grades/record/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async bulkSubmitGrades(data) {
        return await this.request('/grading/grades/bulk-submit/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSubjectTotal(studentId, subjectAssignmentId) {
        return await this.request(`/grading/subject-total/${studentId}/${subjectAssignmentId}/`);
    }

    async getReportCard(studentId, academicYearId) {
        return await this.request(`/grading/report-card/${studentId}/${academicYearId}/`);
    }

    async getMyReportCard(academicYearId) {
        return await this.request(`/grading/my-report-card/${academicYearId}/`);
    }
}

// Create global API client instance
const api = new APIClient();
