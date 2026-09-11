/**
 * Attendance Management - Take and View Attendance
 */

// ============================================================
// Take Attendance (Teacher)
// ============================================================

async function loadTakeAttendancePage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">Take Attendance</h2>
            <p class="text-gray-600 mt-1">Record student attendance for your classes</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Assignment</label>
                    <select id="attendance-assignment" onchange="loadStudentsForAttendance()"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select assignment</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="attendance-date" value="${new Date().toISOString().split('T')[0]}"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div class="flex items-end">
                    <button onclick="submitBulkAttendance()" 
                        class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Submit Attendance
                    </button>
                </div>
            </div>

            <div id="attendance-students" class="hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody id="attendance-students-table" class="bg-white divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    await loadTeacherAssignmentsForAttendance();
}

async function loadTeacherAssignmentsForAttendance() {
    try {
        const user = api.getUser();
        if (!user) return;
        
        const response = await api.getSubjectAssignments({ teacher_id: user.id });
        const assignments = response.data?.results || response.data || [];
        
        const select = document.getElementById('attendance-assignment');
        assignments.forEach(assignment => {
            const option = document.createElement('option');
            option.value = assignment.id;
            option.textContent = `${assignment.subject_name} - ${assignment.section_name}`;
            select.appendChild(option);
        });
    } catch (error) {
        showToast(error.message || 'Failed to load assignments', 'error');
    }
}

async function loadStudentsForAttendance() {
    const assignmentId = document.getElementById('attendance-assignment').value;
    if (!assignmentId) {
        document.getElementById('attendance-students').classList.add('hidden');
        return;
    }

    try {
        // Get assignment details to find section
        const assignment = await api.getSubjectAssignment(assignmentId);
        const sectionId = assignment.data?.section;
        
        if (!sectionId) {
            showToast('No section found for this assignment', 'error');
            return;
        }

        const studentsResponse = await api.getStudentsBySection(sectionId);
        const students = studentsResponse.data?.results || studentsResponse.data || [];
        
        const table = document.getElementById('attendance-students-table');
        document.getElementById('attendance-students').classList.remove('hidden');
        
        table.innerHTML = students.map(student => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${student.user_name || 'Student'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${student.student_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex justify-center space-x-2">
                        <label class="inline-flex items-center">
                            <input type="radio" name="status-${student.id}" value="PRESENT" checked class="text-green-600 focus:ring-green-500">
                            <span class="ml-1 text-xs text-green-600">Present</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="status-${student.id}" value="ABSENT" class="text-red-600 focus:ring-red-500">
                            <span class="ml-1 text-xs text-red-600">Absent</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="status-${student.id}" value="LATE" class="text-yellow-600 focus:ring-yellow-500">
                            <span class="ml-1 text-xs text-yellow-600">Late</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="status-${student.id}" value="EXCUSED" class="text-blue-600 focus:ring-blue-500">
                            <span class="ml-1 text-xs text-blue-600">Excused</span>
                        </label>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="text" id="remark-${student.id}" placeholder="Optional remark"
                        class="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
                </td>
            </tr>
        `).join('');
        
        window.currentAttendanceStudents = students;
    } catch (error) {
        showToast(error.message || 'Failed to load students', 'error');
    }
}

async function submitBulkAttendance() {
    const assignmentId = document.getElementById('attendance-assignment').value;
    const date = document.getElementById('attendance-date').value;
    const students = window.currentAttendanceStudents;

    if (!assignmentId || !date || !students || students.length === 0) {
        showToast('Please select an assignment and date', 'error');
        return;
    }

    const records = students.map(student => ({
        student_id: student.id,
        status: document.querySelector(`input[name="status-${student.id}"]:checked`).value,
        remarks: document.getElementById(`remark-${student.id}`).value
    }));

    try {
        await api.bulkSubmitAttendance({
            subject_assignment_id: assignmentId,
            date: date,
            records: records
        });
        showToast('Attendance submitted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to submit attendance', 'error');
    }
}

// ============================================================
// View Attendance (All Roles)
// ============================================================

async function loadMyAttendancePage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">My Attendance</h2>
            <p class="text-gray-600 mt-1">View your attendance records</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                    </thead>
                    <tbody id="my-attendance-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="4" class="px-6 py-12 text-center">
                                <div class="animate-pulse text-gray-500">Loading...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadMyAttendanceList();
}

async function loadMyAttendanceList() {
    try {
        const user = api.getUser();
        const response = await api.getAttendanceRecords({ student_id: user?.id });
        const records = response.data?.results || response.data || [];
        
        const table = document.getElementById('my-attendance-table');
        
        if (records.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No attendance records found</p>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = records.map(record => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(record.date)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${record.subject_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${getStatusBadge(record.status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${record.remarks || '--'}</div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load attendance records', 'error');
    }
}

function getStatusBadge(status) {
    const badges = {
        'PRESENT': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Present</span>',
        'ABSENT': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Absent</span>',
        'LATE': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Late</span>',
        'EXCUSED': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Excused</span>'
    };
    return badges[status] || status;
}

// ============================================================
// Children Attendance (Parent)
// ============================================================

async function loadChildrenAttendancePage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">Children Attendance</h2>
            <p class="text-gray-600 mt-1">View attendance for your children</p>
        </div>

        <div id="children-attendance-content">
            <div class="animate-pulse text-gray-500 text-center py-12">Loading...</div>
        </div>
    `;

    await loadChildrenAttendanceList();
}

async function loadChildrenAttendanceList() {
    try {
        const user = api.getUser();
        const childrenResponse = await api.getParentChildren(user?.id);
        const children = childrenResponse.data?.results || childrenResponse.data || [];
        
        const container = document.getElementById('children-attendance-content');
        
        if (children.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">No children found linked to your account</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (const child of children) {
            const attendanceResponse = await api.getAttendanceRecords({ student_id: child.student });
            const records = attendanceResponse.data?.results || attendanceResponse.data || [];
            
            html += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">${child.student_name || 'Student'}</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${records.length === 0 
                                    ? '<tr><td colspan="4" class="px-4 py-6 text-center text-sm text-gray-500">No attendance records</td></tr>'
                                    : records.slice(0, 10).map(record => `
                                        <tr>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm">${formatDate(record.date)}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm">${record.subject_name || 'N/A'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap">${getStatusBadge(record.status)}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${record.remarks || '--'}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        showToast(error.message || 'Failed to load children attendance', 'error');
    }
}
