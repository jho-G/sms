/**
 * Enrollment Management - Students, Teachers, Parents, Guardians
 */

// ============================================================
// Students
// ============================================================

async function loadStudentsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Students</h2>
                <p class="text-gray-600 mt-1">Manage student profiles and enrollment</p>
            </div>
            <button onclick="showCreateStudentModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Student
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center space-x-4">
                    <input type="text" id="student-search" placeholder="Search students..." 
                        class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        oninput="filterStudents(this.value)">
                    <select id="student-section-filter" onchange="filterStudentsBySection(this.value)"
                        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">All Sections</option>
                    </select>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="students-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center">
                                <div class="animate-pulse text-gray-500">Loading...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadStudentsList();
    loadSectionsForFilter('student-section-filter');
}

async function loadStudentsList() {
    try {
        const response = await api.getStudentProfiles();
        const students = response.data?.results || response.data || [];
        
        window.allStudents = students;
        renderStudentsTable(students);
    } catch (error) {
        showToast(error.message || 'Failed to load students', 'error');
    }
}

function renderStudentsTable(students) {
    const table = document.getElementById('students-table');
    
    if (students.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <p class="text-sm text-gray-500">No students found</p>
                    <button onclick="showCreateStudentModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Student</button>
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-mono text-gray-900">${student.student_id}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-600">${(student.user_name || 'U').charAt(0)}</span>
                    </div>
                    <div class="ml-3">
                        <div class="text-sm font-medium text-gray-900">${student.user_name || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${student.user_email || '--'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${student.section_name || 'Unassigned'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatDate(student.enrollment_date)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewStudent('${student.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                <button onclick="deleteStudent('${student.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterStudents(query) {
    if (!window.allStudents) return;
    
    const filtered = window.allStudents.filter(student => {
        const searchStr = `${student.student_id} ${student.user_name} ${student.user_email}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
    });
    
    renderStudentsTable(filtered);
}

function showCreateStudentModal() {
    const content = `
        <form id="create-student-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" id="student-firstname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" id="student-lastname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="student-email" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Student ID</label>
                <input type="text" id="student-id" required placeholder="e.g., STU001"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Section</label>
                <select id="student-section"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select section</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" id="student-dob" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Guardian Contact</label>
                <input type="tel" id="student-guardian-contact"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="student-password" required minlength="8"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Add New Student', content);
    loadSectionsForSelect('student-section');
    
    document.getElementById('create-student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            // First register the user
            const registerResponse = await api.register({
                email: document.getElementById('student-email').value,
                username: document.getElementById('student-email').value.split('@')[0],
                first_name: document.getElementById('student-firstname').value,
                last_name: document.getElementById('student-lastname').value,
                role: 'STUDENT',
                password: document.getElementById('student-password').value,
                password_confirm: document.getElementById('student-password').value
            });
            
            if (registerResponse.success) {
                // Then create the profile
                await api.createStudentProfile({
                    user: registerResponse.data.user.id,
                    student_id: document.getElementById('student-id').value,
                    section: document.getElementById('student-section').value || null,
                    date_of_birth: document.getElementById('student-dob').value,
                    guardian_contact: document.getElementById('student-guardian-contact').value
                });
                
                closeModal();
                showToast('Student created successfully');
                loadStudentsList();
            }
        } catch (error) {
            showToast(error.message || 'Failed to create student', 'error');
        }
    });
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
        await api.deleteStudentProfile(id);
        showToast('Student deleted successfully');
        loadStudentsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete student', 'error');
    }
}

async function viewStudent(id) {
    try {
        const response = await api.getStudentProfile(id);
        const student = response.data;
        
        const content = `
            <div class="space-y-3">
                <div><span class="font-medium text-gray-700">Name:</span> ${student.user_name || 'N/A'}</div>
                <div><span class="font-medium text-gray-700">Student ID:</span> ${student.student_id || '--'}</div>
                <div><span class="font-medium text-gray-700">Section:</span> ${student.section_name || '--'}</div>
                <div><span class="font-medium text-gray-700">Date of Birth:</span> ${formatDate(student.date_of_birth)}</div>
                <div><span class="font-medium text-gray-700">Phone:</span> ${student.phone_number || '--'}</div>
                <div><span class="font-medium text-gray-700">Address:</span> ${student.address || '--'}</div>
                <div class="flex justify-end pt-4">
                    <button onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                </div>
            </div>
        `;
        
        openModal('Student Details', content);
    } catch (error) {
        showToast(error.message || 'Failed to load student', 'error');
    }
}

// ============================================================
// Teachers
// ============================================================

async function loadTeachersPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Teachers</h2>
                <p class="text-gray-600 mt-1">Manage teacher profiles</p>
            </div>
            <button onclick="showCreateTeacherModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Teacher
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialization</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="teachers-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center">
                                <div class="animate-pulse text-gray-500">Loading...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadTeachersList();
}

async function loadTeachersList() {
    try {
        const response = await api.getTeacherProfiles();
        const teachers = response.data?.results || response.data || [];
        
        const table = document.getElementById('teachers-table');
        
        if (teachers.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No teachers found</p>
                        <button onclick="showCreateTeacherModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Teacher</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = teachers.map(teacher => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-mono text-gray-900">${teacher.employee_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-medium text-green-600">${(teacher.user_name || 'T').charAt(0)}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${teacher.user_name || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${teacher.department || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${teacher.specialization || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewTeacher('${teacher.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    <button onclick="deleteTeacher('${teacher.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load teachers', 'error');
    }
}

function showCreateTeacherModal() {
    const content = `
        <form id="create-teacher-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" id="teacher-firstname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" id="teacher-lastname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="teacher-email" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Employee ID</label>
                <input type="text" id="teacher-employee-id" required placeholder="e.g., TCH001"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Department</label>
                <input type="text" id="teacher-department" placeholder="e.g., Science"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Specialization</label>
                <input type="text" id="teacher-specialization" placeholder="e.g., Mathematics"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Qualification</label>
                <input type="text" id="teacher-qualification" placeholder="e.g., M.Sc."
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="teacher-password" required minlength="8"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Add New Teacher', content);
    
    document.getElementById('create-teacher-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const registerResponse = await api.register({
                email: document.getElementById('teacher-email').value,
                username: document.getElementById('teacher-email').value.split('@')[0],
                first_name: document.getElementById('teacher-firstname').value,
                last_name: document.getElementById('teacher-lastname').value,
                role: 'TEACHER',
                password: document.getElementById('teacher-password').value,
                password_confirm: document.getElementById('teacher-password').value
            });
            
            if (registerResponse.success) {
                await api.createTeacherProfile({
                    user: registerResponse.data.user.id,
                    employee_id: document.getElementById('teacher-employee-id').value,
                    department: document.getElementById('teacher-department').value,
                    specialization: document.getElementById('teacher-specialization').value,
                    qualification: document.getElementById('teacher-qualification').value
                });
                
                closeModal();
                showToast('Teacher created successfully');
                loadTeachersList();
            }
        } catch (error) {
            showToast(error.message || 'Failed to create teacher', 'error');
        }
    });
}

async function deleteTeacher(id) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
        await api.deleteTeacherProfile(id);
        showToast('Teacher deleted successfully');
        loadTeachersList();
    } catch (error) {
        showToast(error.message || 'Failed to delete teacher', 'error');
    }
}

async function viewTeacher(id) {
    try {
        const response = await api.getTeacherProfile(id);
        const teacher = response.data;
        
        const content = `
            <div class="space-y-3">
                <div><span class="font-medium text-gray-700">Name:</span> ${teacher.user_name || teacher.employee_id}</div>
                <div><span class="font-medium text-gray-700">Employee ID:</span> ${teacher.employee_id || '--'}</div>
                <div><span class="font-medium text-gray-700">Department:</span> ${teacher.department || '--'}</div>
                <div><span class="font-medium text-gray-700">Qualification:</span> ${teacher.qualification || '--'}</div>
                <div><span class="font-medium text-gray-700">Phone:</span> ${teacher.phone_number || '--'}</div>
                <div class="flex justify-end pt-4">
                    <button onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                </div>
            </div>
        `;
        
        openModal('Teacher Details', content);
    } catch (error) {
        showToast(error.message || 'Failed to load teacher', 'error');
    }
}

// ============================================================
// Parents
// ============================================================

async function loadParentsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Parents</h2>
                <p class="text-gray-600 mt-1">Manage parent profiles</p>
            </div>
            <button onclick="showCreateParentModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Parent
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupation</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="parents-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center">
                                <div class="animate-pulse text-gray-500">Loading...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadParentsList();
}

async function loadParentsList() {
    try {
        const response = await api.getParentProfiles();
        const parents = response.data?.results || response.data || [];
        
        const table = document.getElementById('parents-table');
        
        if (parents.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No parents found</p>
                        <button onclick="showCreateParentModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Parent</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = parents.map(parent => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-medium text-purple-600">${(parent.user_name || 'P').charAt(0)}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${parent.user_name || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${parent.user_email || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${parent.occupation || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${parent.secondary_phone || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewParent('${parent.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    <button onclick="deleteParent('${parent.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load parents', 'error');
    }
}

function showCreateParentModal() {
    const content = `
        <form id="create-parent-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" id="parent-firstname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" id="parent-lastname" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="parent-email" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Occupation</label>
                <input type="text" id="parent-occupation"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Address</label>
                <textarea id="parent-address" rows="2"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Secondary Phone</label>
                <input type="tel" id="parent-phone"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="parent-password" required minlength="8"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Add New Parent', content);
    
    document.getElementById('create-parent-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const registerResponse = await api.register({
                email: document.getElementById('parent-email').value,
                username: document.getElementById('parent-email').value.split('@')[0],
                first_name: document.getElementById('parent-firstname').value,
                last_name: document.getElementById('parent-lastname').value,
                role: 'PARENT',
                password: document.getElementById('parent-password').value,
                password_confirm: document.getElementById('parent-password').value
            });
            
            if (registerResponse.success) {
                await api.createParentProfile({
                    user: registerResponse.data.user.id,
                    occupation: document.getElementById('parent-occupation').value,
                    address: document.getElementById('parent-address').value,
                    secondary_phone: document.getElementById('parent-phone').value
                });
                
                closeModal();
                showToast('Parent created successfully');
                loadParentsList();
            }
        } catch (error) {
            showToast(error.message || 'Failed to create parent', 'error');
        }
    });
}

async function deleteParent(id) {
    if (!confirm('Are you sure you want to delete this parent?')) return;
    
    try {
        await api.deleteParentProfile(id);
        showToast('Parent deleted successfully');
        loadParentsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete parent', 'error');
    }
}async function viewParent(id) {
    try {
        const response = await api.getParentProfile(id);
        const parent = response.data;
        
        const content = `
            <div class="space-y-3">
                <div><span class="font-medium text-gray-700">Name:</span> ${parent.user_name || 'N/A'}</div>
                <div><span class="font-medium text-gray-700">Relationship:</span> ${parent.relationship || '--'}</div>
                <div><span class="font-medium text-gray-700">Phone:</span> ${parent.phone_number || '--'}</div>
                <div><span class="font-medium text-gray-700">Email:</span> ${parent.email || '--'}</div>
                <div><span class="font-medium text-gray-700">Address:</span> ${parent.address || '--'}</div>
                <div class="flex justify-end pt-4">
                    <button onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                </div>
            </div>
        `;
        
        openModal('Parent Details', content);
    } catch (error) {
        showToast(error.message || 'Failed to load parent', 'error');
    }
}

// ============================================================

// Guardians
// ============================================================

async function loadGuardiansPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Guardian Links</h2>
                <p class="text-gray-600 mt-1">Link parents to students</p>
            </div>
            <button onclick="showCreateGuardianModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Guardian Link
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Relationship</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="guardians-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center">
                                <div class="animate-pulse text-gray-500">Loading...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadGuardiansList();
}

async function loadGuardiansList() {
    try {
        const response = await api.getGuardianLinks();
        const guardians = response.data?.results || response.data || [];
        
        const table = document.getElementById('guardians-table');
        
        if (guardians.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No guardian links found</p>
                        <button onclick="showCreateGuardianModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Guardian Link</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = guardians.map(guardian => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${guardian.student_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${guardian.parent_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${guardian.relationship || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${guardian.is_primary 
                        ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Primary</span>'
                        : '<span class="text-sm text-gray-500">--</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteGuardian('${guardian.id}')" class="text-red-600 hover:text-red-900">Unlink</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load guardians', 'error');
    }
}

function showCreateGuardianModal() {
    const content = `
        <form id="create-guardian-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Student</label>
                <select id="guardian-student" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select student</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Parent</label>
                <select id="guardian-parent" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select parent</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Relationship</label>
                <select id="guardian-relationship" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="GUARDIAN">Guardian</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="guardian-primary" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                <label for="guardian-primary" class="ml-2 text-sm text-gray-700">Set as primary guardian</label>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Add Guardian Link', content);
    loadStudentsForGuardianSelect('guardian-student');
    loadParentsForGuardianSelect('guardian-parent');
    
    document.getElementById('create-guardian-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createGuardianLink({
                student: document.getElementById('guardian-student').value,
                parent: document.getElementById('guardian-parent').value,
                relationship: document.getElementById('guardian-relationship').value,
                is_primary: document.getElementById('guardian-primary').checked
            });
            closeModal();
            showToast('Guardian link created successfully');
            loadGuardiansList();
        } catch (error) {
            showToast(error.message || 'Failed to create guardian link', 'error');
        }
    });
}

async function deleteGuardian(id) {
    if (!confirm('Are you sure you want to remove this guardian link?')) return;
    
    try {
        await api.deleteGuardianLink(id);
        showToast('Guardian link removed successfully');
        loadGuardiansList();
    } catch (error) {
        showToast(error.message || 'Failed to remove guardian link', 'error');
    }
}

// ============================================================
// Helper Functions
// ============================================================

async function loadStudentsForGuardianSelect(selectId) {
    try {
        const response = await api.getStudentProfiles();
        const students = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.user_name || 'Student'} (${student.student_id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

async function loadParentsForGuardianSelect(selectId) {
    try {
        const response = await api.getParentProfiles();
        const parents = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        parents.forEach(parent => {
            const option = document.createElement('option');
            option.value = parent.id;
            option.textContent = parent.user_name || 'Parent';
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load parents:', error);
    }
}

async function loadSectionsForFilter(selectId) {
    try {
        const response = await api.getClassSections();
        const sections = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = `${section.grade_level_name || ''} - Section ${section.name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load sections:', error);
    }
}

function filterStudentsBySection(sectionId) {
    if (!window.allStudents) return;
    
    if (!sectionId) {
        renderStudentsTable(window.allStudents);
        return;
    }
    
    const filtered = window.allStudents.filter(student => student.section === sectionId);
    renderStudentsTable(filtered);
}
