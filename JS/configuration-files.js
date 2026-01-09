// ==========================================
// CONFIGURATION FILES PAGE
// ==========================================

let currentSite = 'a';
let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    initConfigurationFiles();
});

function initConfigurationFiles() {
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
    initBrowseButton();
    
    // Initialize action buttons
    initActionButtons();
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

function handleFiles(files) {
    uploadedFiles = Array.from(files);
    
    if (uploadedFiles.length === 0) return;
    
    // Validate file types
    const invalidFiles = uploadedFiles.filter(file => {
        const ext = getFileExtension(file.name);
        const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'xml', 'json', 'cfg', 'config', 'conf'];
        return !validExtensions.includes(ext.toLowerCase());
    });
    
    if (invalidFiles.length > 0) {
        showNotification('Some files have invalid formats and will be skipped', 'error');
        uploadedFiles = uploadedFiles.filter(file => !invalidFiles.includes(file));
    }
    
    if (uploadedFiles.length > 20) {
        showNotification('Maximum 20 files allowed per batch', 'error');
        uploadedFiles = uploadedFiles.slice(0, 20);
    }
    
    if (uploadedFiles.length === 0) return;
    
    // TODO: Upload to backend
    console.log('Uploading files:', uploadedFiles);
    showNotification(`Uploading ${uploadedFiles.length} file(s)...`, 'info');
    
    // Simulate upload
    setTimeout(() => {
        showNotification('Files uploaded successfully', 'success');
        addFilesToList(uploadedFiles);
        uploadedFiles = [];
    }, 1500);
}

function addFilesToList(files) {
    const filesList = document.getElementById('configFilesList');
    const emptyState = document.getElementById('emptyState');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    files.forEach((file, index) => {
        const fileId = Date.now() + index;
        const ext = getFileExtension(file.name);
        const iconClass = getFileIconClass(ext);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'config-file-item';
        fileItem.setAttribute('data-file-id', fileId);
        
        fileItem.innerHTML = `
            <div class="file-icon ${iconClass}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span class="file-extension">${ext.toUpperCase()}</span>
            </div>
            <div class="file-details">
                <h3 class="file-name">${file.name}</h3>
                <div class="file-meta">
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="file-date">Uploaded ${new Date().toLocaleString()}</span>
                    <span class="file-uploader">by Blake Miracle</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="btn-download-file" data-file-id="${fileId}" title="Download file">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <button class="btn-delete-file" data-file-id="${fileId}" title="Delete file">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        
        filesList.appendChild(fileItem);
    });
    
    // Reinitialize action buttons for new items
    initActionButtons();
    updateFilesCount();
}

// ==========================================
// ACTION BUTTONS
// ==========================================
function initActionButtons() {
    const downloadButtons = document.querySelectorAll('.btn-download-file');
    const deleteButtons = document.querySelectorAll('.btn-delete-file');
    
    downloadButtons.forEach(button => {
        button.removeEventListener('click', handleDownload); // Remove old listeners
        button.addEventListener('click', handleDownload);
    });
    
    deleteButtons.forEach(button => {
        button.removeEventListener('click', handleDelete); // Remove old listeners
        button.addEventListener('click', handleDelete);
    });
}

function handleDownload(e) {
    e.stopPropagation();
    const fileId = this.getAttribute('data-file-id');
    downloadFile(fileId);
}

function handleDelete(e) {
    e.stopPropagation();
    const fileId = this.getAttribute('data-file-id');
    deleteFile(fileId);
}

function downloadFile(fileId) {
    const fileItem = document.querySelector(`.config-file-item[data-file-id="${fileId}"]`);
    if (!fileItem) return;
    
    const filename = fileItem.querySelector('.file-name').textContent;
    
    console.log('Downloading file:', filename);
    showNotification(`Downloading ${filename}...`, 'info');
    
    // TODO: Implement actual download from backend
    setTimeout(() => {
        showNotification('Download started', 'success');
    }, 500);
}

function deleteFile(fileId) {
    const fileItem = document.querySelector(`.config-file-item[data-file-id="${fileId}"]`);
    if (!fileItem) return;
    
    const filename = fileItem.querySelector('.file-name').textContent;
    
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
        return;
    }
    
    showNotification('Deleting file...', 'info');
    
    // TODO: Send delete request to backend
    setTimeout(() => {
        fileItem.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            fileItem.remove();
            updateFilesCount();
            showNotification('File deleted successfully', 'success');
            checkEmptyState();
        }, 300);
    }, 500);
}

function checkEmptyState() {
    const filesList = document.getElementById('configFilesList');
    const items = filesList.querySelectorAll('.config-file-item');
    
    if (items.length === 0) {
        filesList.innerHTML = `
            <div class="empty-state-files" id="emptyState">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m8.66-9.66l-5.2 3m-6.92 4l-5.2 3M1.34 9.66l5.2 3m6.92 4l5.2 3"></path>
                </svg>
                <h3>No configuration files uploaded yet</h3>
                <p>Upload system configuration files using the upload area above.</p>
            </div>
        `;
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function updateFilesCount() {
    const count = document.querySelectorAll('.config-file-item').length;
    const countElement = document.getElementById('filesCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function getFileIconClass(extension) {
    const ext = extension.toLowerCase();
    
    if (ext === 'pdf') return 'file-icon-pdf';
    if (ext === 'doc' || ext === 'docx') return 'file-icon-doc';
    if (ext === 'xls' || ext === 'xlsx') return 'file-icon-xls';
    if (ext === 'txt') return 'file-icon-txt';
    if (ext === 'cfg' || ext === 'config' || ext === 'conf') return 'file-icon-cfg';
    if (ext === 'json') return 'file-icon-json';
    if (ext === 'xml') return 'file-icon-xml';
    if (ext === 'csv') return 'file-icon-csv';
    
    return 'file-icon-other';
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