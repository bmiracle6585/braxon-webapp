// ==========================================
// PROJECT DETAILS PAGE SCRIPT (CLEAN)
// ==========================================

// currentProject is declared in project-details.html (per your note)
// We'll still guard against it being missing.
if (typeof window.currentProject === 'undefined') {
  window.currentProject = null;
}

// ------------------------------------------
// SAFE STUBS (prevents hard crashes if older code calls these)
// ------------------------------------------
window.loadCurrentTeam = window.loadCurrentTeam || (async function loadCurrentTeam(projectId) {
  // Intentionally silent placeholder.
  // Team widget will be wired later.
  return;
});
// ------------------------------------------
// TEAM MODAL (placeholder so button works)
// ------------------------------------------
window.openTeamModal = window.openTeamModal || function openTeamModal() {
  // Non-blocking placeholder: no errors, no alerts.
  console.log('👥 openTeamModal: placeholder (no-op)');
};

window.closeTeamModal = window.closeTeamModal || function closeTeamModal() {
  console.log('👥 closeTeamModal: placeholder (no-op)');
};

// If these are missing on some builds, don’t crash the page
window.initDocumentManagement = window.initDocumentManagement || function () {};
window.initDailyUpdates = window.initDailyUpdates || function () {};
window.initEditSiteInfo = window.initEditSiteInfo || function () {};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Page loaded');

function initTeamButtons() {
  const addBtn = document.getElementById('addTeamMemberBtn');
  const editBtn = document.getElementById('editTeamBtn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (typeof window.openTeamModal === 'function') {
        window.openTeamModal();
      } else {
        console.warn('openTeamModal is not defined');
      }
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (typeof window.openEditTeamModal === 'function') {
        window.openEditTeamModal();
      } else {
        console.warn('openEditTeamModal is not defined');
      }
    });
  }
}  

   // 🔑 MUST COME FIRST
  initTeamButtons();
  
  // Ensure links that depend on projectId are set early
  setDynamicLinks();

  // Load project first (so currentProject is available)
  loadProjectData();

  // Load module data (photo documentation)
  loadModuleData();

  // Initialize page functionality
  initProjectDetailsPage();

  // Initialize status change listener
  initStatusChange();

  // Show delete button for admins
  showDeleteButtonIfAdmin();

  // Wire edit form submit once (no cloneNode hacks)
  wireEditFormSubmitOnce();
});

// ==========================================
// DATA LOADERS
// ==========================================
async function loadProjectData() {
  try {
    const projectId = getProjectIdFromUrl();

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
      displayProjectData(result.data);
    } else {
      showNotification('Failed to load project data', 'error');
    }
  } catch (error) {
    console.error('Load project data error:', error);
    showNotification('Error loading project data', 'error');
  }
}

function displayProjectData(project) {
  console.log('🎯 displayProjectData CALLED with:', project);
  window.currentProject = project;

  // Title
  const pageTitle = document.querySelector('.project-details-header h1');
  if (pageTitle) pageTitle.textContent = project.project_name || '';

  // Status badge
  const statusBadge = document.querySelector('.project-details-header .badge');
  if (statusBadge) {
    statusBadge.className = 'badge ' + getStatusBadgeClass(project.status || '');
    statusBadge.textContent = formatStatus(project.status || 'pending');
  }

  // Status dropdown
  const statusSelect = document.getElementById('projectStatusSelect');
  if (statusSelect) statusSelect.value = project.status || 'pending';

  // Site names
  const siteANameElement = document.querySelector('.site-info-grid .site-column:nth-child(1) .site-value');
  if (siteANameElement) siteANameElement.textContent = project.site_a_name || '';

  const siteBNameElement = document.querySelector('.site-info-grid .site-column:nth-child(2) .site-value');
  if (siteBNameElement) siteBNameElement.textContent = project.site_b_name || '';

  // Locations (site-info-grid values-with-icon)
  const siteALocationDivs = document.querySelectorAll('.site-info-grid .site-column:nth-child(1) .site-value-with-icon');
  if (siteALocationDivs.length > 0) {
    const locationSpan = siteALocationDivs[0].querySelector('span');
    if (locationSpan) locationSpan.textContent = project.site_a_location || '';
  }

  const siteBLocationDivs = document.querySelectorAll('.site-info-grid .site-column:nth-child(2) .site-value-with-icon');
  if (siteBLocationDivs.length > 0) {
    const locationSpan = siteBLocationDivs[0].querySelector('span');
    if (locationSpan) locationSpan.textContent = project.site_b_location || '';
  }

  // Photo Documentation header site names
  const photoDocSiteAName = document.getElementById('photoDocSiteAName');
  if (photoDocSiteAName) photoDocSiteAName.textContent = project.site_a_name || '';

  const photoDocSiteBName = document.getElementById('photoDocSiteBName');
  if (photoDocSiteBName) photoDocSiteBName.textContent = project.site_b_name || '';

  // Start/End dates (second value-with-icon in each column)
  if (siteALocationDivs.length > 1) {
    const dateSpan = siteALocationDivs[1].querySelector('span');
    if (dateSpan) dateSpan.textContent = project.start_date ? new Date(project.start_date).toLocaleDateString() : '';
  }

  if (siteBLocationDivs.length > 1) {
    const dateSpan = siteBLocationDivs[1].querySelector('span');
    if (dateSpan) dateSpan.textContent = project.end_date ? new Date(project.end_date).toLocaleDateString() : '';
  }
}

