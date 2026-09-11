/**
 * Academics Management - Academic Years, Grade Levels, Sections, Subjects, Assignments
 */

// ============================================================
// Academic Years
// ============================================================

async function loadAcademicYearsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Academic Years</h2>
                <p class="text-gray-600 mt-1">Manage academic years and terms</p>
            </div>
            <button onclick="showCreateAcademicYearModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Academic Year
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="academic-years-table" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center">
                                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                                </svg>
                                <p class="mt-2 text-sm text-gray-500">Loading...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadAcademicYearsList();
}

async function loadAcademicYearsList() {
    try {
        const response = await api.getAcademicYears();
        const years = response.data?.results || response.data || [];
        
        const table = document.getElementById('academic-years-table');
        
        if (years.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                        </svg>
                        <p class="mt-2 text-sm text-gray-500">No academic years found</p>
                        <button onclick="showCreateAcademicYearModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Academic Year</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = years.map(year => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${year.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(year.start_date)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(year.end_date)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${year.is_active 
                        ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
                        : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="showEditAcademicYearModal('${year.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button onclick="deleteAcademicYear('${year.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load academic years', 'error');
    }
}

function showCreateAcademicYearModal() {
    const content = `
        <form id="create-year-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="year-name" required placeholder="e.g., 2024-2025"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="year-start" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="year-end" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="year-active" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                <label for="year-active" class="ml-2 text-sm text-gray-700">Set as active year</label>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Academic Year', content);
    
    document.getElementById('create-year-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createAcademicYear({
                name: document.getElementById('year-name').value,
                start_date: document.getElementById('year-start').value,
                end_date: document.getElementById('year-end').value,
                is_active: document.getElementById('year-active').checked
            });
            closeModal();
            showToast('Academic year created successfully');
            loadAcademicYearsList();
        } catch (error) {
            showToast(error.message || 'Failed to create academic year', 'error');
        }
    });
}

async function deleteAcademicYear(id) {
    if (!confirm('Are you sure you want to delete this academic year?')) return;
    
    try {
        await api.deleteAcademicYear(id);
        showToast('Academic year deleted successfully');
        loadAcademicYearsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete academic year', 'error');
    }
}

async function showEditAcademicYearModal(id) {
    try {
        const response = await api.getAcademicYear(id);
        const year = response.data;
        
        const content = `
            <form id="edit-year-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="edit-year-name" value="${year.name}" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" id="edit-year-start" value="${year.start_date}" required
                            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" id="edit-year-end" value="${year.end_date}" required
                            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="edit-year-active" ${year.is_active ? 'checked' : ''} class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <label for="edit-year-active" class="ml-2 text-sm text-gray-700">Active</label>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                </div>
            </form>
        `;
        
        openModal('Edit Academic Year', content);
        
        document.getElementById('edit-year-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await api.updateAcademicYear(id, {
                    name: document.getElementById('edit-year-name').value,
                    start_date: document.getElementById('edit-year-start').value,
                    end_date: document.getElementById('edit-year-end').value,
                    is_active: document.getElementById('edit-year-active').checked
                });
                closeModal();
                showToast('Academic year updated successfully');
                loadAcademicYearsList();
            } catch (error) {
                showToast(error.message || 'Failed to update academic year', 'error');
            }
        });
    } catch (error) {
        showToast(error.message || 'Failed to load academic year', 'error');
    }
}

async function showEditGradeLevelModal(id) {
    try {
        const response = await api.getGradeLevel(id);
        const grade = response.data;
        
        const content = `
            <form id="edit-grade-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="edit-grade-name" value="${grade.name}" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Level (9-12)</label>
                    <input type="number" id="edit-grade-level" value="${grade.level}" required min="9" max="12"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="edit-grade-description" rows="2"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">${grade.description || ''}</textarea>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                </div>
            </form>
        `;
        
        openModal('Edit Grade Level', content);
        
        document.getElementById('edit-grade-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await api.updateGradeLevel(id, {
                    name: document.getElementById('edit-grade-name').value,
                    level: parseInt(document.getElementById('edit-grade-level').value),
                    description: document.getElementById('edit-grade-description').value
                });
                closeModal();
                showToast('Grade level updated successfully');
                loadGradeLevelsList();
            } catch (error) {
                showToast(error.message || 'Failed to update grade level', 'error');
            }
        });
    } catch (error) {
        showToast(error.message || 'Failed to load grade level', 'error');
    }
}

async function showEditSectionModal(id) {
    try {
        const response = await api.getClassSection(id);
        const section = response.data;
        
        const content = `
            <form id="edit-section-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Section Name</label>
                    <input type="text" id="edit-section-name" value="${section.name}" required
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Capacity</label>
                        <input type="number" id="edit-section-capacity" value="${section.capacity}" min="1"
                            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Room Number</label>
                        <input type="text" id="edit-section-room" value="${section.room_number || ''}"
                            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                </div>
            </form>
        `;
        
        openModal('Edit Class Section', content);
        
        document.getElementById('edit-section-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await api.updateClassSection(id, {
                    name: document.getElementById('edit-section-name').value,
                    capacity: parseInt(document.getElementById('edit-section-capacity').value),
                    room_number: document.getElementById('edit-section-room').value
                });
                closeModal();
                showToast('Section updated successfully');
                loadSectionsList();
            } catch (error) {
                showToast(error.message || 'Failed to update section', 'error');
            }
        });
    } catch (error) {
        showToast(error.message || 'Failed to load section', 'error');
    }
}

async function deleteSection(id) {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
        await api.deleteClassSection(id);
        showToast('Section deleted successfully');
        loadSectionsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete section', 'error');
    }
}

async function deleteSubject(id) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
        await api.deleteSubject(id);
        showToast('Subject deleted successfully');
        loadSubjectsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete subject', 'error');
    }
}

// ============================================================
// Grade Levels
// ============================================================

async function loadGradeLevelsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Grade Levels</h2>
                <p class="text-gray-600 mt-1">Manage grade levels for each academic year</p>
            </div>
            <button onclick="showCreateGradeLevelModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Grade Level
            </button>
        </div>

        <div id="grade-levels-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <div class="animate-pulse text-gray-500">Loading...</div>
            </div>
        </div>
    `;

    await loadGradeLevelsList();
}

async function loadGradeLevelsList() {
    try {
        const response = await api.getGradeLevels();
        const grades = response.data?.results || response.data || [];
        
        const grid = document.getElementById('grade-levels-grid');
        
        if (grades.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                    </svg>
                    <p class="mt-2 text-sm text-gray-500">No grade levels found</p>
                    <button onclick="showCreateGradeLevelModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Grade Level</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = grades.map(grade => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span class="text-xl font-bold text-indigo-600">${grade.level}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showEditGradeLevelModal('${grade.id}')" class="text-gray-400 hover:text-indigo-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteGradeLevel('${grade.id}')" class="text-gray-400 hover:text-red-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">${grade.name}</h3>
                ${grade.description ? `<p class="text-sm text-gray-500 mt-1">${grade.description}</p>` : ''}
                <p class="text-xs text-gray-400 mt-3">Academic Year: ${grade.academic_year_name || 'N/A'}</p>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load grade levels', 'error');
    }
}

function showCreateGradeLevelModal() {
    const content = `
        <form id="create-grade-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="grade-name" required placeholder="e.g., Grade 11"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Level (9-12)</label>
                <input type="number" id="grade-level" required min="9" max="12"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Academic Year</label>
                <select id="grade-year" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select academic year</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="grade-description" rows="2"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Grade Level', content);
    loadAcademicYearsForSelect('grade-year');
    
    document.getElementById('create-grade-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createGradeLevel({
                name: document.getElementById('grade-name').value,
                level: parseInt(document.getElementById('grade-level').value),
                academic_year: document.getElementById('grade-year').value,
                description: document.getElementById('grade-description').value
            });
            closeModal();
            showToast('Grade level created successfully');
            loadGradeLevelsList();
        } catch (error) {
            showToast(error.message || 'Failed to create grade level', 'error');
        }
    });
}

async function deleteGradeLevel(id) {
    if (!confirm('Are you sure you want to delete this grade level?')) return;
    
    try {
        await api.deleteGradeLevel(id);
        showToast('Grade level deleted successfully');
        loadGradeLevelsList();
    } catch (error) {
        showToast(error.message || 'Failed to delete grade level', 'error');
    }
}

// ============================================================
// Class Sections
// ============================================================

async function loadSectionsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Class Sections</h2>
                <p class="text-gray-600 mt-1">Manage class sections within grade levels</p>
            </div>
            <button onclick="showCreateSectionModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Section
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="sections-table" class="bg-white divide-y divide-gray-200">
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

    await loadSectionsList();
}

async function loadSectionsList() {
    try {
        const response = await api.getClassSections();
        const sections = response.data?.results || response.data || [];
        
        const table = document.getElementById('sections-table');
        
        if (sections.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No sections found</p>
                        <button onclick="showCreateSectionModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Section</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = sections.map(section => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">Section ${section.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${section.grade_level_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${section.capacity}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${section.room_number || '--'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${section.is_active 
                        ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
                        : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="showEditSectionModal('${section.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button onclick="deleteSection('${section.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load sections', 'error');
    }
}

function showCreateSectionModal() {
    const content = `
        <form id="create-section-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Grade Level</label>
                <select id="section-grade" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select grade level</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Section Name</label>
                <input type="text" id="section-name" required placeholder="e.g., A"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Capacity</label>
                    <input type="number" id="section-capacity" value="40" min="1"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Room Number</label>
                    <input type="text" id="section-room" placeholder="e.g., 101"
                        class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Class Section', content);
    loadGradeLevelsForSelect('section-grade');
    
    document.getElementById('create-section-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createClassSection({
                grade_level: document.getElementById('section-grade').value,
                name: document.getElementById('section-name').value,
                capacity: parseInt(document.getElementById('section-capacity').value),
                room_number: document.getElementById('section-room').value
            });
            closeModal();
            showToast('Section created successfully');
            loadSectionsList();
        } catch (error) {
            showToast(error.message || 'Failed to create section', 'error');
        }
    });
}

