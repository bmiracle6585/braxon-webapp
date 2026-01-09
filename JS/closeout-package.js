// ==========================================
// CLOSEOUT PACKAGE PAGE - DYNAMIC DATA
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initCloseoutPage();
});

function initCloseoutPage() {
    loadProjectData();
    loadModuleSummary();
    initGenerateButton();
    initDeleteButtons();
}

// ==========================================
// LOAD PROJECT DATA AND FIX NAVIGATION
// ==========================================
async function loadProjectData() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    
    if (!projectId) {
        console.error('No projectId in URL');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const project = result.data;
            
            // Update page subtitle
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageSubtitle) {
                pageSubtitle.textContent = `${project.project_name} - Documentation assembly and QA approval`;
            }
            
            // Update Site A and Site B headers
            const siteAHeader = document.querySelector('.site-section:first-child .site-section-title');
            if (siteAHeader && project.site_a_name) {
                siteAHeader.textContent = project.site_a_name;
            }
            
            const siteBHeader = document.querySelector('.site-section:last-child .site-section-title');
            if (siteBHeader && project.site_b_name) {
                siteBHeader.textContent = project.site_b_name;
            }
            
            // Fix Back to Project link
            const backBtn = document.querySelector('.back-link');
            if (backBtn) {
                backBtn.href = `project-details.html?id=${projectId}`;
            }
        }
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

