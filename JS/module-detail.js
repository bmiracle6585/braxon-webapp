// ==========================================
// MODULE DETAIL PAGE - DYNAMIC DATA FROM API
// ==========================================

let currentModule = null;
let currentSite = 'a';
let projectId = null;
let moduleId = null;
let userRole = 'admin';
let checklistItems = [];
let currentLightboxIndex = 0;
let currentLightboxPhotos = [];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initModuleDetail();
});

function initModuleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('projectId');
    moduleId = urlParams.get('moduleId');
    currentSite = urlParams.get('site') || 'a';
    
    if (!projectId || !moduleId) {
        showNotification('Missing project or module ID', 'error');
        console.error('Missing URL parameters:', { projectId, moduleId });
        return;
    }
    
    console.log('🎬 Initializing module detail:', { projectId, moduleId, currentSite });
    
    userRole = getUserRole();
    initLightbox();
    loadModuleData();
}

// ==========================================
// LOAD MODULE DATA FROM API
// ==========================================
async function loadModuleData() {
    try {
        console.log(`📸 Loading module ${moduleId} for project ${projectId}`);
        
        const token = localStorage.getItem('token');
        
        // Call the photo-documentation API to get this specific module
        const response = await fetch(`http://localhost:5000/api/photo-documentation/project/${projectId}?site=${currentSite}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        console.log('📸 API Response:', result);
        
        if (!result.success) {
            showNotification('Failed to load module data', 'error');
            return;
        }
        
        // Find the specific module we're viewing
        const moduleData = result.data.find(m => m.project_module_id == moduleId);
        
        if (!moduleData) {
            showNotification('Module not found', 'error');
            console.error('Module not found in API response');
            return;
        }
        
        console.log('✅ Found module data:', moduleData);
        
        currentModule = {
            id: moduleData.project_module_id,
            name: moduleData.module_name,
            description: moduleData.module_description,
            site: result.site,
            totalRequiredPhotos: moduleData.total_required_photos,
            totalUploadedPhotos: moduleData.total_uploaded_photos || 0,
            completionPercentage: moduleData.completion_percentage || 0
        };
        
        checklistItems = moduleData.checklist_items || [];
        
        console.log(`✅ Loaded ${checklistItems.length} checklist items`);
        
        // Update UI
        updatePageHeader();
        updateProgressSummary();
        loadChecklist();
        
    } catch (error) {
        console.error('❌ Error loading module data:', error);
        showNotification('Error loading module data: ' + error.message, 'error');
    }
}

function updatePageHeader() {
    document.getElementById('moduleName').textContent = currentModule.name;
    
    const labelElement = document.getElementById('moduleLabel');
    if (currentModule.description) {
        labelElement.textContent = currentModule.description;
        labelElement.style.display = 'inline-flex';
    } else {
        labelElement.style.display = 'none';
    }
    
    const siteBadge = document.getElementById('siteBadge');
    siteBadge.textContent = currentModule.site;
    siteBadge.className = `site-badge site-badge-${currentSite}`;
    
    const backLink = document.getElementById('backLink');
    backLink.href = `photo-documentation.html?projectId=${projectId}&site=${currentSite}`;
}

function updateProgressSummary() {
    const completion = currentModule.completionPercentage || 0;
    const uploaded = currentModule.totalUploadedPhotos || 0;
    const required = currentModule.totalRequiredPhotos || 0;
    
    // Count additional (non-required) photos
    const additionalCount = checklistItems
        .filter(item => !item.is_required)
        .reduce((sum, item) => sum + (item.uploaded_count || 0), 0);
    
    document.getElementById('completionPercentage').textContent = `${completion}%`;
    document.getElementById('progressBar').style.width = `${completion}%`;
    document.getElementById('uploadedCount').textContent = uploaded;
    document.getElementById('requiredCount').textContent = required;
    document.getElementById('additionalCount').textContent = additionalCount;
}

// ==========================================
// LOAD CHECKLIST ITEMS
// ==========================================
function loadChecklist() {
    const checklistContainer = document.getElementById('photoChecklist');
    checklistContainer.innerHTML = '';
    
    if (checklistItems.length === 0) {
        checklistContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #6B7280;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; color: #D1D5DB;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Checklist Items</h3>
                <p style="font-size: 14px;">This module doesn't have any photo requirements configured yet.</p>
            </div>
        `;
        return;
    }
    
    console.log('📋 Rendering checklist items:', checklistItems);
    
    checklistItems.forEach((item, index) => {
        const checklistItemElement = createChecklistItem(item, index + 1);
        checklistContainer.appendChild(checklistItemElement);
    });
}

function createChecklistItem(item, displayNumber) {
    const hasPhotos = item.uploaded_count > 0;
    const isComplete = item.uploaded_count >= item.required_photo_count;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = `checklist-photo-item ${isComplete ? 'approved' : ''}`;
    itemDiv.setAttribute('data-item-id', item.id);
    
    // Status badge
    let statusBadge = '';
    if (isComplete) {
        statusBadge = '<span class="photo-status-badge status-approved">✓ Complete</span>';
    } else if (hasPhotos) {
        statusBadge = '<span class="photo-status-badge status-pending">In Progress</span>';
    } else {
        statusBadge = '<span class="photo-status-badge status-pending">Not Started</span>';
    }
    
    // Required badge
    const requiredBadge = item.is_required 
        ? '<span class="required-badge">Required</span>' 
        : '<span class="optional-badge">Optional</span>';
    
// Photo content
let photoContent = '';

if (hasPhotos) {
    // Show actual photo thumbnails (will load from API)
    photoContent = `
        <div class="photo-thumbnails-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 12px;">
            <div class="photo-thumbnail-loading" data-item-id="${item.id}" style="aspect-ratio: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; cursor: pointer; position: relative; overflow: hidden;" onclick="openLightboxForItem(${item.id})">
                ${item.uploaded_count}
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.2s; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(0,0,0,0.3)'" onmouseout="this.style.background='rgba(0,0,0,0)'">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </div>
                <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${item.uploaded_count} photo${item.uploaded_count > 1 ? 's' : ''}
                </div>
            </div>
        </div>
        <p class="photo-metadata" style="font-size: 13px; color: #6B7280; margin-bottom: 12px;">${item.uploaded_count} of ${item.required_photo_count} photos uploaded</p>
    `;
    
    // Load actual thumbnails asynchronously
    setTimeout(() => loadThumbnailsForItem(item.id), 100);
} else {
    photoContent = `
        <div class="empty-photo-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>No photos uploaded yet</p>
            <p style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Required: ${item.required_photo_count} photo${item.required_photo_count > 1 ? 's' : ''}</p>
        </div>
    `;
}
    
    // Action buttons
    let actionButtons = '';
    
    if (canUploadPhotos()) {
        if (isMobileDevice()) {
            actionButtons += `
                <button class="btn-primary btn-upload-photo" onclick="openCamera(${item.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    ${hasPhotos ? 'Add More Photos' : 'Open Camera'}
                </button>
            `;
        } else {
            actionButtons += `
                <button class="btn-primary btn-upload-photo" onclick="uploadPhotoDesktop(${item.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    ${hasPhotos ? 'Upload More' : 'Upload Photos'}
                </button>
            `;
        }
    }
    
    itemDiv.innerHTML = `
        <div class="checklist-number">${displayNumber}</div>
        <div class="photo-item-content">
            <div class="photo-item-header">
                <div class="photo-item-title-row">
                    <h3 class="photo-item-title">${item.item_name}</h3>
                    ${requiredBadge}
                </div>
                ${statusBadge}
            </div>
            ${item.description ? `<p style="font-size: 14px; color: #6B7280; margin-bottom: 12px;">${item.description}</p>` : ''}
            ${photoContent}
            ${actionButtons ? `<div class="photo-item-actions">${actionButtons}</div>` : ''}
        </div>
    `;
    
    return itemDiv;
}

// ==========================================
// LOAD ACTUAL PHOTO THUMBNAILS
// ==========================================
async function loadThumbnailsForItem(checklistItemId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/checklist-item/${checklistItemId}/photos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            const photos = result.data;
            
            // Find the thumbnail container
            const container = document.querySelector(`.photo-thumbnail-loading[data-item-id="${checklistItemId}"]`);
            
            if (container && container.parentElement) {
                const grid = container.parentElement;
                grid.innerHTML = ''; // Clear loading placeholder
                
                // Create thumbnail for each photo
                photos.forEach((photo, index) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = 'photo-thumbnail';
                    thumbnail.style.cssText = `
                        aspect-ratio: 1;
                        border-radius: 8px;
                        overflow: hidden;
                        cursor: pointer;
                        position: relative;
                        background: #F3F4F6;
                        transition: transform 0.2s, box-shadow 0.2s;
                    `;
                    
                    thumbnail.innerHTML = `
                        <img src="${photo.photo_url}" alt="Photo ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div class="photo-thumbnail-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.2s; display: flex; align-items: center; justify-content: center;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="opacity: 0; transition: opacity 0.2s;">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </div>
                    `;
                    
                    // Hover effects
                    thumbnail.addEventListener('mouseenter', function() {
                        this.style.transform = 'scale(1.05)';
                        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        const overlay = this.querySelector('.photo-thumbnail-overlay');
                        const icon = this.querySelector('svg');
                        if (overlay) overlay.style.background = 'rgba(0,0,0,0.3)';
                        if (icon) icon.style.opacity = '1';
                    });
                    
                    thumbnail.addEventListener('mouseleave', function() {
                        this.style.transform = 'scale(1)';
                        this.style.boxShadow = 'none';
                        const overlay = this.querySelector('.photo-thumbnail-overlay');
                        const icon = this.querySelector('svg');
                        if (overlay) overlay.style.background = 'rgba(0,0,0,0)';
                        if (icon) icon.style.opacity = '0';
                    });
                    
                    // Click to open lightbox at this photo
                    thumbnail.addEventListener('click', function() {
                        currentLightboxPhotos = photos;
                        currentLightboxIndex = index;
                        showPhotoInLightbox(index);
                    });
                    
                    grid.appendChild(thumbnail);
                });
                
                console.log(`✅ Loaded ${photos.length} thumbnails for checklist item ${checklistItemId}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading thumbnails:', error);
    }
}

// ==========================================
// PERMISSION CHECKS
// ==========================================
function getUserRole() {
    return localStorage.getItem('userRole') || 'field';
}

function canUploadPhotos() {
    return ['admin', 'pm', 'field'].includes(userRole);
}

function canApprovePhotos() {
    return ['admin', 'pm'].includes(userRole);
}

function canManagePhotos() {
    return ['admin', 'pm'].includes(userRole);
}

// ==========================================
// PHOTO UPLOAD FUNCTIONS
// ==========================================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function openCamera(itemId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = true; // Allow multiple photos
    
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            uploadMultiplePhotos(itemId, files);
        }
    };
    
    input.click();
}

function uploadPhotoDesktop(itemId) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'uploadModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <div class="modal-header">
                <h2 class="modal-title">Upload Photos</h2>
                <button class="modal-close" id="closeUploadModal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-description">Upload one or more photos for this checklist item:</p>
                
                <div class="upload-drop-zone-mini" id="uploadDropZone">
                    <div class="upload-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <h3 class="upload-main-text">Drag & drop, paste (Ctrl+V), or click to upload</h3>
                    <p class="upload-description">You can upload multiple photos at once</p>
                    <p class="upload-formats">Supports JPG, PNG, HEIC and other image formats</p>
                    <button class="btn-browse-files" id="browseBtnModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Browse Files
                    </button>
                </div>
                <input type="file" id="fileInputModal" accept="image/*" multiple style="display: none;">
                
                <div id="photoPreviewArea" style="display: none; margin-top: 20px;">
                    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Selected Photos (<span id="photoCount">0</span>):</h3>
                    <div id="photoPreviewGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; max-height: 300px; overflow-y: auto; padding: 12px; background: #F9FAFB; border-radius: 8px;"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelUploadBtn">Cancel</button>
                <button class="btn-primary" id="confirmUploadBtn" disabled>Upload <span id="uploadCount">0</span> Photo(s)</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const dropZone = document.getElementById('uploadDropZone');
    const fileInput = document.getElementById('fileInputModal');
    const browseBtn = document.getElementById('browseBtnModal');
    const closeBtn = document.getElementById('closeUploadModal');
    const cancelBtn = document.getElementById('cancelUploadBtn');
    const confirmBtn = document.getElementById('confirmUploadBtn');
    const previewArea = document.getElementById('photoPreviewArea');
    const previewGrid = document.getElementById('photoPreviewGrid');
    const photoCount = document.getElementById('photoCount');
    const uploadCount = document.getElementById('uploadCount');
    
    let selectedFiles = [];
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    const updatePreviews = () => {
        previewGrid.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.style.cssText = 'position: relative; border-radius: 6px; overflow: hidden; aspect-ratio: 1; background: #E5E7EB;';
                preview.innerHTML = `
                    <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
                    <button onclick="removePreview(${index})" style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.7); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;">×</button>
                `;
                previewGrid.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
        
        photoCount.textContent = selectedFiles.length;
        uploadCount.textContent = selectedFiles.length;
        previewArea.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        confirmBtn.disabled = selectedFiles.length === 0;
    };
    
    window.removePreview = (index) => {
        selectedFiles.splice(index, 1);
        updatePreviews();
    };
    
    const handleFiles = (files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        selectedFiles = [...selectedFiles, ...imageFiles];
        updatePreviews();
    };
    
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'));
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
    });
    
    dropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });
    
    const handlePaste = (e) => {
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
    };
    
    document.addEventListener('paste', handlePaste);
    
    confirmBtn.addEventListener('click', () => {
        if (selectedFiles.length > 0) {
            uploadMultiplePhotos(itemId, selectedFiles);
            closeModal();
        }
    });
    
    modal.addEventListener('DOMNodeRemoved', () => {
        document.removeEventListener('paste', handlePaste);
    });
}
// ==========================================
// UPLOAD MULTIPLE PHOTOS TO BACKEND
// ==========================================
async function uploadMultiplePhotos(checklistItemId, files) {
    if (!files || files.length === 0) {
        showNotification('No files selected', 'error');
        return;
    }
    
    showNotification(`Uploading ${files.length} photo(s)...`, 'info');
    
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        // Add all files to FormData
        files.forEach((file, index) => {
            formData.append('photos', file);
        });
        
        // Add metadata
        formData.append('project_id', projectId);
        formData.append('project_site_module_id', moduleId);
        formData.append('checklist_item_id', checklistItemId);
        
        console.log('📤 Uploading photos:', {
            project_id: projectId,
            module_id: moduleId,
            checklist_item_id: checklistItemId,
            file_count: files.length
        });
        
        const response = await fetch('http://localhost:5000/api/photo-documentation/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ ${files.length} photo(s) uploaded successfully!`, 'success');
            
            // Reload module data to refresh counts
            await loadModuleData();
        } else {
            showNotification('Upload failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        showNotification('Upload failed: ' + error.message, 'error');
    }
}

