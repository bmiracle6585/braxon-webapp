// ==========================================
// PROJECT DETAILS PAGE INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded');
    
    // Load project data from API
    loadProjectData();

    // Load module data
    loadModuleData(); // ADD THIS LINE
    
    // Initialize page functionality
    initProjectDetailsPage();
    
    // Initialize status change listener
    initStatusChange();
    
    // Show delete button for admins
    showDeleteButtonIfAdmin();
});

// ==========================================
// GLOBAL VARIABLE
// ==========================================
// currentProject declared in project-details.html instead

// ==========================================
// Load project data from API
// ==========================================
async function loadProjectData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        console.log('🔍 Loading project ID:', projectId);
        
        if (!projectId) {
            console.error('No project ID in URL');
            return;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        console.log('📥 API Response:', result);
        
        if (result.success) {
            console.log('✅ Calling displayProjectData');
            displayProjectData(result.data);
        } else {
            showNotification('Failed to load project data', 'error');
        }
    } catch (error) {
        console.error('Load project data error:', error);
        showNotification('Error loading project data', 'error');
    }
}

// ==========================================
// Display project data on the page
// ==========================================
function displayProjectData(project) {
    console.log('🎯 displayProjectData CALLED with:', project);
    currentProject = project; // Store for editing
    
    console.log('📊 DISPLAYING PROJECT DATA:', project);
    console.log('Site A Location:', project.site_a_location);
    console.log('Site B Location:', project.site_b_location);
    
    // Update page title
    const pageTitle = document.querySelector('.project-details-header h1');
    if (pageTitle) {
        pageTitle.textContent = project.project_name;
    }
    
    // Update status badge
    const statusBadge = document.querySelector('.project-details-header .badge');
    if (statusBadge) {
        statusBadge.className = 'badge ' + getStatusBadgeClass(project.status);
        statusBadge.textContent = formatStatus(project.status);
    }
    
    // Update status dropdown
    const statusSelect = document.getElementById('projectStatusSelect');
    if (statusSelect) {
        if (project.status) {
            statusSelect.value = project.status;
            console.log('✅ Status loaded:', project.status);
        } else {
            statusSelect.value = '';
            console.log('⚠️ No status saved, showing default');
        }
    }
    
    // Update Site A Name
    const siteANameElement = document.querySelector('.site-info-grid .site-column:nth-child(1) .site-value');
    if (siteANameElement && project.site_a_name) {
        siteANameElement.textContent = project.site_a_name;
    }

    // Update Site B Name
    const siteBNameElement = document.querySelector('.site-info-grid .site-column:nth-child(2) .site-value');
    if (siteBNameElement && project.site_b_name) {
        siteBNameElement.textContent = project.site_b_name;
    }

    // Update Site A Location
    const siteALocationDivs = document.querySelectorAll('.site-info-grid .site-column:nth-child(1) .site-value-with-icon');
    if (siteALocationDivs.length > 0) {
        const locationSpan = siteALocationDivs[0].querySelector('span');
        if (locationSpan && project.site_a_location) {
            locationSpan.textContent = project.site_a_location;
        }
    }

    // Update Site B Location
    const siteBLocationDivs = document.querySelectorAll('.site-info-grid .site-column:nth-child(2) .site-value-with-icon');
    if (siteBLocationDivs.length > 0) {
        const locationSpan = siteBLocationDivs[0].querySelector('span');
        if (locationSpan && project.site_b_location) {
            locationSpan.textContent = project.site_b_location;
        }
    }
    // **NEW: Update Photo Documentation section site names**
const photoDocSiteAName = document.getElementById('photoDocSiteAName');
if (photoDocSiteAName && project.site_a_name) {
    photoDocSiteAName.textContent = project.site_a_name;
}

const photoDocSiteBName = document.getElementById('photoDocSiteBName');
if (photoDocSiteBName && project.site_b_name) {
    photoDocSiteBName.textContent = project.site_b_name;
}

    // Update Start Date
    if (siteALocationDivs.length > 1 && project.start_date) {
        const dateSpan = siteALocationDivs[1].querySelector('span');
        if (dateSpan) {
            dateSpan.textContent = new Date(project.start_date).toLocaleDateString();
        }
    }

    // Update Expected Completion
    if (siteBLocationDivs.length > 1 && project.end_date) {
        const dateSpan = siteBLocationDivs[1].querySelector('span');
        if (dateSpan) {
            dateSpan.textContent = new Date(project.end_date).toLocaleDateString();
        }
    }
}

