// ==========================================
// SCREEN CAPTURES PAGE
// ==========================================

let currentSite = 'a';
let uploadedFiles = [];
let draggedElement = null;

document.addEventListener('DOMContentLoaded', function() {
    initScreenCaptures();
});

function initScreenCaptures() {
    // Get site from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentSite = urlParams.get('site') || 'a';
    
    // Update site name
    const siteName = document.getElementById('siteName');
    if (siteName) {
        siteName.textContent = currentSite === 'a' ? 'Site A' : 'Site B';
    }
    
    // Initialize upload functionality
    initUploadZone();
    initPasteSupport();
    initBrowseButton();
    
    // Initialize drag & drop reordering
    initDragAndDrop();
    
    // Initialize action buttons
    initActionButtons();
    
    // Initialize image modal
    initImageModal();
}

// ==========================================
// UPLOAD FUNCTIONALITY
// ==========================================
function initUploadZone() {
    const dropZone = document.getElementById('dropZone');
    
    if (!dropZone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle click
    dropZone.addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function initBrowseButton() {
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });
    }
    
    if (fileInput) {
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
                const file = items[i].getAsFile();
                files.push(file);
            }
        }
        
        if (files.length > 0) {
            handleFiles(files);
        }
    });
}

function handleFiles(files) {
    uploadedFiles = Array.from(files);
    
    if (uploadedFiles.length === 0) return;
    
    if (uploadedFiles.length > 30) {
        showNotification('Maximum 30 images allowed per batch', 'error');
        uploadedFiles = uploadedFiles.slice(0, 30);
    }
    
    // TODO: Upload to backend
    console.log('Uploading files:', uploadedFiles);
    showNotification(`Uploading ${uploadedFiles.length} screen capture(s)...`, 'info');
    
    // Simulate upload
    setTimeout(() => {
        showNotification('Screen captures uploaded successfully', 'success');
        addCapturesToList(uploadedFiles);
        uploadedFiles = [];
    }, 1500);
}

function addCapturesToList(files) {
    const capturesList = document.getElementById('capturesList');
    const emptyState = document.getElementById('emptyState');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const currentCount = capturesList.querySelectorAll('.capture-item').length;
    
    files.forEach((file, index) => {
        const captureId = Date.now() + index;
        const orderNumber = currentCount + index + 1;
        
        const captureItem = document.createElement('div');
        captureItem.className = 'capture-item';
        captureItem.draggable = true;
        captureItem.setAttribute('data-capture-id', captureId);
        
        // Create object URL for preview
        const imageUrl = URL.createObjectURL(file);
        
        captureItem.innerHTML = `
            <div class="capture-drag-handle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </div>
            <div class="capture-order-number">${orderNumber}</div>
            <div class="capture-thumbnail">
                <img src="${imageUrl}" alt="Screen capture ${orderNumber}">
            </div>
            <div class="capture-info">
                <h3 class="capture-filename">${file.name}</h3>
                <div class="capture-meta">
                    <span class="capture-size">${formatFileSize(file.size)}</span>
                    <span class="capture-date">Uploaded ${new Date().toLocaleString()}</span>
                    <span class="capture-uploader">by Blake Miracle</span>
                </div>
            </div>
            <div class="capture-actions">
                <button class="btn-view-capture" data-capture-id="${captureId}" title="View full size">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button class="btn-delete-capture" data-capture-id="${captureId}" title="Delete capture">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        
        capturesList.appendChild(captureItem);
    });
    
    // Reinitialize drag and drop for new items
    initDragAndDrop();
    initActionButtons();
    updateCaptureCount();
}

// ==========================================
// DRAG & DROP REORDERING
// ==========================================
function initDragAndDrop() {
    const captureItems = document.querySelectorAll('.capture-item');
    
    captureItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDropReorder);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove drag-over class from all items
    const items = document.querySelectorAll('.capture-item');
    items.forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDropReorder(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const capturesList = document.getElementById('capturesList');
        const allItems = Array.from(capturesList.querySelectorAll('.capture-item'));
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
        
        // Update order numbers
        updateOrderNumbers();
        
        // TODO: Save new order to backend
        showNotification('Order updated', 'success');
    }
    
    return false;
}

function updateOrderNumbers() {
    const items = document.querySelectorAll('.capture-item');
    items.forEach((item, index) => {
        const orderNumber = item.querySelector('.capture-order-number');
        if (orderNumber) {
            orderNumber.textContent = index + 1;
        }
    });
}

// ==========================================
// ACTION BUTTONS
// ==========================================
function initActionButtons() {
    const viewButtons = document.querySelectorAll('.btn-view-capture');
    const deleteButtons = document.querySelectorAll('.btn-delete-capture');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const captureId = this.getAttribute('data-capture-id');
            viewCapture(captureId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const captureId = this.getAttribute('data-capture-id');
            deleteCapture(captureId);
        });
    });
}

function viewCapture(captureId) {
    const captureItem = document.querySelector(`.capture-item[data-capture-id="${captureId}"]`);
    if (!captureItem) return;
    
    const thumbnail = captureItem.querySelector('.capture-thumbnail img');
    const filename = captureItem.querySelector('.capture-filename').textContent;
    
    openImageModal(thumbnail.src, filename);
}

function deleteCapture(captureId) {
    if (!confirm('Are you sure you want to delete this screen capture? This action cannot be undone.')) {
        return;
    }
    
    const captureItem = document.querySelector(`.capture-item[data-capture-id="${captureId}"]`);
    if (!captureItem) return;
    
    showNotification('Deleting screen capture...', 'info');
    
    // TODO: Send delete request to backend
    setTimeout(() => {
        captureItem.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            captureItem.remove();
            updateOrderNumbers();
            updateCaptureCount();
            showNotification('Screen capture deleted', 'success');
            
            checkEmptyState();
        }, 300);
    }, 500);
}

function checkEmptyState() {
    const capturesList = document.getElementById('capturesList');
    const items = capturesList.querySelectorAll('.capture-item');
    
    if (items.length === 0) {
        capturesList.innerHTML = `
            <div class="empty-state-captures" id="emptyState">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <h3>No screen captures uploaded yet</h3>
                <p>Upload system screenshots using the upload area above.</p>
            </div>
        `;
    }
}

// ==========================================
// IMAGE MODAL
// ==========================================
function initImageModal() {
    const modal = document.getElementById('viewImageModal');
    const closeBtn = document.getElementById('closeImageModal');
    
    closeBtn.addEventListener('click', closeImageModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

function openImageModal(imageSrc, filename) {
    const modal = document.getElementById('viewImageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('imageModalTitle');
    
    modalImage.src = imageSrc;
    modalTitle.textContent = filename;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('viewImageModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function updateCaptureCount() {
    const count = document.querySelectorAll('.capture-item').length;
    const countElement = document.getElementById('captureCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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