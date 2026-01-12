// ==========================================
// PROJECTS PAGE FUNCTIONALITY
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initProjectsPage();
});

async function initProjectsPage() {
    // Load projects from API
    await loadAndDisplayProjects();
    
    // Initialize all event listeners
    initSearchFilter();
    initStatusFilter();
    initProjectExpand();
    initRecentlyViewedToggle();
    initNewProjectModal();
    initFileUpload();
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
function initSearchFilter() {
    const searchInput = document.getElementById('searchProjects');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterProjects(searchTerm);
    });
}

function filterProjects(searchTerm) {
    const projectCards = document.querySelectorAll('.project-card');
    let visibleCount = 0;

    projectCards.forEach(card => {
        const title = card.querySelector('.project-card-title').textContent.toLowerCase();
        const description = card.querySelector('.project-description')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show/hide empty state
    updateEmptyState(visibleCount);
}

// ==========================================
// STATUS FILTER
// ==========================================
function initStatusFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;

    statusFilter.addEventListener('change', function(e) {
        const selectedStatus = e.target.value;
        filterByStatus(selectedStatus);
    });
}

function filterByStatus(status) {
    const projectCards = document.querySelectorAll('.project-card');
    let visibleCount = 0;

    projectCards.forEach(card => {
        const badge = card.querySelector('.badge');
        const projectStatus = badge.textContent.toLowerCase().replace(/\s+/g, '-');
        
        if (status === 'all' || projectStatus === status) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    updateEmptyState(visibleCount);
}

function updateEmptyState(visibleCount) {
    const emptyState = document.querySelector('.empty-state-large');
    
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
}

// ==========================================
// PROJECT CARD EXPAND/COLLAPSE
// ==========================================
function initProjectExpand() {
    const expandButtons = document.querySelectorAll('.project-expand-btn');
    
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.dataset.projectId;
            const detailsSection = document.getElementById(`details-${projectId}`);
            const isExpanded = detailsSection.style.display === 'block';
            
            if (isExpanded) {
                detailsSection.style.display = 'none';
                this.classList.remove('expanded');
            } else {
                detailsSection.style.display = 'block';
                this.classList.add('expanded');
            }
        });
    });
}

// ==========================================
// RECENTLY VIEWED TOGGLE
// ==========================================
function initRecentlyViewedToggle() {
    const toggleButton = document.getElementById('toggleRecentlyViewed');
    const content = document.getElementById('recentlyViewedContent');
    
    if (!toggleButton || !content) return;

    toggleButton.addEventListener('click', function() {
        const isCollapsed = content.style.display === 'none';
        
        if (isCollapsed) {
            content.style.display = 'block';
            this.classList.remove('collapsed');
        } else {
            content.style.display = 'none';
            this.classList.add('collapsed');
        }
    });
}

// File upload handling
function initFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const uploadLink = document.querySelector('.upload-link');

    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.btn-upload-paste')) return;
        fileInput.click();
    });

    uploadLink?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Paste from clipboard
    pasteBtn?.addEventListener('click', async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
                        handleFiles([file]);
                    }
                }
            }
        } catch (error) {
            console.error('Paste error:', error);
            alert('Could not paste from clipboard. Try using Ctrl+V instead.');
        }
    });
}