// ==========================================
// LOAD MODULE DATA FOR PHOTO DOCUMENTATION
// ==========================================
async function loadModuleData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) return;
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${projectId}/modules`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('📸 Module data loaded:', result);
        
        if (result.success && result.data) {
            displayModuleData(result.data);
        }
    } catch (error) {
        console.error('Error loading module data:', error);
    }
}

function displayModuleData(data) {
    const siteAModules = data.site_A || [];
    const siteBModules = data.site_B || [];
    const totalModules = siteAModules.length + siteBModules.length;
    
    // Calculate total photos
    const totalPhotos = [...siteAModules, ...siteBModules].reduce((sum, m) => 
        sum + (m.total_required_photos || 0), 0
    );
    
    // Update overall stats
    document.querySelector('.photo-doc-percentage').textContent = '0%';
    document.querySelector('.photo-doc-stats').textContent = `0 of ${totalPhotos} required photos satisfied`;
    document.querySelector('.photo-doc-modules').textContent = `${totalModules} modules configured`;
    
    // Update site counts using IDs
    const photoDocSiteAModules = document.getElementById('photoDocSiteAModules');
    if (photoDocSiteAModules) {
        photoDocSiteAModules.textContent = `${siteAModules.length} modules`;
    }
    
    const photoDocSiteBModules = document.getElementById('photoDocSiteBModules');
    if (photoDocSiteBModules) {
        photoDocSiteBModules.textContent = `${siteBModules.length} modules`;
    }
    
    // Update closeout summary
    const photoSummary = document.querySelector('.closeout-summary-card:nth-child(1) .closeout-value');
    if (photoSummary) {
        photoSummary.textContent = `0 / ${totalPhotos} required photos satisfied`;
    }
    
    const moduleSummary = document.querySelector('.closeout-summary-card:nth-child(1) .closeout-meta');
    if (moduleSummary) {
        moduleSummary.textContent = `0 / ${totalModules} modules complete`;
    }
}

// ==========================================
// INITIALIZE PAGE FUNCTIONALITY
// ==========================================
function initProjectDetailsPage() {
    initDailyUpdates();
    initDocumentManagement();
    initEditSiteInfo();
}

// ==========================================
// PROJECT STATUS CHANGE
// ==========================================
function initStatusChange() {
    const statusSelect = document.getElementById('projectStatusSelect');
    if (!statusSelect) return;

    statusSelect.addEventListener('change', function(e) {
    const newStatus = e.target.value;
    console.log('🎯 DROPDOWN CHANGED! New value:', newStatus);
    
    if (newStatus === '' || newStatus === null) {
        console.log('⚠️ Empty status selected, returning');
        return;
    }
    
    console.log('✅ Calling updateProjectStatus with:', newStatus);
    updateProjectStatus(newStatus);
});
}

async function updateProjectStatus(status) {
    console.log('🔄 updateProjectStatus called with:', status);
    
    const projectId = getProjectIdFromUrl();
    const token = localStorage.getItem('token');
    const statusSelect = document.getElementById('projectStatusSelect');
    
    console.log('📊 Project ID:', projectId);
    console.log('🔑 Token:', token ? 'EXISTS' : 'MISSING');
    console.log('🎯 Status Select Element:', statusSelect ? 'FOUND' : 'NOT FOUND');
    
    if (!token) {
        showNotification('Authentication required. Please log in again.', 'error');
        window.location.href = '/index.html';
        return;
    }
    
    try {
        if (statusSelect) statusSelect.disabled = true;
        
        console.log('📡 Sending PUT request to:', `/api/projects/${projectId}`);
        console.log('📦 Request body:', JSON.stringify({ status: status }));
        
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
        
        console.log('✉️ Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.success) {
            console.log('✅ Status saved to database:', status);
            showNotification('Project status updated successfully', 'success');
            
            const badge = document.querySelector('.project-details-header .badge');
            if (badge) {
                badge.className = 'badge ' + getStatusBadgeClass(status);
                badge.textContent = formatStatus(status);
            }
        } else {
            throw new Error(data.message || 'Failed to update status');
        }
        
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showNotification(`Error updating status: ${error.message}`, 'error');
        setTimeout(() => location.reload(), 2000);
        
    } finally {
        if (statusSelect) statusSelect.disabled = false;
    }
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'pending': 'badge-yellow',
        'in_progress': 'badge-blue',
        'completed': 'badge-green',
        'on_hold': 'badge-red'
    };
    return statusMap[status] || 'badge-gray';
}


function formatStatus(status) {
    return status.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// ==========================================
// DAILY UPDATES
// ==========================================
function initDailyUpdates() {
    const postBtn = document.getElementById('postUpdateBtn');
    const textarea = document.getElementById('dailyUpdateText');
    
    if (!postBtn || !textarea) return;

    postBtn.addEventListener('click', function() {
        const updateText = textarea.value.trim();
        
        if (!updateText) {
            showNotification('Please enter an update message', 'error');
            return;
        }

        postDailyUpdate(updateText);
        textarea.value = '';
    });
}

function postDailyUpdate(updateText) {
    const updateData = {
        text: updateText,
        date: new Date().toISOString(),
        author: 'Blake Miracle'
    };

    console.log('Posting daily update:', updateData);
    showNotification('Update posted successfully', 'success');
    addUpdateToList(updateData);
}

function addUpdateToList(updateData) {
    const updatesList = document.getElementById('updatesList');
    if (!updatesList) return;

    const emptyState = updatesList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const updateElement = document.createElement('div');
    updateElement.className = 'update-item';
    updateElement.innerHTML = `
        <div class="update-header">
            <span class="update-author">${updateData.author}</span>
            <span class="update-date">${formatDate(updateData.date)}</span>
        </div>
        <p class="update-text">${updateData.text}</p>
    `;
    
    updatesList.insertBefore(updateElement, updatesList.firstChild);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// DOCUMENT MANAGEMENT
// ==========================================
function initDocumentManagement() {
    const uploadBtn = document.getElementById('uploadDocsBtn');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
            fileInput.multiple = true;
            
            fileInput.addEventListener('change', function(e) {
                const files = e.target.files;
                if (files.length > 0) {
                    uploadDocuments(files);
                }
            });
            
            fileInput.click();
        });
    }
}

function uploadDocuments(files) {
    console.log('Uploading documents:', files);
    showNotification(`Uploading ${files.length} document(s)...`, 'info');
    
    setTimeout(() => {
        showNotification('Documents uploaded successfully', 'success');
        Array.from(files).forEach((file, index) => {
            addDocumentToList(file, Date.now() + index);
        });
    }, 1500);
}

function addDocumentToList(file, documentId) {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) return;

    const documentItem = document.createElement('div');
    documentItem.className = 'document-item';
    documentItem.innerHTML = `
        <div class="document-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <div class="document-details">
                <span class="document-name">${file.name}</span>
                <span class="document-meta">Uploaded by Blake Miracle on ${new Date().toLocaleDateString()}</span>
            </div>
        </div>
        <div class="document-actions">
            <button class="btn-icon-small" title="Download">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
            <button class="btn-delete" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    documentsList.appendChild(documentItem);
}

