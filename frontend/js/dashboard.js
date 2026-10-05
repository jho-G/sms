/**
 * Dashboard Logic - Main entry point for authenticated users
 */

// Global state
let currentUser = null;
// The signed-in user's StudentProfile / TeacherProfile / ParentProfile.
// Attendance, grades and guardian links are all keyed by this profile's UUID
// rather than by currentUser.id, so it is resolved once at startup and reused.
let currentProfile = null;
let currentPage = 'dashboard';

/**
 * The caller's own profile UUID, or null for a director (who has none).
 */
function myProfileId() {
    return currentProfile?.id ?? null;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = LOGIN_PAGE;
        return;
    }

    try {
        // Load user data
        const response = await api.getMe();
        if (response.success) {
            currentUser = itemOf(response);
            api.setUser(currentUser);
            await loadMyProfile();
            updateUserUI();
            setupNavigation();
            navigateTo('dashboard');
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        window.location.href = LOGIN_PAGE;
    }
});

/**
 * Resolve the domain profile for the signed-in user.
 *
 * Directors have no profile, and a freshly created account may not have one
 * yet, so a failure here is not fatal - the pages that need it surface their
 * own message.
 */
async function loadMyProfile() {
    if (!currentUser || currentUser.role === 'DIRECTOR') {
        currentProfile = null;
        return;
    }

    try {
        const response = await api.getMyProfile();
        currentProfile = itemOf(response)?.profile ?? null;
    } catch (error) {
        currentProfile = null;
        console.warn('No enrollment profile for this account yet:', error.message);
    }
}

// Update user UI elements
function updateUserUI() {
    if (!currentUser) return;

    const initials = `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}`.toUpperCase();
    const fullName = [currentUser.first_name, currentUser.last_name]
        .filter(Boolean)
        .join(' ') || currentUser.email;

    document.getElementById('user-initials').textContent = initials;
    document.getElementById('user-name').textContent = fullName;
    document.getElementById('user-role').textContent = currentUser.role;
}

// Setup role-based navigation
function setupNavigation() {
    const role = currentUser?.role;

    // Hide all role-specific nav sections
    document.getElementById('nav-director').classList.add('hidden');
    document.getElementById('nav-teacher').classList.add('hidden');
    document.getElementById('nav-student').classList.add('hidden');
    document.getElementById('nav-parent').classList.add('hidden');

    // Show navigation based on role
    switch (role) {
        case 'DIRECTOR':
            document.getElementById('nav-director').classList.remove('hidden');
            break;
        case 'TEACHER':
            document.getElementById('nav-teacher').classList.remove('hidden');
            break;
        case 'STUDENT':
            document.getElementById('nav-student').classList.remove('hidden');
            break;
        case 'PARENT':
            document.getElementById('nav-parent').classList.remove('hidden');
            break;
    }
}

// Navigation
function navigateTo(page) {
    currentPage = page;
    updateActiveNav();
    
    // Load page content
    loadPage(page);
}

function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-indigo-50', 'text-indigo-700');
        item.classList.add('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
    });

    const activeNav = document.querySelector(`[data-page="${currentPage}"]`);
    if (activeNav) {
        activeNav.classList.remove('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
        activeNav.classList.add('bg-indigo-50', 'text-indigo-700');
    }
}

// Load page content
function loadPage(page) {
    const content = document.getElementById('main-content');
    
    // Show loading state
    content.innerHTML = `
        <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
            </div>
        </div>
    `;

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'academic-years': 'Academic Years',
        'grade-levels': 'Grade Levels',
        'sections': 'Class Sections',
        'subjects': 'Subjects',
        'assignments': 'Subject Assignments',
        'students': 'Students',
        'teachers': 'Teachers',
        'parents': 'Parents',
        'guardians': 'Guardian Links',
        'categories': 'Assessment Categories',
        'report-cards': 'Report Cards',
        'my-assignments': 'My Assignments',
        'take-attendance': 'Take Attendance',
        'enter-grades': 'Enter Grades',
        'my-attendance': 'My Attendance',
        'my-grades': 'My Grades',
        'my-report-card': 'Report Card',
        'children': 'My Children',
        'children-attendance': 'Children Attendance',
        'children-grades': 'Children Grades'
    };
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

    // Load page specific content
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'academic-years':
            loadAcademicYearsPage();
            break;
        case 'grade-levels':
            loadGradeLevelsPage();
            break;
        case 'sections':
            loadSectionsPage();
            break;
        case 'subjects':
            loadSubjectsPage();
            break;
        case 'assignments':
            loadAssignmentsPage();
            break;
        case 'students':
            loadStudentsPage();
            break;
        case 'teachers':
            loadTeachersPage();
            break;
        case 'parents':
            loadParentsPage();
            break;
        case 'guardians':
            loadGuardiansPage();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
        case 'report-cards':
            loadReportCardsPage();
            break;
        case 'my-assignments':
            loadMyAssignmentsPage();
            break;
        case 'take-attendance':
            loadTakeAttendancePage();
            break;
        case 'enter-grades':
            loadEnterGradesPage();
            break;
        case 'my-attendance':
            loadMyAttendancePage();
            break;
        case 'my-grades':
            loadMyGradesPage();
            break;
        case 'my-report-card':
            loadMyReportCardPage();
            break;
        case 'children':
            loadChildrenPage();
            break;
        case 'children-attendance':
            loadChildrenAttendancePage();
            break;
        case 'children-grades':
            loadChildrenGradesPage();
            break;
        default:
            loadDashboard();
    }
}