// ==========================================
// MODULE DATA (PHOTO DOCUMENTATION)
// ==========================================
async function loadModuleData() {
  try {
    const projectId = getProjectIdFromUrl();
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

  const totalPhotos = [...siteAModules, ...siteBModules].reduce((sum, m) =>
    sum + (m.total_required_photos || 0), 0
  );

  const pctEl = document.querySelector('.photo-doc-percentage');
  if (pctEl) pctEl.textContent = '0%';

  const statsEl = document.querySelector('.photo-doc-stats');
  if (statsEl) statsEl.textContent = `0 of ${totalPhotos} required photos satisfied`;

  const modulesEl = document.querySelector('.photo-doc-modules');
  if (modulesEl) modulesEl.textContent = `${totalModules} modules configured`;

  const photoDocSiteAModules = document.getElementById('photoDocSiteAModules');
  if (photoDocSiteAModules) photoDocSiteAModules.textContent = `${siteAModules.length} modules`;

  const photoDocSiteBModules = document.getElementById('photoDocSiteBModules');
  if (photoDocSiteBModules) photoDocSiteBModules.textContent = `${siteBModules.length} modules`;

  const photoSummary = document.querySelector('.closeout-summary-card:nth-child(1) .closeout-value');
  if (photoSummary) photoSummary.textContent = `0 / ${totalPhotos} required photos satisfied`;

  const moduleSummary = document.querySelector('.closeout-summary-card:nth-child(1) .closeout-meta');
  if (moduleSummary) moduleSummary.textContent = `0 / ${totalModules} modules complete`;
}

// ==========================================
// PAGE FEATURES
// ==========================================
function initProjectDetailsPage() {
  initDailyUpdates();
  initDocumentManagement();
  initEditSiteInfo();
}

// ==========================================
// STATUS CHANGE
// ==========================================
function initStatusChange() {
  const statusSelect = document.getElementById('projectStatusSelect');
  if (!statusSelect) return;

  statusSelect.addEventListener('change', (e) => {
    const newStatus = e.target.value;
    console.log('🎯 DROPDOWN CHANGED! New value:', newStatus);
    if (!newStatus) return;
    updateProjectStatus(newStatus);
  });
}

async function updateProjectStatus(status) {
  console.log('🔄 updateProjectStatus called with:', status);

  const projectId = getProjectIdFromUrl();
  const token = localStorage.getItem('token');
  const statusSelect = document.getElementById('projectStatusSelect');

  if (!token) {
    showNotification('Authentication required. Please log in again.', 'error');
    window.location.href = '/index.html';
    return;
  }

  try {
    if (statusSelect) statusSelect.disabled = true;

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (data.success) {
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
    setTimeout(() => location.reload(), 1500);
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
  return (status || '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ')
    .trim();
}

// ==========================================
// EDIT SITE INFO (MODAL)
// ==========================================
function initEditSiteInfo() {
  const editBtn = document.getElementById('editSiteInfoBtn');
  if (editBtn) editBtn.addEventListener('click', openEditModal);
}

function wireEditFormSubmitOnce() {
  const form = document.getElementById('editProjectForm');
  if (!form) return;

  // prevent double-binding
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  form.addEventListener('submit', handleEditSubmit);
}

function openEditModal() {
  if (!window.currentProject) {
    showNotification('Project data not loaded', 'error');
    return;
  }

  populateEditModal();
  const modal = document.getElementById('editSiteModal');
  if (!modal) return;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  const modal = document.getElementById('editSiteModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';

  const form = document.getElementById('editProjectForm');
  if (form) form.reset();
}

function populateEditModal() {
  const p = window.currentProject;
  if (!p) return;

  // Populate fields
  setValue('editCustomerId', p.customer_id || '');
  setValue('editCustomerPoc', p.customer_poc || '');
  setValue('editProjectName', p.project_name || '');
  setValue('editScopeOfWork', p.scope_of_work || '');
  setValue('editProjectStatus', p.status || 'pending');
  setValue('editSiteAName', p.site_a_name || '');
  setValue('editSiteBName', p.site_b_name || '');
  setValue('editSiteALocation', p.site_a_location || '');
  setValue('editSiteBLocation', p.site_b_location || '');
  setValue('editStartDate', p.start_date || '');
  setValue('editEndDate', p.end_date || '');
  setValue('editProjectDescription', p.description || '');

  loadCustomersForEdit();
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

async function loadCustomersForEdit() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    if (!result.success) return;

    const select = document.getElementById('editCustomerId');
    if (!select) return;

    select.innerHTML = '<option value="">Select customer...</option>';

    result.data.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = customer.name || customer.customer_name || `Customer ${customer.id}`;
      if (window.currentProject && customer.id === window.currentProject.customer_id) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Load customers error:', error);
  }
}

async function handleEditSubmit(e) {
  e.preventDefault();

  if (!window.currentProject) {
    showNotification('Project data not loaded', 'error');
    return false;
  }

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

  // Parse coords if location changed (supports DMS pair string)
  if (updatedData.site_a_location && updatedData.site_a_location !== window.currentProject.site_a_location) {
    const coordsA = parseCoordinates(updatedData.site_a_location);
    if (coordsA.lat != null && coordsA.lng != null) {
      updatedData.site_a_latitude = coordsA.lat;
      updatedData.site_a_longitude = coordsA.lng;
    }
  }

  if (updatedData.site_b_location && updatedData.site_b_location !== window.currentProject.site_b_location) {
    const coordsB = parseCoordinates(updatedData.site_b_location);
    if (coordsB.lat != null && coordsB.lng != null) {
      updatedData.site_b_latitude = coordsB.lat;
      updatedData.site_b_longitude = coordsB.lng;
    }
  }

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`/api/projects/${window.currentProject.id}`, {
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
      setTimeout(() => window.location.reload(), 800);
    } else {
      showNotification('Error: ' + (result.message || 'Update failed'), 'error');
    }
  } catch (error) {
    console.error('Update error:', error);
    showNotification('Failed to update project', 'error');
  }

  return false;
}

// ==========================================
// COORD PARSER (supports your DMS format)
// ==========================================
// Accepts:
//  - "36 36 39.37, -108 39 55.32"
//  - "36.610936, -108.665366"
//  - "36.610936 -108.665366"
function parseCoordinates(input) {
  if (!input || typeof input !== 'string') return { lat: null, lng: null };

  const str = input.trim();

  // Try decimal "lat,lng"
  const commaParts = str.split(',').map(s => s.trim());
  if (commaParts.length === 2) {
    const a = parseFloat(commaParts[0]);
    const b = parseFloat(commaParts[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };

    // Try DMS pair with comma
    const dms = dmsPairToDecimal(str);
    if (dms) return dms;
  }

  // Try decimal "lat lng"
  const spaceParts = str.split(/\s+/).filter(Boolean);
  if (spaceParts.length === 2) {
    const a = parseFloat(spaceParts[0]);
    const b = parseFloat(spaceParts[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
  }

  // Try DMS without comma (rare, but handle)
  const maybeDms = dmsPairToDecimal(str);
  if (maybeDms) return maybeDms;

  return { lat: null, lng: null };
}

// "36 36 39.37, -108 39 55.32" -> {lat,lng}
function dmsPairToDecimal(pairStr) {
  if (!pairStr || typeof pairStr !== 'string') return null;

  const parts = pairStr.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;

  function dmsToDec(dmsStr) {
    const nums = dmsStr.split(/\s+/).filter(Boolean).map(Number);
    if (nums.length < 3 || nums.some(n => Number.isNaN(n))) return null;

    const deg = nums[0];
    const min = nums[1];
    const sec = nums[2];

    const sign = deg < 0 ? -1 : 1;
    const absDeg = Math.abs(deg);

    return sign * (absDeg + (min / 60) + (sec / 3600));
  }

  const lat = dmsToDec(parts[0]);
  const lng = dmsToDec(parts[1]);
  if (lat === null || lng === null) return null;

  return { lat, lng };
}

// ==========================================
// DELETE PROJECT
// ==========================================
function showDeleteButtonIfAdmin() {
  const userRole = localStorage.getItem('userRole');
  const deleteBtn = document.getElementById('deleteProjectBtn');
  if (userRole === 'admin' && deleteBtn) deleteBtn.style.display = 'inline-flex';
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

  if (confirmed) await deleteProject(projectId);
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
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    }

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
      setTimeout(() => window.location.href = '/projects.html', 300);
    } else {
      throw new Error(data.message || 'Failed to delete project');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert(`❌ Error deleting project: ${error.message}`);
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Project';
    }
  }
}

// ==========================================
// UTILS
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
  }, 2500);
}

function setDynamicLinks() {
  const projectId = getProjectIdFromUrl();

  // Site Module Entry link
  const siteModuleLink = document.getElementById('siteModuleEntryLink');
  if (siteModuleLink && projectId) {
    siteModuleLink.href = `site-module-entry.html?projectId=${projectId}`;
  }

  // Closeout Package link (if present)
  const closeoutLink = document.getElementById('manageCloseoutLink');
  if (closeoutLink && projectId) {
    closeoutLink.href = `closeout-package.html?projectId=${projectId}`;
  }
}
