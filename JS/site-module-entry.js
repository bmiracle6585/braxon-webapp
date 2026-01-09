// ==========================================
// SITE MODULE ENTRY PAGE - BACKEND INTEGRATED
// ==========================================

// Module definitions with photo requirements
const MODULE_DEFINITIONS = {
    'antenna-installation': {
        name: 'Antenna Installation',
        photoCount: 12,  // ✅ CORRECTED
        photos: []
    },
    'waveguide-installation': {
        name: 'Waveguide Installation',
        photoCount: 18,  // ✅ CORRECTED
        photos: []
    },
    'odu-installation': {
        name: 'ODU Installation',
        photoCount: 5,  // ✅ CORRECTED
        photos: []
    },
    'hybrid-coax-fiber': {
        name: 'Hybrid or Coax/Fiber',
        photoCount: 14,  // ✅ CORRECTED
        photos: []
    },
    'ice-shield': {
        name: 'Ice Shield',
        photoCount: 5,  // ✅ CORRECTED
        photos: []
    },
    'radio-installation': {
        name: 'Radio Installation',
        photoCount: 9,  // ✅ CORRECTED
        photos: []
    },
    'overall-photos': {
        name: 'Overall Photos (from ground)',
        photoCount: 8,  // ✅ CORRECTED
        photos: []
    },
    'misc-photos': {
        name: 'Misc. Photos',
        photoCount: 1,  // ✅ CORRECTED
        photos: []
    }
};

let currentSite = null;
let selectedModuleType = null;
let editingModuleId = null;
let siteAModules = [];
let siteBModules = [];
let moduleIdCounter = 0;
let projectData = null; // Store project data globally

// ==========================================
// LOAD PROJECT DATA
// ==========================================
async function loadProjectInfo() {
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
            projectData = result.data;
            
            // Update page subtitle
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageSubtitle) {
                pageSubtitle.textContent = projectData.project_name;
            }
            
            // Update Site A name (in header)
            const siteATitle = document.querySelector('.site-module-card:nth-child(1) .site-module-name');
            if (siteATitle && projectData.site_a_name) {
                siteATitle.textContent = projectData.site_a_name;
            }
            
            // Update Site A name (in configured list)
            const siteAConfigured = document.querySelector('.configured-site-section:nth-child(1) .configured-site-title');
            if (siteAConfigured && projectData.site_a_name) {
                siteAConfigured.textContent = `Site A - ${projectData.site_a_name}`;
            }
            
            // Update Site B name (in header)
            const siteBTitle = document.querySelector('.site-module-card:nth-child(2) .site-module-name');
            if (siteBTitle && projectData.site_b_name) {
                siteBTitle.textContent = projectData.site_b_name;
            }
            
            // Update Site B name (in configured list)
            const siteBConfigured = document.querySelector('.configured-site-section:nth-child(2) .configured-site-title');
            if (siteBConfigured && projectData.site_b_name) {
                siteBConfigured.textContent = `Site B - ${projectData.site_b_name}`;
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
// HELPER FUNCTIONS (Define Early)
// ==========================================
function getModuleIdByType(type) {
    const moduleMap = {
        'antenna-installation': 1,
        'waveguide-installation': 2,
        'odu-installation': 3,
        'hybrid-coax-fiber': 4,
        'ice-shield': 5,
        'radio-installation': 6,
        'overall-photos': 7,
        'misc-photos': 8
    };
    return moduleMap[type];
}

function getModuleTypeById(id) {
    const moduleMap = {
        1: 'antenna-installation',
        2: 'waveguide-installation',
        3: 'odu-installation',
        4: 'hybrid-coax-fiber',
        5: 'ice-shield',
        6: 'radio-installation',
        7: 'overall-photos',
        8: 'misc-photos'
    };
    return moduleMap[id];
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

// ==========================================
// SAVE & LOAD FUNCTIONS (Define Early)
// ==========================================
async function saveModuleConfiguration() {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');

    if (!projectId) {
        showNotification('Error: No project ID found', 'error');
        return;
    }

    try {
        const modulesToSave = [
            ...siteAModules.map(m => ({
                site: 'Site A',
                moduleId: getModuleIdByType(m.type),
                customLabel: m.label || null
            })),
            ...siteBModules.map(m => ({
                site: 'Site B',
                moduleId: getModuleIdByType(m.type),
                customLabel: m.label || null
            }))
        ];

        console.log('Saving modules:', modulesToSave);

        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/modules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modules: modulesToSave })
        });

        const result = await response.json();
        console.log('Save result:', result);

        if (result.success) {
            showNotification('Module configuration saved successfully', 'success');
            updateModuleDisplay();
        } else {
            showNotification(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Failed to save module configuration', 'error');
    }
}