// ==========================================
// LOAD MODULE SUMMARY DATA
// ==========================================
async function loadModuleSummary() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    
    if (!projectId) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/modules`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('📦 Module summary loaded:', result);
        
        if (result.success && result.data) {
            const siteAModules = result.data.site_A || [];
            const siteBModules = result.data.site_B || [];

            // Calculate totals
            const totalModules = siteAModules.length + siteBModules.length;
            const completedModules = [...siteAModules, ...siteBModules].filter(m => m.status === 'completed').length;
            const totalPhotos = siteAModules.reduce((sum, m) => sum + (m.total_uploaded_photos || 0), 0) +
                              siteBModules.reduce((sum, m) => sum + (m.total_uploaded_photos || 0), 0);
            const requiredPhotos = siteAModules.reduce((sum, m) => sum + (m.total_required_photos || 0), 0) +
                                 siteBModules.reduce((sum, m) => sum + (m.total_required_photos || 0), 0);

            // Update Photo Documentation Status
            const photoDocStatus = document.getElementById('photoDocStatus');
            const photoDocDetails = document.getElementById('photoDocDetails');
            
            if (photoDocStatus) {
                photoDocStatus.textContent = `${completedModules} of ${totalModules} modules complete`;
            }
            if (photoDocDetails) {
                photoDocDetails.textContent = `${totalPhotos} of ${requiredPhotos} required photos satisfied`;
            }

            // Site A Stats
            const siteACompleted = siteAModules.filter(m => m.status === 'completed').length;
            const siteAPhotos = siteAModules.reduce((sum, m) => sum + (m.total_uploaded_photos || 0), 0);
            const siteARequired = siteAModules.reduce((sum, m) => sum + (m.total_required_photos || 0), 0);
            
            const siteAStatusEl = document.getElementById('siteAStatus');
            if (siteAStatusEl) {
                siteAStatusEl.textContent = `${siteACompleted} / ${siteAModules.length} modules complete`;
                siteAStatusEl.className = siteACompleted === siteAModules.length && siteAModules.length > 0 
                    ? 'stat-badge stat-complete' 
                    : 'stat-badge stat-incomplete';
            }
            
            const siteADetailsEl = document.getElementById('siteADetails');
            if (siteADetailsEl) {
                siteADetailsEl.textContent = `${siteAPhotos} / ${siteARequired} required photos satisfied`;
            }

            // Site B Stats
            const siteBCompleted = siteBModules.filter(m => m.status === 'completed').length;
            const siteBPhotos = siteBModules.reduce((sum, m) => sum + (m.total_uploaded_photos || 0), 0);
            const siteBRequired = siteBModules.reduce((sum, m) => sum + (m.total_required_photos || 0), 0);
            
            const siteBStatusEl = document.getElementById('siteBStatus');
            if (siteBStatusEl) {
                siteBStatusEl.textContent = `${siteBCompleted} / ${siteBModules.length} modules complete`;
                siteBStatusEl.className = siteBCompleted === siteBModules.length && siteBModules.length > 0 
                    ? 'stat-badge stat-complete' 
                    : 'stat-badge stat-incomplete';
            }
            
            const siteBDetailsEl = document.getElementById('siteBDetails');
            if (siteBDetailsEl) {
                siteBDetailsEl.textContent = `${siteBPhotos} / ${siteBRequired} required photos satisfied`;
            }

            // **FIX: Set ALL Screen Captures to 0 (not yet implemented)**
            const screenCaptureStatus = document.getElementById('screenCaptureStatus');
            if (screenCaptureStatus) {
                screenCaptureStatus.textContent = '0 uploaded';
            }
            
            const siteAScreenCaptures = document.getElementById('siteAScreenCaptures');
            if (siteAScreenCaptures) {
                siteAScreenCaptures.textContent = '0 captures';
            }
            
            const siteBScreenCaptures = document.getElementById('siteBScreenCaptures');
            if (siteBScreenCaptures) {
                siteBScreenCaptures.textContent = '0 captures';
            }
        }
    } catch (error) {
        console.error('Error loading module summary:', error);
    }
}

// ==========================================
// GENERATE PACKAGE
// ==========================================
function initGenerateButton() {
    const generateBtn = document.getElementById('generatePackageBtn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            generatePackage();
        });
    }
}

function generatePackage() {
    // Check QA status
    const qaApproved = false; // TODO: Get from backend
    
    if (!qaApproved) {
        if (!confirm('QA Review has not been approved yet. Do you want to generate a draft package anyway?')) {
            return;
        }
    }
    
    showNotification('Generating closeout package...', 'info');
    
    // TODO: Send to backend
    console.log('Generating package');
    
    // Simulate generation
    setTimeout(() => {
        showNotification('Closeout package generated successfully', 'success');
        addNewPackage();
    }, 2000);
}

function addNewPackage() {
    const packagesList = document.getElementById('packagesList');
    const packageId = Date.now();
    const dateStr = new Date().toLocaleDateString();
    
    const packageHTML = `
        <div class="package-item">
            <div class="package-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div class="package-info">
                <div class="package-header-line">
                    <h3 class="package-title-text">Closeout Package - ${dateStr}</h3>
                    <span class="package-status-badge package-status-ready">Ready</span>
                </div>
                <p class="package-status-message">Package generated successfully</p>
                <div class="package-stats-row">
                    <span class="package-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        48 photos
                    </span>
                    <span class="package-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        0 captures
                    </span>
                    <span class="package-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        0 files
                    </span>
                </div>
            </div>
            <div class="package-actions-group">
                <button class="btn-download-pdf" data-package-id="${packageId}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PDF
                </button>
                <button class="btn-delete-pdf" data-package-id="${packageId}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    packagesList.insertAdjacentHTML('afterbegin', packageHTML);
    
    // Attach event listeners to new buttons
    const newItem = packagesList.firstElementChild;
    const downloadBtn = newItem.querySelector('.btn-download-pdf');
    const deleteBtn = newItem.querySelector('.btn-delete-pdf');
    
    downloadBtn.addEventListener('click', function() {
        downloadPackage(packageId);
    });
    
    deleteBtn.addEventListener('click', function() {
        deletePackage(packageId, newItem);
    });
}

// ==========================================
// DOWNLOAD PACKAGE
// ==========================================
function downloadPackage(packageId) {
    console.log('Downloading package:', packageId);
    showNotification('Downloading closeout package...', 'info');
    
    // TODO: Implement actual download
    setTimeout(() => {
        showNotification('Download started', 'success');
    }, 500);
}

// ==========================================
// DELETE PACKAGE
// ==========================================
function initDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.btn-delete-pdf');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const packageId = this.getAttribute('data-package-id');
            const packageItem = this.closest('.package-item');
            deletePackage(packageId, packageItem);
        });
    });
}

function deletePackage(packageId, packageElement) {
    if (!confirm('Are you sure you want to delete this closeout package? This action cannot be undone.')) {
        return;
    }
    
    console.log('Deleting package:', packageId);
    showNotification('Deleting package...', 'info');
    
    // TODO: Send to backend
    setTimeout(() => {
        packageElement.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            packageElement.remove();
            showNotification('Package deleted successfully', 'success');
        }, 300);
    }, 500);
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