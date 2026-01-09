// ==========================================
// PHOTO DOCUMENTATION PAGE
// ==========================================

// Global variables
let SITE_MODULES = {
    'a': [],
    'b': []
};

let currentSite = 'a';
let projectId = null;
let uploadedFiles = [];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initPhotoDocumentation();
});

function initPhotoDocumentation() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('projectId') || '7';
    currentSite = urlParams.get('site') || 'a';
    
    console.log('🎬 Initializing photo documentation:', { projectId, currentSite });
    
    // Update site name in header
    const siteName = document.getElementById('siteName');
    if (siteName) {
        siteName.textContent = currentSite === 'a' ? 'Site A' : 'Site B';
    }
    
    // Initialize upload functionality
    initUploadZone();
    initPasteSupport();
    initBrowseButton();
    
    // Initialize modal
    initAssignmentModal();
    
    // Load modules
    loadModules();
}

// ==========================================
// LOAD MODULES FROM API
// ==========================================
async function loadModules() {
    const container = document.getElementById('moduleWidgetsContainer');
    
    if (!container) {
        console.error('❌ Container not found!');
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6B7280;">Loading modules...</div>';
    
    try {
        console.log(`📸 Loading modules for project ${projectId}, Site ${currentSite.toUpperCase()}`);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/photo-documentation/project/${projectId}?site=${currentSite}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        console.log('📸 API Response:', result);
        
        if (!result.success) {
            console.error('❌ Failed to load modules:', result.message);
            showNoModulesState();
            return;
        }
        
        const modules = result.data;
        console.log(`✅ Loaded ${modules.length} modules`);
        
        if (modules.length === 0) {
            showNoModulesState();
            return;
        }
        
        // Update global SITE_MODULES
        SITE_MODULES[currentSite] = modules.map(m => ({
            id: m.project_module_id,
            name: m.module_name,
            label: m.module_description || '',
            photoCount: m.total_required_photos,
            uploadedPhotos: m.total_uploaded_photos || 0,
            checklistItems: m.checklist_items || []
        }));
        
        console.log('📦 SITE_MODULES updated:', SITE_MODULES[currentSite]);
        
        // Clear container
        container.innerHTML = '';
        
        // Create and append widgets
        SITE_MODULES[currentSite].forEach((module, index) => {
            console.log(`🎨 Creating widget ${index + 1}:`, module);
            const widget = createModuleWidget(module);
            container.appendChild(widget);
        });
        
        console.log('✅ All module widgets rendered!');
        
    } catch (error) {
        console.error('❌ Error loading modules:', error);
        showErrorState(error.message);
    }
}

function showNoModulesState() {
    const container = document.getElementById('moduleWidgetsContainer');
    container.innerHTML = `
        <div class="no-modules-state" style="text-align: center; padding: 60px 20px; background: #F9FAFB; border-radius: 8px; border: 2px dashed #D1D5DB;">
            <div class="no-modules-icon" style="margin-bottom: 20px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5" style="margin: 0 auto;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 8px;">No Modules Configured</h3>
            <p style="font-size: 14px; color: #6B7280; margin-bottom: 20px;">No photo modules have been configured for ${currentSite === 'a' ? 'Site A' : 'Site B'}.</p>
            <a href="site-module-entry.html?projectId=${projectId}" style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Configure Modules
            </a>
        </div>
    `;
}

function showErrorState(errorMessage) {
    const container = document.getElementById('moduleWidgetsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #EF4444;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 20px; color: #EF4444;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 style="margin-bottom: 10px; font-size: 18px; font-weight: 600;">Error Loading Modules</h3>
            <p style="color: #6B7280; margin-bottom: 20px;">${errorMessage}</p>
            <button onclick="loadModules()" style="padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                Retry
            </button>
        </div>
    `;
}

// ==========================================
// CREATE MODULE WIDGET
// ==========================================
function createModuleWidget(module) {
    const completion = module.photoCount > 0 
        ? Math.round((module.uploadedPhotos / module.photoCount) * 100) 
        : 0;
    
    const widget = document.createElement('div');
    widget.className = 'module-widget';
    widget.style.cssText = `
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    
    widget.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <div style="flex: 1;">
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${module.name}</h3>
                ${module.label ? `<p style="font-size: 14px; color: #6B7280; margin-bottom: 12px;">${module.label}</p>` : ''}
                
                <div style="display: flex; gap: 24px; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 12px; color: #6B7280; display: block; margin-bottom: 4px;">Photos</span>
                        <span style="font-size: 16px; font-weight: 600; color: #111827;">${module.uploadedPhotos} / ${module.photoCount}</span>
                    </div>
                    <div>
                        <span style="font-size: 12px; color: #6B7280; display: block; margin-bottom: 4px;">Completion</span>
                        <span style="font-size: 16px; font-weight: 600; color: ${completion === 100 ? '#10B981' : '#3B82F6'};">${completion}%</span>
                    </div>
                </div>
                
                <div style="background: #F3F4F6; border-radius: 9999px; height: 8px; overflow: hidden;">
                    <div style="width: ${completion}%; height: 100%; background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%); transition: width 0.3s;"></div>
                </div>
                
                <div style="margin-top: 12px; font-size: 13px; color: #6B7280;">
                    ${module.checklistItems.length} checklist items
                </div>
            </div>
        </div>
    `;
    
    widget.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        this.style.borderColor = '#3B82F6';
    });
    
    widget.addEventListener('mouseleave', function() {
        this.style.boxShadow = 'none';
        this.style.borderColor = '#E5E7EB';
    });
    
    widget.addEventListener('click', function() {
        openModuleDetail(module);
    });
    
    return widget;
}

function openModuleDetail(module) {
    console.log('📂 Opening module detail:', module);
    
    // Get current URL params
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId') || '7';
    const site = currentSite || 'a';
    
    // Navigate to module detail page with proper params
    window.location.href = `module-detail.html?projectId=${projectId}&moduleId=${module.id}&site=${site}`;
}

// ==========================================
// UPLOAD FUNCTIONALITY
// ==========================================
function initUploadZone() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function initBrowseButton() {
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
    }
}

function initPasteSupport() {
    document.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        const files = [];
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                files.push(items[i].getAsFile());
            }
        }
        
        if (files.length > 0) {
            handleFiles(files);
        }
    });
}

function handleFiles(files) {
    uploadedFiles = Array.from(files);
    if (uploadedFiles.length > 0) {
        showNotification(`${uploadedFiles.length} photo(s) ready for assignment`, 'success');
        openAssignmentModal();
    }
}

function initAssignmentModal() {
    // Modal initialization code
}

function openAssignmentModal() {
    showNotification('Assignment modal coming soon', 'info');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}