// Load dashboard overview
async function loadDashboard() {
    const content = document.getElementById('main-content');
    const role = currentUser?.role;

    let statsHTML = '';
    let quickActionsHTML = '';

    if (role === 'DIRECTOR') {
        statsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Students</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-students">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Teachers</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-teachers">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Subjects</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-subjects">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Academic Year</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-year">--</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        quickActionsHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onclick="navigateTo('students')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Add Student</span>
                    </button>
                    <button onclick="navigateTo('subjects')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Add Subject</span>
                    </button>
                    <button onclick="navigateTo('assignments')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Assign Teacher</span>
                    </button>
                    <button onclick="navigateTo('report-cards')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Report Cards</span>
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'TEACHER') {
        statsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">My Assignments</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-assignments">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">My Students</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-my-students">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Today's Attendance</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-today-attendance">--</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        quickActionsHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="navigateTo('take-attendance')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Take Attendance</span>
                    </button>
                    <button onclick="navigateTo('enter-grades')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Enter Grades</span>
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'STUDENT') {
        statsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Attendance Rate</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-attendance-rate">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Overall GPA</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-gpa">--</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        quickActionsHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="navigateTo('my-attendance')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">View Attendance</span>
                    </button>
                    <button onclick="navigateTo('my-report-card')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Report Card</span>
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'PARENT') {
        statsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">My Children</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-children">--</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Children Attendance</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-children-attendance">--</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        quickActionsHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="navigateTo('children')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">View Children</span>
                    </button>
                    <button onclick="navigateTo('children-grades')" class="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        <svg class="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">View Grades</span>
                    </button>
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Welcome back, ${escapeHtml(currentUser?.first_name || 'User')}!</h2>
            <p class="text-gray-600 mt-1">Here's what's happening with your school today.</p>
        </div>
        ${statsHTML}
        ${quickActionsHTML}
    `;

    // Load stats
    loadDashboardStats();
}

// Load dashboard statistics
async function loadDashboardStats() {
    const role = currentUser?.role;

    try {
        if (role === 'DIRECTOR') {
            const [students, teachers, subjects, years] = await Promise.all([
                api.getStudentProfiles().catch(() => null),
                api.getTeacherProfiles().catch(() => null),
                api.getSubjects().catch(() => null),
                api.getAcademicYears().catch(() => null),
            ]);

            const countOf = (response) =>
                response?.data?.count ?? listOf(response).length;

            document.getElementById('stat-students').textContent = countOf(students);
            document.getElementById('stat-teachers').textContent = countOf(teachers);
            document.getElementById('stat-subjects').textContent = countOf(subjects);

            const activeYear = listOf(years).find((y) => y.is_active);
            document.getElementById('stat-year').textContent = activeYear?.name || 'None';
        } else if (role === 'TEACHER') {
            const assignments = await api
                .getSubjectAssignments({ teacher_id: currentUser.id })
                .catch(() => null);
            const rows = listOf(assignments);

            document.getElementById('stat-assignments').textContent = rows.length;

            const sectionIds = [...new Set(rows.map((a) => a.section).filter(Boolean))];
            const rosters = await Promise.all(
                sectionIds.map((id) => api.getStudentsBySection(id).catch(() => null))
            );
            const studentIds = new Set(
                rosters.flatMap((r) => listOf(r).map((s) => s.id))
            );
            document.getElementById('stat-my-students').textContent = studentIds.size;

            const today = new Date().toISOString().split('T')[0];
            const todays = await api
                .getAttendanceRecords({ date: today })
                .catch(() => null);
            document.getElementById('stat-today-attendance').textContent =
                todays?.data?.count ?? listOf(todays).length;
        } else if (role === 'STUDENT') {
            const profileId = myProfileId();
            if (!profileId) return;

            const records = listOf(
                await api.getAttendanceRecords({ student_id: profileId }).catch(() => null)
            );
            if (records.length) {
                const present = records.filter(
                    (r) => r.status === 'PRESENT' || r.status === 'LATE'
                ).length;
                const rate = Math.round((present / records.length) * 100);
                document.getElementById('stat-attendance-rate').textContent = `${rate}%`;
            } else {
                document.getElementById('stat-attendance-rate').textContent = 'N/A';
            }

            const activeYear = await api.getActiveAcademicYear().catch(() => null);
            const yearId = itemOf(activeYear)?.id;
            if (yearId) {
                const report = await api.getMyReportCard(yearId).catch(() => null);
                const gpa = itemOf(report)?.overall_gpa;
                document.getElementById('stat-gpa').textContent =
                    gpa !== undefined && gpa !== null ? gpa.toFixed(2) : 'N/A';
            } else {
                document.getElementById('stat-gpa').textContent = 'N/A';
            }
        } else if (role === 'PARENT') {
            const profileId = myProfileId();
            if (!profileId) return;

            const children = listOf(
                await api.getParentChildren(profileId).catch(() => null)
            );
            document.getElementById('stat-children').textContent = children.length;

            const allRecords = await Promise.all(
                children.map((c) =>
                    api.getAttendanceRecords({ student_id: c.student }).catch(() => null)
                )
            );
            const records = allRecords.flatMap((r) => listOf(r));
            if (records.length) {
                const present = records.filter(
                    (r) => r.status === 'PRESENT' || r.status === 'LATE'
                ).length;
                const rate = Math.round((present / records.length) * 100);
                document.getElementById('stat-children-attendance').textContent = `${rate}%`;
            } else {
                document.getElementById('stat-children-attendance').textContent = 'N/A';
            }
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Toggle mobile menu
//
// The sidebar is off-canvas by default and pinned open from the `lg`
// breakpoint up, so toggling only has a visible effect on small screens.
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Logout handler
async function handleLogout() {
    try {
        await api.logout();
    } finally {
        window.location.href = LOGIN_PAGE;
    }
}

// Modal functions
function openModal(title, content) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onclick="closeModal()"></div>
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">${escapeHtml(title)}</h3>
                            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-500">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div id="modal-content">${content}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

// Enhanced Interactive Toast Notification System
function showToast(message, type = 'success', duration = 3500) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item toast-enter pointer-events-auto rounded-xl p-4 text-white shadow-xl flex items-start space-x-3 backdrop-blur-md cursor-pointer select-none';

    // Theme configuration
    const config = {
        success: {
            bg: 'bg-emerald-600/95 border border-emerald-400/30',
            title: 'Success',
            icon: `<svg class="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        },
        error: {
            bg: 'bg-rose-600/95 border border-rose-400/30',
            title: 'Error',
            icon: `<svg class="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        },
        warning: {
            bg: 'bg-amber-600/95 border border-amber-400/30',
            title: 'Warning',
            icon: `<svg class="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`
        },
        info: {
            bg: 'bg-indigo-600/95 border border-indigo-400/30',
            title: 'Notice',
            icon: `<svg class="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        }
    };

    const currentConfig = config[type] || config.info;
    toast.className += ` ${currentConfig.bg}`;

    toast.innerHTML = `
        <div class="mt-0.5">${currentConfig.icon}</div>
        <div class="flex-1 min-w-0 pr-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-white/80">${currentConfig.title}</p>
            <p class="text-sm font-medium leading-snug break-words">${escapeHtml(message)}</p>
        </div>
        <button type="button" aria-label="Dismiss notification" class="toast-close text-white/70 hover:text-white transition p-1 -mr-1 rounded-lg hover:bg-white/10">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
        <div class="toast-progress"></div>
    `;

    toastContainer.appendChild(toast);

    // Smooth entrance
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-active');
    });

    const progressBar = toast.querySelector('.toast-progress');
    let remainingTime = duration;
    let startTime = Date.now();
    let isPaused = false;
    let timerId = null;

    const startTimer = () => {
        startTime = Date.now();
        progressBar.style.transition = `width ${remainingTime}ms linear`;
        progressBar.style.width = '0%';
        timerId = setTimeout(dismissToast, remainingTime);
    };

    const pauseTimer = () => {
        if (isPaused) return;
        isPaused = true;
        clearTimeout(timerId);
        const elapsed = Date.now() - startTime;
        remainingTime = Math.max(0, remainingTime - elapsed);
        const computedWidth = window.getComputedStyle(progressBar).width;
        progressBar.style.transition = 'none';
        progressBar.style.width = computedWidth;
    };

    const resumeTimer = () => {
        if (!isPaused || remainingTime <= 0) return;
        isPaused = false;
        startTimer();
    };

    function dismissToast() {
        clearTimeout(timerId);
        toast.classList.remove('toast-active');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 260);
    }

    // Interactive pause on hover, resume on leave
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);

    // Manual close button
    toast.querySelector('.toast-close').addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToast();
    });

    startTimer();
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