// ==========================================
// LIGHTBOX FUNCTIONS
// ==========================================
function initLightbox() {
    const lightbox = document.getElementById('photoLightbox');
    const closeBtn = document.getElementById('closeLightbox');
    const prevBtn = document.getElementById('prevPhoto');
    const nextBtn = document.getElementById('nextPhoto');
    
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', showPrevPhoto);
    if (nextBtn) nextBtn.addEventListener('click', showNextPhoto);
    
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevPhoto();
            if (e.key === 'ArrowRight') showNextPhoto();
        }
    });
}

async function openLightboxForItem(checklistItemId) {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch photos for this checklist item
        const response = await fetch(`http://localhost:5000/api/photo-documentation/checklist-item/${checklistItemId}/photos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            currentLightboxPhotos = result.data;
            currentLightboxIndex = 0;
            showPhotoInLightbox(0);
        } else {
            showNotification('No photos to display', 'info');
        }
        
    } catch (error) {
        console.error('❌ Error loading photos:', error);
        showNotification('Failed to load photos', 'error');
    }
}

function showPhotoInLightbox(index) {
    if (!currentLightboxPhotos || currentLightboxPhotos.length === 0) return;
    
    currentLightboxIndex = index;
    const photo = currentLightboxPhotos[index];
    
    const lightbox = document.getElementById('photoLightbox');
    const image = document.getElementById('lightboxImage');
    const title = document.getElementById('lightboxTitle');
    const date = document.getElementById('lightboxDate');
    const uploader = document.getElementById('lightboxUploader');
    
    image.src = photo.photo_url;
    title.textContent = `Photo ${index + 1} of ${currentLightboxPhotos.length}`;
    date.textContent = `Uploaded ${formatDate(photo.uploaded_at)}`;
    uploader.textContent = `by ${photo.uploaded_by_name || 'Unknown'}`;
    
    // Show/hide navigation buttons
    const prevBtn = document.getElementById('prevPhoto');
    const nextBtn = document.getElementById('nextPhoto');
    
    if (prevBtn) prevBtn.style.display = index > 0 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = index < currentLightboxPhotos.length - 1 ? 'flex' : 'none';
    
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('photoLightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    currentLightboxPhotos = [];
    currentLightboxIndex = 0;
}

function showPrevPhoto() {
    if (currentLightboxIndex > 0) {
        showPhotoInLightbox(currentLightboxIndex - 1);
    }
}

function showNextPhoto() {
    if (currentLightboxIndex < currentLightboxPhotos.length - 1) {
        showPhotoInLightbox(currentLightboxIndex + 1);
    }
}

// ==========================================
// QA FUNCTIONS (For PM/Admin)
// ==========================================
async function approvePhoto(photoId) {
    if (!canApprovePhotos()) {
        showNotification('You do not have permission to approve photos', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/photo/${photoId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Photo approved!', 'success');
            await loadModuleData();
        } else {
            showNotification('Approval failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Approval error:', error);
        showNotification('Approval failed: ' + error.message, 'error');
    }
}

async function rejectPhoto(photoId) {
    if (!canApprovePhotos()) {
        showNotification('You do not have permission to reject photos', 'error');
        return;
    }
    
    const reason = prompt('Please provide a reason for rejection (required):');
    if (!reason || reason.trim() === '') {
        showNotification('Rejection reason is required', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/photo/${photoId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Photo rejected. Field personnel will be notified.', 'warning');
            await loadModuleData();
        } else {
            showNotification('Rejection failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Rejection error:', error);
        showNotification('Rejection failed: ' + error.message, 'error');
    }
}

async function deletePhoto(photoId) {
    if (!canManagePhotos()) {
        showNotification('You do not have permission to delete photos', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/photo/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Photo deleted', 'success');
            closeLightbox();
            await loadModuleData();
        } else {
            showNotification('Delete failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Delete error:', error);
        showNotification('Delete failed: ' + error.message, 'error');
    }
}

// ==========================================
// MARK AS N/A
// ==========================================
async function markAsNA(checklistItemId) {
    if (!canManagePhotos()) {
        showNotification('You do not have permission to mark items as N/A', 'error');
        return;
    }
    
    const reason = prompt('Please provide a reason why this photo is not applicable (required):');
    if (!reason || reason.trim() === '') {
        showNotification('N/A reason is required', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/checklist-item/${checklistItemId}/mark-na`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Item marked as N/A', 'info');
            await loadModuleData();
        } else {
            showNotification('Failed to mark as N/A: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Mark N/A error:', error);
        showNotification('Failed to mark as N/A: ' + error.message, 'error');
    }
}

async function removeNA(checklistItemId) {
    if (!canManagePhotos()) {
        showNotification('You do not have permission to change N/A status', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/checklist-item/${checklistItemId}/remove-na`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('N/A status removed', 'info');
            await loadModuleData();
        } else {
            showNotification('Failed to remove N/A: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Remove N/A error:', error);
        showNotification('Failed to remove N/A: ' + error.message, 'error');
    }
}

// ==========================================
// NOTES FUNCTIONS
// ==========================================
async function saveNotes(checklistItemId) {
    const textarea = document.getElementById(`notes-${checklistItemId}`);
    if (!textarea) return;
    
    const notes = textarea.value;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/photo-documentation/checklist-item/${checklistItemId}/notes`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Notes saved', 'success');
        } else {
            showNotification('Failed to save notes: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Save notes error:', error);
        showNotification('Failed to save notes: ' + error.message, 'error');
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
        document.body.appendChild(container);
    }
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add CSS animation for notifications
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .drag-over {
            border-color: #3B82F6 !important;
            background-color: #EFF6FF !important;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// UPLOAD MORE BUTTON
// ==========================================
document.getElementById('uploadMoreBtn')?.addEventListener('click', function() {
    showNotification('Please select a specific checklist item to upload photos', 'info');
});