async function loadSavedModules() {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');

    if (!projectId) {
        console.error('No project ID in URL');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/modules`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log('📥 Loaded modules from backend:', result);

        if (result.success && result.data) {
            moduleIdCounter = 0;
            siteAModules = [];
            siteBModules = [];

            // Backend returns { site_A: [...], site_B: [...] }
            const siteAData = result.data.site_A || [];
            const siteBData = result.data.site_B || [];

            console.log('📍 Site A data:', siteAData);
            console.log('📍 Site B data:', siteBData);

            // Convert backend data to frontend format
            siteAModules = siteAData.map(m => {
                const moduleType = getModuleTypeById(m.installation_module_id);
                const moduleDef = MODULE_DEFINITIONS[moduleType];
                
                return {
                    id: `module-${moduleIdCounter++}`,
                    type: moduleType,
                    name: m.module_name || moduleDef.name,
                    label: m.custom_label || '',
                    photoCount: m.total_required_photos || moduleDef.photoCount,
                    photos: []
                };
            });

            siteBModules = siteBData.map(m => {
                const moduleType = getModuleTypeById(m.installation_module_id);
                const moduleDef = MODULE_DEFINITIONS[moduleType];
                
                return {
                    id: `module-${moduleIdCounter++}`,
                    type: moduleType,
                    name: m.module_name || moduleDef.name,
                    label: m.custom_label || '',
                    photoCount: m.total_required_photos || moduleDef.photoCount,
                    photos: []
                };
            });

            console.log('✅ Parsed Site A modules:', siteAModules);
            console.log('✅ Parsed Site B modules:', siteBModules);

            updateModuleDisplay();
        }
    } catch (error) {
        console.error('❌ Error loading modules:', error);
        showNotification('Failed to load saved modules', 'error');
    }
}

function initSaveButton() {
    const saveBtn = document.getElementById('saveModulesBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveModuleConfiguration();
        });
    }
}

// ==========================================
// DOCUMENT READY
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initModuleEntry();
});

function initModuleEntry() {
    loadProjectInfo(); // LOAD PROJECT DATA FIRST
    initAddButtons();
    initModuleSelectionModal();
    initLabelModal();
    initEditLabelModal();
    initSaveButton();
    loadSavedModules();
}

// ==========================================
// ADD MODULE BUTTONS
// ==========================================
function initAddButtons() {
    const addButtons = document.querySelectorAll('.btn-edit-modules');
    
    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentSite = this.getAttribute('data-site');
            openModuleSelectionModal(currentSite);
        });
    });
}

function openModuleSelectionModal(site) {
    const modal = document.getElementById('moduleSelectionModal');
    const modalTitle = document.getElementById('modalTitle');
    
    // Use real project data for site names
    let siteName = 'Site';
    if (site === 'a') {
        siteName = projectData && projectData.site_a_name ? 
            `Site A - ${projectData.site_a_name}` : 'Site A';
    } else {
        siteName = projectData && projectData.site_b_name ? 
            `Site B - ${projectData.site_b_name}` : 'Site B';
    }
    
    modalTitle.textContent = `Add Photo Module to ${siteName}`;
    
    // ✅ UPDATE PHOTO COUNTS IN MODAL
    updateModalPhotoCounts();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ✅ NEW FUNCTION: Update photo counts in modal cards
function updateModalPhotoCounts() {
    const moduleCards = document.querySelectorAll('.module-select-card');
    
    moduleCards.forEach(card => {
        const moduleType = card.getAttribute('data-module');
        const moduleDef = MODULE_DEFINITIONS[moduleType];
        
        if (moduleDef) {
            // Find the photo count paragraph
            const photoParagraph = card.querySelector('p');
            if (photoParagraph) {
                if (moduleType === 'misc-photos') {
                    photoParagraph.textContent = `${moduleDef.photoCount} photos`;
                } else {
                    photoParagraph.textContent = `${moduleDef.photoCount} photos required`;
                }
            }
        }
    });
}
// ==========================================
// MODULE SELECTION MODAL
// ==========================================
function initModuleSelectionModal() {
    const modal = document.getElementById('moduleSelectionModal');
    const closeBtn = document.getElementById('closeModuleModal');
    const moduleCards = document.querySelectorAll('.module-select-card');

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    moduleCards.forEach(card => {
        card.addEventListener('click', function() {
            selectedModuleType = this.getAttribute('data-module');
            closeModal();
            openLabelModal();
        });
    });
}

// ==========================================
// LABEL MODULE MODAL
// ==========================================
function initLabelModal() {
    const modal = document.getElementById('labelModuleModal');
    const closeBtn = document.getElementById('closeLabelModal');
    const cancelBtn = document.getElementById('cancelLabelModal');
    const confirmBtn = document.getElementById('confirmLabelModal');
    const labelInput = document.getElementById('moduleLabel');

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        labelInput.value = '';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    confirmBtn.addEventListener('click', function() {
        const label = labelInput.value.trim();
        addModuleToSite(selectedModuleType, label);
        closeModal();
    });

    labelInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
}

function openLabelModal() {
    const modal = document.getElementById('labelModuleModal');
    const description = document.getElementById('labelModalDescription');
    const moduleDef = MODULE_DEFINITIONS[selectedModuleType];
    
    description.textContent = `Add a custom label for "${moduleDef.name}" (e.g., "Main Antenna", "Diversity Antenna", "Sector 1").`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        document.getElementById('moduleLabel').focus();
    }, 100);
}

// ==========================================
// EDIT LABEL MODAL
// ==========================================
function initEditLabelModal() {
    const modal = document.getElementById('editLabelModal');
    const closeBtn = document.getElementById('closeEditLabelModal');
    const cancelBtn = document.getElementById('cancelEditLabel');
    const confirmBtn = document.getElementById('confirmEditLabel');
    const labelInput = document.getElementById('editModuleLabel');

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        labelInput.value = '';
        editingModuleId = null;
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    confirmBtn.addEventListener('click', function() {
        const newLabel = labelInput.value.trim();
        updateModuleLabel(editingModuleId, newLabel);
        closeModal();
    });

    labelInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
}

function openEditLabelModal(moduleId, currentLabel) {
    const modal = document.getElementById('editLabelModal');
    const labelInput = document.getElementById('editModuleLabel');
    
    editingModuleId = moduleId;
    labelInput.value = currentLabel || '';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        labelInput.focus();
        labelInput.select();
    }, 100);
}

// ==========================================
// MODULE MANAGEMENT
// ==========================================
function addModuleToSite(moduleType, label) {
    const moduleDef = MODULE_DEFINITIONS[moduleType];
    const newModule = {
        id: `module-${moduleIdCounter++}`,
        type: moduleType,
        name: moduleDef.name,
        label: label,
        photoCount: moduleDef.photoCount,
        photos: []
    };
    
    if (currentSite === 'a') {
        siteAModules.push(newModule);
    } else {
        siteBModules.push(newModule);
    }
    
    updateModuleDisplay();
    showNotification(`Module added to ${currentSite === 'a' ? 'Site A' : 'Site B'}`, 'success');
}

function duplicateModule(site, moduleId) {
    const modules = site === 'a' ? siteAModules : siteBModules;
    const originalModule = modules.find(m => m.id === moduleId);
    
    if (!originalModule) return;
    
    const duplicatedModule = {
        id: `module-${moduleIdCounter++}`,
        type: originalModule.type,
        name: originalModule.name,
        label: originalModule.label ? `${originalModule.label} (Copy)` : '',
        photoCount: originalModule.photoCount,
        photos: []
    };
    
    if (site === 'a') {
        siteAModules.push(duplicatedModule);
    } else {
        siteBModules.push(duplicatedModule);
    }
    
    updateModuleDisplay();
    showNotification('Module duplicated', 'success');
}

function updateModuleLabel(moduleId, newLabel) {
    const allModules = [...siteAModules, ...siteBModules];
    const module = allModules.find(m => m.id === moduleId);
    
    if (module) {
        module.label = newLabel;
        updateModuleDisplay();
        showNotification('Module label updated', 'success');
    }
}

function removeModule(site, moduleId) {
    if (!confirm('Are you sure you want to remove this module?')) {
        return;
    }
    
    if (site === 'a') {
        siteAModules = siteAModules.filter(m => m.id !== moduleId);
    } else {
        siteBModules = siteBModules.filter(m => m.id !== moduleId);
    }
    
    updateModuleDisplay();
    showNotification('Module removed', 'success');
}

// ==========================================
// DISPLAY FUNCTIONS
// ==========================================
function updateModuleDisplay() {
    updateSiteDisplay('a', siteAModules);
    updateSiteDisplay('b', siteBModules);
}

function updateSiteDisplay(site, modules) {
    const countElement = document.getElementById(site === 'a' ? 'siteACount' : 'siteBCount');
    const modulesList = document.getElementById(site === 'a' ? 'siteAModules' : 'siteBModules');
    
    const countNumber = countElement.querySelector('.count-number');
    countNumber.textContent = modules.length;
    
    modulesList.innerHTML = '';
    
    if (modules.length === 0) {
        modulesList.innerHTML = `
            <div class="empty-state-small">
                <p>No modules configured yet</p>
            </div>
        `;
        return;
    }
    
    modules.forEach(module => {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-list-item';
        moduleItem.innerHTML = `
            <div class="module-list-info">
                <div class="module-list-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </div>
                <div class="module-list-details">
                    <span class="module-list-name">${module.name}</span>
                    ${module.label ? `<span class="module-list-label">${module.label}</span>` : ''}
                    <span class="module-list-photos">${module.photoCount} photos required</span>
                </div>
            </div>
            <div class="module-list-actions">
                <button class="btn-edit-label" data-module-id="${module.id}" title="Edit label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-duplicate-module" data-site="${site}" data-module-id="${module.id}" title="Duplicate module">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <button class="btn-remove-module" data-site="${site}" data-module-id="${module.id}" title="Remove module">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        
        modulesList.appendChild(moduleItem);
        
        const editBtn = moduleItem.querySelector('.btn-edit-label');
        const duplicateBtn = moduleItem.querySelector('.btn-duplicate-module');
        const removeBtn = moduleItem.querySelector('.btn-remove-module');
        
        editBtn.addEventListener('click', () => openEditLabelModal(module.id, module.label));
        duplicateBtn.addEventListener('click', () => duplicateModule(site, module.id));
        removeBtn.addEventListener('click', () => removeModule(site, module.id));
    });
}