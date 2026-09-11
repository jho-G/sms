/**
 * Grading Management - Assessment Categories, Grades, Report Cards
 */

// ============================================================
// Assessment Categories (Director/Teacher)
// ============================================================

async function loadCategoriesPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Assessment Categories</h2>
                <p class="text-gray-600 mt-1">Manage weighted assessment categories</p>
            </div>
            <button onclick="showCreateCategoryModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Category
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Graded</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="categories-table" class="bg-white divide-y divide-gray-200">
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

    await loadCategoriesList();
}

async function loadCategoriesList() {
    try {
        const response = await api.getAssessmentCategories();
        const categories = response.data?.results || response.data || [];
        
        const table = document.getElementById('categories-table');
        
        if (categories.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No assessment categories found</p>
                        <button onclick="showCreateCategoryModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Category</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = categories.map(category => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${category.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${category.subject_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${category.section_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-indigo-600">${category.weight}%</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${category.graded_count || 0} students</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteCategory('${category.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load categories', 'error');
    }
}

function showCreateCategoryModal() {
    const content = `
        <form id="create-category-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="category-name" required placeholder="e.g., Midterm"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Subject Assignment</label>
                <select id="category-assignment" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select assignment</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Weight (%)</label>
                <input type="number" id="category-weight" required min="1" max="100" placeholder="e.g., 30"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="category-description" rows="2"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Assessment Category', content);
    loadAssignmentsForSelect('category-assignment');
    
    document.getElementById('create-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createAssessmentCategory({
                name: document.getElementById('category-name').value,
                subject_assignment: document.getElementById('category-assignment').value,
                weight: document.getElementById('category-weight').value,
                description: document.getElementById('category-description').value
            });
            closeModal();
            showToast('Category created successfully');
            loadCategoriesList();
        } catch (error) {
            showToast(error.message || 'Failed to create category', 'error');
        }
    });
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        await api.deleteAssessmentCategory(id);
        showToast('Category deleted successfully');
        loadCategoriesList();
    } catch (error) {
        showToast(error.message || 'Failed to delete category', 'error');
    }
}

// ============================================================
// Enter Grades (Teacher)
// ============================================================

async function loadEnterGradesPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">Enter Grades</h2>
            <p class="text-gray-600 mt-1">Record student grades for assessments</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Assessment Category</label>
                    <select id="grade-category" onchange="loadStudentsForGrading()"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select category</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="submitBulkGrades()" 
                        class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Submit Grades
                    </button>
                </div>
            </div>

            <div id="grade-students" class="hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Score</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody id="grade-students-table" class="bg-white divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    await loadTeacherCategoriesForGrading();
}

async function loadTeacherCategoriesForGrading() {
    try {
        const response = await api.getAssessmentCategories();
        const categories = response.data?.results || response.data || [];
        
        const select = document.getElementById('grade-category');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name} - ${category.subject_name} (${category.weight}%)`;
            select.appendChild(option);
        });
    } catch (error) {
        showToast(error.message || 'Failed to load categories', 'error');
    }
}