// ==========================================
// EDIT SITE INFORMATION
// ==========================================
function initEditSiteInfo() {
    const editBtn = document.getElementById('editSiteInfoBtn');
    const editForm = document.getElementById('editSiteForm');
    
    if (!editBtn) return;

    editBtn.addEventListener('click', openEditModal);
    
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

// ==========================================
// EDIT PROJECT MODAL
// ==========================================

function openEditModal() {
    if (!currentProject) {
        showNotification('Project data not loaded', 'error');
        return;
    }
    
    populateEditModal();
    const modal = document.getElementById('editSiteModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const modal = document.getElementById('editSiteModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Reset the form to prevent issues
    const form = document.getElementById('editProjectForm');
    if (form) {
        form.reset();
    }
}

function populateEditModal() {
    if (!currentProject) return;

    // Populate all fields
    document.getElementById('editCustomerId').value = currentProject.customer_id || '';
    document.getElementById('editCustomerPoc').value = currentProject.customer_poc || '';
    document.getElementById('editProjectName').value = currentProject.project_name || '';
    document.getElementById('editScopeOfWork').value = currentProject.scope_of_work || '';
    document.getElementById('editProjectStatus').value = currentProject.status || 'pending';
    document.getElementById('editSiteAName').value = currentProject.site_a_name || '';
    document.getElementById('editSiteBName').value = currentProject.site_b_name || '';
    document.getElementById('editSiteALocation').value = currentProject.site_a_location || '';
    document.getElementById('editSiteBLocation').value = currentProject.site_b_location || '';
    document.getElementById('editStartDate').value = currentProject.start_date || '';
    document.getElementById('editEndDate').value = currentProject.end_date || '';
    document.getElementById('editProjectDescription').value = currentProject.description || '';

    // Load customers dropdown
    loadCustomersForEdit();
}

async function loadCustomersForEdit() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            const select = document.getElementById('editCustomerId');
            select.innerHTML = '<option value="">Select customer...</option>';
            result.data.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                if (currentProject && customer.id === currentProject.customer_id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load customers error:', error);
    }
}

async function handleEditSubmit(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const formData = new FormData(e.target);
    const updatedData = {
        customer_id: formData.get('customer_id') || null,
        customer_poc: formData.get('customer_poc'),
        project_name: formData.get('project_name'),
        scope_of_work: formData.get('scope_of_work'),
        status: formData.get('status'),
        site_a_name: formData.get('site_a_name'),
        site_b_name: formData.get('site_b_name'),
        site_a_location: formData.get('site_a_location'),
        site_b_location: formData.get('site_b_location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        description: formData.get('description')
    };
    
    // Parse coordinates if they changed
    if (updatedData.site_a_location && updatedData.site_a_location !== currentProject.site_a_location) {
        const coordsA = parseCoordinates(updatedData.site_a_location);
        if (coordsA.lat && coordsA.lng) {
            updatedData.site_a_latitude = coordsA.lat;
            updatedData.site_a_longitude = coordsA.lng;
        }
    }
    
    if (updatedData.site_b_location && updatedData.site_b_location !== currentProject.site_b_location) {
        const coordsB = parseCoordinates(updatedData.site_b_location);
        if (coordsB.lat && coordsB.lng) {
            updatedData.site_b_latitude = coordsB.lat;
            updatedData.site_b_longitude = coordsB.lng;
        }
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${currentProject.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Project updated successfully!', 'success');
            closeEditModal();
            
            // Reload the page to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Failed to update project', 'error');
    }
    
    return false; // Extra safety to prevent form submission
}

// Initialize edit form - ONLY ONCE
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editProjectForm');
    if (editForm) {
        // Remove any existing listeners first
        editForm.replaceWith(editForm.cloneNode(true));
        
        // Add fresh listener
        const newForm = document.getElementById('editProjectForm');
        newForm.addEventListener('submit', handleEditSubmit);
    }
});

function convertDMSToDecimal(degrees, minutes, seconds) {
    const decimal = Math.abs(degrees) + (minutes / 60) + (seconds / 3600);
    return degrees < 0 ? -decimal : decimal;
}

// ==========================================
// DELETE PROJECT FUNCTIONALITY
// ==========================================
function showDeleteButtonIfAdmin() {
    const userRole = localStorage.getItem('userRole');
    const deleteBtn = document.getElementById('deleteProjectBtn');
    
    if (userRole === 'admin' && deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
    }
}

async function confirmDeleteProject() {
    const projectTitle = document.querySelector('.project-details-header h1')?.textContent || 'this project';
    const projectId = getProjectIdFromUrl();
    
    const confirmed = confirm(
        `⚠️ DELETE PROJECT?\n\n` +
        `Project: ${projectTitle}\n\n` +
        `This action CANNOT be undone.\n` +
        `All project data will be permanently deleted.\n\n` +
        `Click OK to confirm deletion.`
    );
    
    if (confirmed) {
        await deleteProject(projectId);
    }
}

async function deleteProject(projectId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/index.html';
        return;
    }
    
    const deleteBtn = document.getElementById('deleteProjectBtn');
    
    try {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('✅ Project deleted successfully!');
            setTimeout(() => window.location.href = '/projects.html', 500);
        } else {
            throw new Error(data.message || 'Failed to delete project');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert(`❌ Error deleting project: ${error.message}`);
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Project';
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function getProjectIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Set Site Module Entry link with projectId
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    const siteModuleLink = document.getElementById('siteModuleEntryLink');
    if (siteModuleLink && projectId) {
        siteModuleLink.href = `site-module-entry.html?projectId=${projectId}`;
    }
});
