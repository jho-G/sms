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
            setupGlobalKeyboardShortcuts();
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

// ============================================================
// Interactive Live Table Search & Filtering System
// ============================================================
function initTableSearchFilter(inputId, tbodyId, countBadgeId = null) {
    const input = document.getElementById(inputId);
    const tbody = document.getElementById(tbodyId);
    if (!input || !tbody) return;

    const performFilter = () => {
        const query = input.value.toLowerCase().trim();
        const rows = Array.from(tbody.querySelectorAll('tr:not(.table-no-results)'));
        let visibleCount = 0;

        rows.forEach(row => {
            if (row.querySelector('td[colspan]')) return;
            const text = row.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        if (countBadgeId) {
            const badge = document.getElementById(countBadgeId);
            if (badge) {
                const total = rows.filter(r => !r.querySelector('td[colspan]')).length;
                badge.textContent = query ? `Showing ${visibleCount} of ${total}` : `${total} total`;
            }
        }

        let noResultsRow = tbody.querySelector('.table-no-results');
        const dataRows = rows.filter(r => !r.querySelector('td[colspan]'));
        if (dataRows.length > 0 && visibleCount === 0 && query) {
            if (!noResultsRow) {
                const colCount = rows[0]?.children.length || 5;
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'table-no-results';
                noResultsRow.innerHTML = `
                    <td colspan="${colCount}" class="px-6 py-8 text-center text-gray-500">
                        <p class="text-sm font-medium">No results matching "${escapeHtml(query)}"</p>
                        <button type="button" class="mt-2 text-xs text-indigo-600 hover:text-indigo-500 font-medium underline clear-search-btn">Clear search</button>
                    </td>
                `;
                tbody.appendChild(noResultsRow);
                noResultsRow.querySelector('.clear-search-btn').addEventListener('click', () => {
                    input.value = '';
                    performFilter();
                    input.focus();
                });
            }
        } else if (noResultsRow) {
            noResultsRow.remove();
        }
    };

    input.addEventListener('input', performFilter);
}

// ============================================================
// Interactive Table Column Sorting System
// ============================================================
function makeTableSortable(tableIdOrElement) {
    const table = typeof tableIdOrElement === 'string' 
        ? document.getElementById(tableIdOrElement) 
        : tableIdOrElement;
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    const headers = thead.querySelectorAll('th');
    headers.forEach((th, colIdx) => {
        const text = th.textContent.trim().toLowerCase();
        // Skip action columns and inputs
        if (text === 'actions' || text === '' || th.classList.contains('no-sort')) return;

        th.classList.add('sortable');
        if (!th.querySelector('.sort-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator';
            indicator.innerHTML = '⇅';
            th.appendChild(indicator);
        }

        th.onclick = () => {
            const currentDir = th.getAttribute('data-sort-dir');
            const newDir = currentDir === 'asc' ? 'desc' : 'asc';

            // Reset other headers in this table
            headers.forEach(otherTh => {
                if (otherTh !== th) {
                    otherTh.removeAttribute('data-sort-dir');
                    otherTh.classList.remove('sort-asc', 'sort-desc');
                    const ind = otherTh.querySelector('.sort-indicator');
                    if (ind) ind.innerHTML = '⇅';
                }
            });

            th.setAttribute('data-sort-dir', newDir);
            th.classList.remove('sort-asc', 'sort-desc');
            th.classList.add(newDir === 'asc' ? 'sort-asc' : 'sort-desc');
            const ind = th.querySelector('.sort-indicator');
            if (ind) ind.innerHTML = newDir === 'asc' ? '▲' : '▼';

            sortTableByColumn(tbody, colIdx, newDir);
        };
    });
}

function sortTableByColumn(tbody, colIdx, direction) {
    const rows = Array.from(tbody.querySelectorAll('tr:not(.table-no-results)'));
    if (rows.length <= 1) return;

    const sortableRows = rows.filter(r => !r.querySelector('td[colspan]'));
    if (sortableRows.length <= 1) return;

    sortableRows.sort((rowA, rowB) => {
        const cellA = (rowA.children[colIdx]?.innerText || rowA.children[colIdx]?.textContent || '').trim();
        const cellB = (rowB.children[colIdx]?.innerText || rowB.children[colIdx]?.textContent || '').trim();

        // Check for numeric values
        const cleanA = cellA.replace(/[^0-9.-]/g, '');
        const cleanB = cellB.replace(/[^0-9.-]/g, '');
        const numA = parseFloat(cleanA);
        const numB = parseFloat(cleanB);
        const isNumeric = cleanA !== '' && cleanB !== '' && !isNaN(numA) && !isNaN(numB);

        let comparison = 0;
        if (isNumeric) {
            comparison = numA - numB;
        } else {
            // Check for valid date
            const dateA = Date.parse(cellA);
            const dateB = Date.parse(cellB);
            if (!isNaN(dateA) && !isNaN(dateB) && isNaN(cellA) && isNaN(cellB)) {
                comparison = dateA - dateB;
            } else {
                comparison = cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' });
            }
        }

        return direction === 'asc' ? comparison : -comparison;
    });

    sortableRows.forEach(row => tbody.appendChild(row));
}

// ============================================================
// Global Command Palette & Keyboard Shortcuts System
// ============================================================
let isCommandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
let filteredPaletteItems = [];

function getAvailablePaletteItems() {
    const role = currentUser?.role;
    const items = [
        { title: 'Dashboard Overview', category: 'Navigation', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', action: () => navigateTo('dashboard') },
    ];

    if (role === 'DIRECTOR') {
        items.push(
            { title: 'Students Directory', category: 'Enrollment', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', action: () => navigateTo('students') },
            { title: 'Teachers Directory', category: 'Enrollment', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', action: () => navigateTo('teachers') },
            { title: 'Parents Directory', category: 'Enrollment', icon: 'M17 20h5v-2a3 3 0 00-3-3h-1m-5 5v-2a3 3 0 00-3-3H4a3 3 0 00-3 3v2h14zM9 7a3 3 0 116 0 3 3 0 01-6 0z', action: () => navigateTo('parents') },
            { title: 'Academic Years', category: 'Academics', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => navigateTo('academic-years') },
            { title: 'Grade Levels', category: 'Academics', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', action: () => navigateTo('grade-levels') },
            { title: 'Class Sections', category: 'Academics', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', action: () => navigateTo('sections') },
            { title: 'Subjects', category: 'Academics', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', action: () => navigateTo('subjects') },
            { title: 'Subject Assignments', category: 'Academics', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', action: () => navigateTo('assignments') },
            { title: 'Assessment Categories', category: 'Grading', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', action: () => navigateTo('categories') },
            { title: 'Report Cards Center', category: 'Grading', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => navigateTo('report-cards') },
            { title: 'Add New Student', category: 'Quick Action', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', action: () => { navigateTo('students'); setTimeout(() => openStudentModal(), 150); } },
            { title: 'Add New Subject', category: 'Quick Action', icon: 'M12 4v16m8-8H4', action: () => { navigateTo('subjects'); setTimeout(() => openSubjectModal(), 150); } }
        );
    }

    if (role === 'TEACHER') {
        items.push(
            { title: 'My Teaching Assignments', category: 'Teaching', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', action: () => navigateTo('my-assignments') },
            { title: 'Take Daily Attendance', category: 'Teaching', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => navigateTo('take-attendance') },
            { title: 'Enter Class Grades', category: 'Teaching', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', action: () => navigateTo('enter-grades') },
            { title: 'Grading Categories', category: 'Teaching', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', action: () => navigateTo('categories') }
        );
    }

    if (role === 'STUDENT') {
        items.push(
            { title: 'My Attendance Record', category: 'My Info', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => navigateTo('my-attendance') },
            { title: 'My Subject Grades', category: 'My Info', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', action: () => navigateTo('my-grades') },
            { title: 'My Official Report Card', category: 'My Info', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => navigateTo('my-report-card') }
        );
    }

    if (role === 'PARENT') {
        items.push(
            { title: 'My Children', category: 'Family', icon: 'M17 20h5v-2a3 3 0 00-3-3h-1m-5 5v-2a3 3 0 00-3-3H4a3 3 0 00-3 3v2h14zM9 7a3 3 0 116 0 3 3 0 01-6 0z', action: () => navigateTo('children') },
            { title: 'Children Attendance', category: 'Family', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => navigateTo('children-attendance') },
            { title: 'Children Grades', category: 'Family', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', action: () => navigateTo('children-grades') }
        );
    }

    // General commands
    items.push(
        { title: 'Keyboard Shortcuts Help', category: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', action: () => showKeyboardShortcutsModal() },
        { title: 'Refresh Active View', category: 'System', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', action: () => { loadPage(currentPage); showToast('View refreshed', 'info'); } },
        { title: 'Log Out of Account', category: 'Account', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', action: () => handleLogout() }
    );

    return items;
}

function openCommandPalette() {
    isCommandPaletteOpen = true;
    commandPaletteSelectedIndex = 0;
    const allItems = getAvailablePaletteItems();
    filteredPaletteItems = allItems;

    const container = document.getElementById('command-palette-container');
    container.innerHTML = `
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 transition-opacity animate-fadeIn" onclick="closeCommandPalette()">
            <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden transform transition-all animate-slideIn" onclick="event.stopPropagation()">
                <!-- Input Header -->
                <div class="relative flex items-center px-4 py-3.5 border-b border-gray-100">
                    <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input type="text" id="palette-search-input" 
                        class="w-full text-base bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none" 
                        placeholder="Search commands, pages, or actions..." 
                        autocomplete="off" />
                    <button onclick="closeCommandPalette()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                        <span class="text-xs font-semibold px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">ESC</span>
                    </button>
                </div>

                <!-- Results List -->
                <div id="palette-results-list" class="max-h-80 overflow-y-auto p-2 divide-y divide-gray-50">
                    ${renderPaletteItemsHtml(filteredPaletteItems, 0)}
                </div>

                <!-- Footer Tips -->
                <div class="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div class="flex items-center space-x-3">
                        <span><kbd class="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">↓</kbd> to navigate</span>
                        <span><kbd class="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">↵</kbd> to select</span>
                    </div>
                    <span>SMS Spotlight</span>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('palette-search-input');
    searchInput.focus();

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filteredPaletteItems = allItems.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.category.toLowerCase().includes(query)
        );
        commandPaletteSelectedIndex = 0;
        updatePaletteResultsUI();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filteredPaletteItems.length > 0) {
                commandPaletteSelectedIndex = (commandPaletteSelectedIndex + 1) % filteredPaletteItems.length;
                updatePaletteResultsUI();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filteredPaletteItems.length > 0) {
                commandPaletteSelectedIndex = (commandPaletteSelectedIndex - 1 + filteredPaletteItems.length) % filteredPaletteItems.length;
                updatePaletteResultsUI();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredPaletteItems[commandPaletteSelectedIndex]) {
                executePaletteItem(commandPaletteSelectedIndex);
            }
        }
    });
}

function updatePaletteResultsUI() {
    const list = document.getElementById('palette-results-list');
    if (list) {
        list.innerHTML = renderPaletteItemsHtml(filteredPaletteItems, commandPaletteSelectedIndex);
        // Scroll active item into view
        const activeElem = list.querySelector('.palette-item-selected');
        if (activeElem) {
            activeElem.scrollIntoView({ block: 'nearest' });
        }
    }
}

function renderPaletteItemsHtml(items, selectedIdx) {
    if (items.length === 0) {
        return `
            <div class="py-8 text-center text-gray-400">
                <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm font-medium">No matching pages or actions found</p>
            </div>
        `;
    }

    return items.map((item, idx) => {
        const isSelected = idx === selectedIdx;
        return `
            <div onclick="executePaletteItem(${idx})" 
                 class="palette-item ${isSelected ? 'palette-item-selected bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'} flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition select-none group">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                        </svg>
                    </div>
                    <span class="text-sm font-medium truncate">${escapeHtml(item.title)}</span>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium ${isSelected ? 'bg-indigo-200/60 text-indigo-800' : 'bg-gray-100 text-gray-500'}">
                    ${escapeHtml(item.category)}
                </span>
            </div>
        `;
    }).join('');
}

function executePaletteItem(index) {
    const item = filteredPaletteItems[index];
    if (item && typeof item.action === 'function') {
        closeCommandPalette();
        item.action();
    }
}

function closeCommandPalette() {
    isCommandPaletteOpen = false;
    const container = document.getElementById('command-palette-container');
    if (container) {
        container.innerHTML = '';
    }
}

function showKeyboardShortcutsModal() {
    const shortcuts = [
        { key: 'Ctrl + K / ⌘ + K', desc: 'Open Command Palette & Quick Navigation' },
        { key: '/', desc: 'Instant search across system' },
        { key: 'Esc', desc: 'Close any active modal, dialog, or search' },
        { key: '?', desc: 'Show this keyboard shortcuts guide' },
        { key: 'Tab / Shift + Tab', desc: 'Navigate between form inputs and buttons' },
        { key: 'Enter', desc: 'Execute highlighted command or submit form' }
    ];

    const content = `
        <div class="space-y-4">
            <p class="text-sm text-gray-600">Quickly navigate the Student Management System with keyboard shortcuts:</p>
            <div class="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                ${shortcuts.map(s => `
                    <div class="flex items-center justify-between px-4 py-3 bg-white">
                        <span class="text-sm text-gray-700 font-medium">${escapeHtml(s.desc)}</span>
                        <kbd class="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded border border-gray-300 shadow-2xs">${escapeHtml(s.key)}</kbd>
                    </div>
                `).join('')}
            </div>
            <div class="pt-2 flex justify-end">
                <button type="button" onclick="closeModal()" class="btn btn-primary px-4 py-2 text-sm">
                    Got it
                </button>
            </div>
        </div>
    `;

    openModal('Keyboard Shortcuts', content);
}

function setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Cmd+K or Ctrl+K -> Command Palette
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (isCommandPaletteOpen) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
            return;
        }

        // Escape key -> close palette or modal
        if (e.key === 'Escape') {
            if (isCommandPaletteOpen) {
                closeCommandPalette();
                return;
            }
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer && modalContainer.children.length > 0) {
                closeModal();
                return;
            }
        }

        // If user is currently typing in an input/textarea/select, don't hijack simple keys
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            return;
        }

        // "/" key -> open quick search
        if (e.key === '/') {
            e.preventDefault();
            openCommandPalette();
            return;
        }

        // "?" key -> show keyboard shortcuts help
        if (e.key === '?') {
            e.preventDefault();
            showKeyboardShortcutsModal();
            return;
        }
    });
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