async function loadStudentsForGrading() {
    const categoryId = document.getElementById('grade-category').value;
    if (!categoryId) {
        document.getElementById('grade-students').classList.add('hidden');
        return;
    }

    try {
        const category = await api.getAssessmentCategory(categoryId);
        const sectionId = category.data?.subject_assignment?.section;
        
        if (!sectionId) {
            showToast('No section found for this category', 'error');
            return;
        }

        const studentsResponse = await api.getStudentsBySection(sectionId);
        const students = studentsResponse.data?.results || studentsResponse.data || [];
        
        const table = document.getElementById('grade-students-table');
        document.getElementById('grade-students').classList.remove('hidden');
        
        table.innerHTML = students.map(student => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${student.user_name || 'Student'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${student.student_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="number" id="score-${student.id}" min="0" step="0.01" placeholder="0"
                        class="w-20 rounded-lg border-gray-300 shadow-sm text-sm text-center focus:border-indigo-500 focus:ring-indigo-500"
                        oninput="calculatePercentage('${student.id}')">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="number" id="max-score-${student.id}" value="100" min="1" step="0.01"
                        class="w-20 rounded-lg border-gray-300 shadow-sm text-sm text-center focus:border-indigo-500 focus:ring-indigo-500"
                        oninput="calculatePercentage('${student.id}')">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span id="percentage-${student.id}" class="text-sm font-medium text-gray-900">--%</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="text" id="remark-${student.id}" placeholder="Optional"
                        class="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500">
                </td>
            </tr>
        `).join('');
        
        window.currentGradingStudents = students;
    } catch (error) {
        showToast(error.message || 'Failed to load students', 'error');
    }
}

function calculatePercentage(studentId) {
    const score = parseFloat(document.getElementById(`score-${studentId}`).value) || 0;
    const maxScore = parseFloat(document.getElementById(`max-score-${studentId}`).value) || 100;
    const percentage = maxScore > 0 ? (score / maxScore * 100).toFixed(1) : 0;
    document.getElementById(`percentage-${studentId}`).textContent = `${percentage}%`;
}

async function submitBulkGrades() {
    const categoryId = document.getElementById('grade-category').value;
    const students = window.currentGradingStudents;

    if (!categoryId || !students || students.length === 0) {
        showToast('Please select a category', 'error');
        return;
    }

    const grades = students.map(student => ({
        student_id: student.id,
        score: document.getElementById(`score-${student.id}`).value || 0,
        max_score: document.getElementById(`max-score-${student.id}`).value || 100,
        remarks: document.getElementById(`remark-${student.id}`).value
    })).filter(grade => grade.score); // Only submit if score is entered

    if (grades.length === 0) {
        showToast('Please enter at least one grade', 'error');
        return;
    }

    try {
        await api.bulkSubmitGrades({
            assessment_category_id: categoryId,
            grades: grades
        });
        showToast('Grades submitted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to submit grades', 'error');
    }
}

// ============================================================
// My Grades (Student)
// ============================================================

async function loadMyGradesPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">My Grades</h2>
            <p class="text-gray-600 mt-1">View your grades across all subjects</p>
        </div>

        <div id="my-grades-content">
            <div class="animate-pulse text-gray-500 text-center py-12">Loading...</div>
        </div>
    `;

    await loadMyGradesList();
}

async function loadMyGradesList() {
    try {
        const user = api.getUser();
        const response = await api.getGrades({ student_id: user?.id });
        const grades = response.data?.results || response.data || [];
        
        const container = document.getElementById('my-grades-content');
        
        if (grades.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">No grades found</p>
                </div>
            `;
            return;
        }

        // Group by subject
        const bySubject = {};
        grades.forEach(grade => {
            const subject = grade.subject_name || 'Unknown';
            if (!bySubject[subject]) bySubject[subject] = [];
            bySubject[subject].push(grade);
        });

        let html = '';
        for (const [subject, subjectGrades] of Object.entries(bySubject)) {
            html += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">${subject}</h3>
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Max</th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${subjectGrades.map(grade => `
                                <tr>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">${grade.category_name}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-center">${grade.score}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-center">${grade.max_score}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold ${grade.percentage >= 70 ? 'text-green-600' : grade.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">${grade.percentage?.toFixed(1)}%</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${grade.remarks || '--'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        showToast(error.message || 'Failed to load grades', 'error');
    }
}

// ============================================================
// Children Grades (Parent)
// ============================================================

async function loadChildrenGradesPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">Children Grades</h2>
            <p class="text-gray-600 mt-1">View grades for your children</p>
        </div>

        <div id="children-grades-content">
            <div class="animate-pulse text-gray-500 text-center py-12">Loading...</div>
        </div>
    `;

    await loadChildrenGradesList();
}

async function loadChildrenGradesList() {
    try {
        const user = api.getUser();
        const childrenResponse = await api.getParentChildren(user?.id);
        const children = childrenResponse.data?.results || childrenResponse.data || [];
        
        const container = document.getElementById('children-grades-content');
        
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
            const gradesResponse = await api.getGrades({ student_id: child.student });
            const grades = gradesResponse.data?.results || gradesResponse.data || [];
            
            html += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">${child.student_name || 'Student'}</h3>
                    ${grades.length === 0 
                        ? '<p class="text-sm text-gray-500">No grades found</p>'
                        : `<table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${grades.map(grade => `
                                    <tr>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm">${grade.subject_name || 'N/A'}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">${grade.category_name}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-center">${grade.score}/${grade.max_score}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold ${grade.percentage >= 70 ? 'text-green-600' : grade.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">${grade.percentage?.toFixed(1)}%</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${grade.remarks || '--'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`
                    }
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        showToast(error.message || 'Failed to load children grades', 'error');
    }
}

// ============================================================
// Report Cards
// ============================================================

async function loadReportCardsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">Report Cards</h2>
            <p class="text-gray-600 mt-1">View student report cards and GPA</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Student</label>
                    <select id="report-student"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select student</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Academic Year</label>
                    <select id="report-year"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select year</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="loadReportCard()" 
                        class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        View Report Card
                    </button>
                </div>
            </div>
        </div>

        <div id="report-card-content"></div>
    `;

    await loadStudentsForReportSelect('report-student');
    await loadAcademicYearsForSelect('report-year');
}

async function loadStudentsForReportSelect(selectId) {
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

async function loadReportCard() {
    const studentId = document.getElementById('report-student').value;
    const yearId = document.getElementById('report-year').value;

    if (!studentId || !yearId) {
        showToast('Please select a student and academic year', 'error');
        return;
    }

    try {
        const response = await api.getReportCard(studentId, yearId);
        const report = response.data;
        
        const container = document.getElementById('report-card-content');
        
        if (!report) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p class="text-gray-500">No report card data found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-900">Report Card</h3>
                    <p class="text-gray-600">${report.academic_year}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p class="text-sm text-gray-500">Student Name</p>
                        <p class="text-lg font-semibold text-gray-900">${report.student_name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Student ID</p>
                        <p class="text-lg font-semibold text-gray-900">${report.student_id_code}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Section</p>
                        <p class="text-lg font-semibold text-gray-900">${report.section || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Overall GPA</p>
                        <p class="text-2xl font-bold ${report.overall_gpa >= 3.0 ? 'text-green-600' : report.overall_gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600'}">${report.overall_gpa?.toFixed(2)} (${report.letter_grade})</p>
                    </div>
                </div>

                <div class="mb-4">
                    <h4 class="text-lg font-semibold text-gray-900 mb-2">Subject Grades</h4>
                </div>

                ${report.subjects?.map(subject => `
                    <div class="border border-gray-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-900">${subject.subject_name} (${subject.subject_code})</h5>
                            <span class="text-lg font-bold ${subject.total_weighted_percentage >= 70 ? 'text-green-600' : subject.total_weighted_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">${subject.total_weighted_percentage?.toFixed(1)}%</span>
                        </div>
                        <table class="min-w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500">Category</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Weight</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Score</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Percentage</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Weighted</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${subject.grades?.map(grade => `
                                    <tr>
                                        <td class="px-4 py-2">${grade.category_name}</td>
                                        <td class="px-4 py-2 text-center">${grade.category_weight}%</td>
                                        <td class="px-4 py-2 text-center">${grade.score !== null ? `${grade.score}/${grade.max_score}` : '--'}</td>
                                        <td class="px-4 py-2 text-center">${grade.percentage !== null ? `${grade.percentage?.toFixed(1)}%` : '--'}</td>
                                        <td class="px-4 py-2 text-center font-medium">${grade.weighted_score?.toFixed(2)}</td>
                                    </tr>
                                `).join('') || ''}
                            </tbody>
                        </table>
                    </div>
                `).join('') || ''}

                <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p class="text-2xl font-bold text-gray-900">Overall: ${report.overall_weighted_percentage?.toFixed(1)}% - GPA: ${report.overall_gpa?.toFixed(2)} (${report.letter_grade})</p>
                </div>
            </div>
        `;
    } catch (error) {
        showToast(error.message || 'Failed to load report card', 'error');
    }
}

async function loadMyReportCardPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">My Report Card</h2>
            <p class="text-gray-600 mt-1">View your academic report card</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Academic Year</label>
                    <select id="my-report-year"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select year</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="loadMyReportCard()" 
                        class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        View Report Card
                    </button>
                </div>
            </div>
        </div>

        <div id="my-report-card-content"></div>
    `;

    await loadAcademicYearsForSelect('my-report-year');
}

async function loadMyReportCard() {
    const yearId = document.getElementById('my-report-year').value;

    if (!yearId) {
        showToast('Please select an academic year', 'error');
        return;
    }

    try {
        const response = await api.getMyReportCard(yearId);
        const report = response.data;
        
        const container = document.getElementById('my-report-card-content');
        
        if (!report) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p class="text-gray-500">No report card data found</p>
                </div>
            `;
            return;
        }

        // Reuse report card display
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-900">Report Card</h3>
                    <p class="text-gray-600">${report.academic_year}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p class="text-sm text-gray-500">Student Name</p>
                        <p class="text-lg font-semibold text-gray-900">${report.student_name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Student ID</p>
                        <p class="text-lg font-semibold text-gray-900">${report.student_id_code}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Section</p>
                        <p class="text-lg font-semibold text-gray-900">${report.section || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Overall GPA</p>
                        <p class="text-2xl font-bold ${report.overall_gpa >= 3.0 ? 'text-green-600' : report.overall_gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600'}">${report.overall_gpa?.toFixed(2)} (${report.letter_grade})</p>
                    </div>
                </div>

                ${report.subjects?.map(subject => `
                    <div class="border border-gray-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-900">${subject.subject_name} (${subject.subject_code})</h5>
                            <span class="text-lg font-bold ${subject.total_weighted_percentage >= 70 ? 'text-green-600' : subject.total_weighted_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">${subject.total_weighted_percentage?.toFixed(1)}%</span>
                        </div>
                        <table class="min-w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500">Category</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Weight</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Score</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Percentage</th>
                                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500">Weighted</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${subject.grades?.map(grade => `
                                    <tr>
                                        <td class="px-4 py-2">${grade.category_name}</td>
                                        <td class="px-4 py-2 text-center">${grade.category_weight}%</td>
                                        <td class="px-4 py-2 text-center">${grade.score !== null ? `${grade.score}/${grade.max_score}` : '--'}</td>
                                        <td class="px-4 py-2 text-center">${grade.percentage !== null ? `${grade.percentage?.toFixed(1)}%` : '--'}</td>
                                        <td class="px-4 py-2 text-center font-medium">${grade.weighted_score?.toFixed(2)}</td>
                                    </tr>
                                `).join('') || ''}
                            </tbody>
                        </table>
                    </div>
                `).join('') || ''}

                <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p class="text-2xl font-bold text-gray-900">Overall: ${report.overall_weighted_percentage?.toFixed(1)}% - GPA: ${report.overall_gpa?.toFixed(2)} (${report.letter_grade})</p>
                </div>
            </div>
        `;
    } catch (error) {
        showToast(error.message || 'Failed to load report card', 'error');
    }
}

// ============================================================
// My Assignments (Teacher)
// ============================================================

async function loadMyAssignmentsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">My Assignments</h2>
            <p class="text-gray-600 mt-1">View your teaching assignments</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="my-assignments-table" class="bg-white divide-y divide-gray-200">
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

    await loadMyAssignmentsList();
}

async function loadMyAssignmentsList() {
    try {
        const user = api.getUser();
        const response = await api.getSubjectAssignments({ teacher_id: user?.id });
        const assignments = response.data?.results || response.data || [];
        
        const table = document.getElementById('my-assignments-table');
        
        if (assignments.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No assignments found</p>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = assignments.map(assignment => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${assignment.subject_name || 'N/A'}</div>
                    <div class="text-xs text-gray-500">${assignment.subject_code || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${assignment.section_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${assignment.academic_year_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${assignment.is_active 
                        ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
                        : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="navigateTo('take-attendance')" class="text-indigo-600 hover:text-indigo-900 mr-3">Take Attendance</button>
                    <button onclick="navigateTo('enter-grades')" class="text-indigo-600 hover:text-indigo-900">Enter Grades</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load assignments', 'error');
    }
}

// ============================================================
// Children (Parent)
// ============================================================

async function loadChildrenPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">My Children</h2>
            <p class="text-gray-600 mt-1">View your children's information</p>
        </div>

        <div id="children-content">
            <div class="animate-pulse text-gray-500 text-center py-12">Loading...</div>
        </div>
    `;

    await loadChildrenList();
}

async function loadChildrenList() {
    try {
        const user = api.getUser();
        const response = await api.getParentChildren(user?.id);
        const children = response.data?.results || response.data || [];
        
        const container = document.getElementById('children-content');
        
        if (children.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p class="text-gray-500">No children found linked to your account</p>
                </div>
            `;
            return;
        }

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        
        for (const child of children) {
            html += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-xl font-bold text-blue-600">${(child.student_name || 'S').charAt(0)}</span>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">${child.student_name || 'Student'}</h3>
                            <p class="text-sm text-gray-500">${child.relationship || 'Child'}</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm"><span class="font-medium text-gray-700">Student ID:</span> ${child.student_id || 'N/A'}</p>
                        <p class="text-sm"><span class="font-medium text-gray-700">Section:</span> ${child.section_name || 'N/A'}</p>
                        <p class="text-sm"><span class="font-medium text-gray-700">Primary Guardian:</span> ${child.is_primary ? 'Yes' : 'No'}</p>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <button onclick="navigateTo('children-attendance')" class="text-indigo-600 hover:text-indigo-500 text-sm font-medium mr-4">View Attendance</button>
                        <button onclick="navigateTo('children-grades')" class="text-indigo-600 hover:text-indigo-500 text-sm font-medium">View Grades</button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        showToast(error.message || 'Failed to load children', 'error');
    }
}

// ============================================================
// Helper Functions
// ============================================================

async function loadAssignmentsForSelect(selectId) {
    try {
        const response = await api.getSubjectAssignments();
        const assignments = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        assignments.forEach(assignment => {
            const option = document.createElement('option');
            option.value = assignment.id;
            option.textContent = `${assignment.subject_name} - ${assignment.section_name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load assignments:', error);
    }
}