function handleFiles(files) {
    const fileList = document.getElementById('filePreviewList');
    if (!fileList) return;

    fileList.style.display = 'block';

    Array.from(files).forEach(file => {
        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Max size is 50MB.`);
            return;
        }

        const fileExt = file.name.split('.').pop().toUpperCase();
        const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${fileExt}</div>
                <div class="file-details">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${fileSize}</p>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="this.parentElement.remove()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        fileList.appendChild(fileItem);
    });
}

    // Add remove functionality
    container.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.uploaded-file-item').remove();
        });
    });


// ==========================================
// NEW PROJECT MODAL
// ==========================================
function initNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    const openBtn = document.getElementById('newProjectBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('newProjectForm');

    if (!modal || !openBtn) return;

    // Open modal
    openBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        form.reset();
        document.getElementById('uploadedFilesList').innerHTML = '';
    }

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Handle form submission
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        handleNewProjectSubmit(form);
    });
}

async function handleNewProjectSubmit(form) {
    const formData = new FormData(form);
    const clientName = formData.get('projectClient');
    
    // Load customers to find ID
    const customers = await loadCustomers();
    const customer = customers.find(c => c.name === clientName);
    
    const projectData = {
        project_code: `BRX-${Date.now()}`,
        name: formData.get('projectName'),
        customer_id: customer ? customer.id : null,
        status: formData.get('projectStatus'),
        start_date: formData.get('projectStartDate') || null,
        end_date: formData.get('projectEndDate') || null,
        site_a_name: formData.get('siteAName'),
        site_a_address: null,  // We'll add address parsing later if needed
        site_a_location: formData.get('siteALocation'),
        site_a_latitude: parseCoordinates(formData.get('siteALocation')).lat,
        site_a_longitude: parseCoordinates(formData.get('siteALocation')).lng,
        site_b_name: formData.get('siteBName'),
        site_b_address: null,
        site_b_location: formData.get('siteBLocation'),
        site_b_latitude: parseCoordinates(formData.get('siteBLocation')).lat,
        site_b_longitude: parseCoordinates(formData.get('siteBLocation')).lng,
        scope_of_work: formData.get('scopeOfWork'),
        description: formData.get('projectDescription')
    };

    console.log('New Project Data:', projectData);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Project created successfully!', 'success');
            
            // Close modal
            document.getElementById('newProjectModal').style.display = 'none';
            document.body.style.overflow = '';
            form.reset();
            document.getElementById('uploadedFilesList').innerHTML = '';
            
            // Reload the page to show new project
            window.location.reload();
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Create project error:', error);
        showNotification('Failed to create project', 'error');
    }
}

async function loadCustomers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Load customers error:', error);
        return [];
    }
}

// Helper function to load customers
async function loadCustomers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Load customers error:', error);
        return [];
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
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

// Sample function to add a new project card dynamically
function addProjectCard(projectData) {
    const projectsGrid = document.querySelector('.projects-grid');
    
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.innerHTML = `
        <div class="project-card-header">
            <div class="project-card-title-section">
                <h3 class="project-card-title">${projectData.name}</h3>
                <span class="badge badge-blue">${projectData.status}</span>
            </div>
        </div>
        <div class="project-card-summary">
            <div class="project-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${projectData.location || 'Location not specified'}</span>
            </div>
            <div class="project-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Started ${projectData.startDate}</span>
            </div>
            <p class="project-description">${projectData.description}</p>
        </div>
    `;
    
    projectsGrid.insertBefore(projectCard, projectsGrid.firstChild);
}
// Load and display all projects
async function loadAndDisplayProjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const grid = document.getElementById('allProjectsGrid');
            
            grid.innerHTML = result.data.map(project => {
                const statusClass = `badge-${project.status.replace('_', '-')}`;
                const customerName = project.customer ? project.customer.name : 'No Customer';
                const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set';
                
                return `
                    <div class="project-card" onclick="window.location.href='/project-details.html?id=${project.id}'">
                        <div class="project-card-header">
                            <div class="project-card-title-section">
                                <h3 class="project-card-title">${project.project_name}</h3>
                                <p class="project-card-number">${project.project_code}</p>
                            </div>
                            <span class="badge ${statusClass}">${project.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div class="project-card-summary">
                            <div class="project-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                                </svg>
                                <span>${customerName}</span>
                            </div>
                            <div class="project-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
                                </svg>
                                <span>Started ${startDate}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Load projects error:', error);
    }
}
// Parse coordinates from "34 27 54.93, -109 37 41.59" format
function parseCoordinates(coordString) {
    if (!coordString || coordString.trim() === '') {
        return { lat: null, lng: null };
    }
    
    try {
        // Split by comma
        const parts = coordString.split(',');
        if (parts.length !== 2) {
            return { lat: null, lng: null };
        }
        
        // Parse degrees, minutes, seconds for latitude
        const latParts = parts[0].trim().split(' ').filter(p => p);
        const lngParts = parts[1].trim().split(' ').filter(p => p);
        
        if (latParts.length === 3 && lngParts.length === 3) {
            // Convert DMS to decimal
            const lat = convertDMSToDecimal(
                parseFloat(latParts[0]),
                parseFloat(latParts[1]),
                parseFloat(latParts[2])
            );
            
            const lng = convertDMSToDecimal(
                parseFloat(lngParts[0]),
                parseFloat(lngParts[1]),
                parseFloat(lngParts[2])
            );
            
            return { lat, lng };
        }
        
        return { lat: null, lng: null };
    } catch (error) {
        console.error('Coordinate parsing error:', error);
        return { lat: null, lng: null };
    }
}

// Convert degrees, minutes, seconds to decimal
function convertDMSToDecimal(degrees, minutes, seconds) {
    const decimal = Math.abs(degrees) + (minutes / 60) + (seconds / 3600);
    return degrees < 0 ? -decimal : decimal;
}