// ============================================================
// Subjects
// ============================================================

async function loadSubjectsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Subjects</h2>
                <p class="text-gray-600 mt-1">Manage subjects and courses</p>
            </div>
            <button onclick="showCreateSubjectModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Subject
            </button>
        </div>

        <div id="subjects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <div class="animate-pulse text-gray-500">Loading...</div>
            </div>
        </div>
    `;

    await loadSubjectsList();
}

async function loadSubjectsList() {
    try {
        const response = await api.getSubjects();
        const subjects = response.data?.results || response.data || [];
        
        const grid = document.getElementById('subjects-grid');
        
        if (subjects.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-sm text-gray-500">No subjects found</p>
                    <button onclick="showCreateSubjectModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Subject</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = subjects.map(subject => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span class="text-lg font-bold text-green-600">${subject.code?.substring(0, 3) || 'SUB'}</span>
                    </div>
                    <button onclick="deleteSubject('${subject.id}')" class="text-gray-400 hover:text-red-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">${subject.name}</h3>
                <p class="text-sm text-gray-500 mt-1">${subject.code}</p>
                ${subject.description ? `<p class="text-xs text-gray-400 mt-2">${subject.description}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load subjects', 'error');
    }
}

function showCreateSubjectModal() {
    const content = `
        <form id="create-subject-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="subject-name" required placeholder="e.g., Mathematics"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Code</label>
                <input type="text" id="subject-code" required placeholder="e.g., MATH101"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="subject-description" rows="2"
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Subject', content);
    
    document.getElementById('create-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createSubject({
                name: document.getElementById('subject-name').value,
                code: document.getElementById('subject-code').value,
                description: document.getElementById('subject-description').value
            });
            closeModal();
            showToast('Subject created successfully');
            loadSubjectsList();
        } catch (error) {
            showToast(error.message || 'Failed to create subject', 'error');
        }
    });
}

// ============================================================
// Subject Assignments
// ============================================================

async function loadAssignmentsPage() {
    const content = document.getElementById('main-content');
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Subject Assignments</h2>
                <p class="text-gray-600 mt-1">Assign teachers to subjects and sections</p>
            </div>
            <button onclick="showCreateAssignmentModal()" 
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Assignment
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="assignments-table" class="bg-white divide-y divide-gray-200">
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

    await loadAssignmentsList();
}

async function loadAssignmentsList() {
    try {
        const response = await api.getSubjectAssignments();
        const assignments = response.data?.results || response.data || [];
        
        const table = document.getElementById('assignments-table');
        
        if (assignments.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <p class="text-sm text-gray-500">No assignments found</p>
                        <button onclick="showCreateAssignmentModal()" class="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium">Add Assignment</button>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = assignments.map(assignment => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${assignment.teacher_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${assignment.subject_name || 'N/A'}</div>
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
                    <button onclick="deleteAssignment('${assignment.id}')" class="text-red-600 hover:text-red-900">Deactivate</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast(error.message || 'Failed to load assignments', 'error');
    }
}

function showCreateAssignmentModal() {
    const content = `
        <form id="create-assignment-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Teacher</label>
                <select id="assignment-teacher" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select teacher</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Subject</label>
                <select id="assignment-subject" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select subject</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Section</label>
                <select id="assignment-section" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select section</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Academic Year</label>
                <select id="assignment-year" required
                    class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select academic year</option>
                </select>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            </div>
        </form>
    `;
    
    openModal('Create Subject Assignment', content);
    loadTeachersForSelect('assignment-teacher');
    loadSubjectsForSelect('assignment-subject');
    loadSectionsForSelect('assignment-section');
    loadAcademicYearsForSelect('assignment-year');
    
    document.getElementById('create-assignment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createSubjectAssignment({
                teacher: document.getElementById('assignment-teacher').value,
                subject: document.getElementById('assignment-subject').value,
                section: document.getElementById('assignment-section').value,
                academic_year: document.getElementById('assignment-year').value
            });
            closeModal();
            showToast('Assignment created successfully');
            loadAssignmentsList();
        } catch (error) {
            showToast(error.message || 'Failed to create assignment', 'error');
        }
    });
}

async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to deactivate this assignment?')) return;
    
    try {
        await api.deleteSubjectAssignment(id);
        showToast('Assignment deactivated successfully');
        loadAssignmentsList();
    } catch (error) {
        showToast(error.message || 'Failed to deactivate assignment', 'error');
    }
}

// ============================================================
// Helper Functions for Selects
// ============================================================

async function loadAcademicYearsForSelect(selectId) {
    try {
        const response = await api.getAcademicYears();
        const years = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year.id;
            option.textContent = `${year.name} ${year.is_active ? '(Active)' : ''}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load academic years:', error);
    }
}

async function loadGradeLevelsForSelect(selectId) {
    try {
        const response = await api.getGradeLevels();
        const grades = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade.id;
            option.textContent = grade.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load grade levels:', error);
    }
}

async function loadSectionsForSelect(selectId) {
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

async function loadSubjectsForSelect(selectId) {
    try {
        const response = await api.getSubjects();
        const subjects = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `${subject.name} (${subject.code})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load subjects:', error);
    }
}

async function loadTeachersForSelect(selectId) {
    try {
        const response = await api.getTeacherProfiles();
        const teachers = response.data?.results || response.data || [];
        const select = document.getElementById(selectId);
        
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.user || teacher.id;
            option.textContent = teacher.user_name || teacher.employee_id || 'Teacher';
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load teachers:', error);
    }
}
