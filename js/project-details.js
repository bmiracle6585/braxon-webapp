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
// TEAM MODAL (Deployment Team)
// ------------------------------------------

let teamLoadSeq = 0;


// Close modal
window.closeTeamModal = function () {
  const overlay = document.getElementById('teamModalOverlay');
  if (overlay) overlay.style.display = 'none';
};

// Wire close buttons + outside click (safe)
document.getElementById('closeTeamModalBtn')?.addEventListener('click', window.closeTeamModal);
document.getElementById('teamModalCancelBtn')?.addEventListener('click', window.closeTeamModal);
document.getElementById('teamModalOverlay')?.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'teamModalOverlay') window.closeTeamModal();
});

// Open modal + load dropdown users
window.openTeamModal = function () {
  const overlay = document.getElementById('teamModalOverlay');
  if (!overlay) {
    console.warn('teamModalOverlay not found');
    return;
  }
  overlay.style.display = 'flex';
  loadUsersIntoTeamModal();
};

// Load users into dropdown
async function loadUsersIntoTeamModal() {
  const select = document.getElementById('teamMemberSelect');
  if (!select) {
    console.warn('teamMemberSelect not found');
    return;
  }

  select.innerHTML = `<option value="">Loading users...</option>`;
  select.disabled = true;

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${window.API_BASE || ''}/api/users`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('GET /api/users failed:', res.status, txt);
      select.innerHTML = `<option value="">Failed to load users</option>`;
      return;
    }

    const payload = await res.json();
    const users = Array.isArray(payload) ? payload : (payload.users || payload.data || []);

    select.innerHTML = `<option value="">Select a team member...</option>`;

    users.forEach(u => {
      const label =
        (u.fullName || u.name || u.full_name || '').trim() ||
        (u.email || '').trim() ||
        `User ${u.id}`;

      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = label;
      select.appendChild(opt);
    });

    select.disabled = false;
  } catch (err) {
    console.error(err);
    select.innerHTML = `<option value="">Failed to load users</option>`;
  }
}

// Load / render team members list (Modal + Main Widget) + Remove
async function loadProjectTeamMembers(projectId) {
  const seq = ++teamLoadSeq;

  const modalList = document.getElementById('currentTeamList');
  const widgetList = document.getElementById('teamMembersList');

  if (!modalList) console.warn('currentTeamList not found');
  if (!widgetList) console.warn('teamMembersList not found');

  if (modalList) {
    modalList.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:1rem;">Loading team...</p>`;
  }
  if (widgetList) {
    widgetList.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: #64748b;">
        <p style="margin:0;">Loading team...</p>
      </div>
    `;
  }

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${window.API_BASE || ''}/api/team/project/${projectId}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('Load team failed:', res.status, txt);

      const errHtml = `<p style="text-align:center;color:#dc2626;padding:1rem;">Failed to load team (${res.status})</p>`;
      if (modalList) modalList.innerHTML = errHtml;
      if (widgetList) widgetList.innerHTML = errHtml;
      return;
    }

    const payload = await res.json();
    if (seq !== teamLoadSeq) return; // ignore stale response
    const members = payload.data || [];

    if (!members.length) {
      const emptyHtml = `<p style="text-align:center;color:#94a3b8;padding:1rem;">No team members yet</p>`;
      if (modalList) modalList.innerHTML = emptyHtml;

      if (widgetList) {
        widgetList.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: #64748b;">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; opacity: 0.3;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">No team members assigned yet</p>
            <p style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0;">
              Team members will have mobile access to this project
            </p>
          </div>
        `;
      }
      return;
    }

    // Clear + render both lists
    if (modalList) modalList.innerHTML = '';
    if (widgetList) widgetList.innerHTML = '';

    members.forEach(m => {
      const u = m.User || {};

      // ✅ Normalize member user id across old/new records
      const memberUserId = m.user_id || m.userId || u.id;

      const name =
        u.full_name ||
        u.fullName ||
        u.name ||
        u.email ||
        `User ${memberUserId || ''}`.trim();

      const role = m.role || 'technician';

      // -------------------------
      // MODAL ROW
      // -------------------------
      if (modalList) {
        const row = document.createElement('div');
        row.style.cssText =
          'display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:10px;background:#fff;';

        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
            <div style="display:flex;flex-direction:column;gap:0.15rem;">
              <div style="font-weight:700;color:#1e293b;">${name}</div>
              <div style="font-size:0.85rem;color:#64748b;">${role}</div>
            </div>
            <button
              data-user-id="${memberUserId || ''}"
              style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:0.4rem 0.6rem;cursor:pointer;">
              Remove
            </button>
          </div>
        `;

        modalList.appendChild(row);

        row.querySelector('button')?.addEventListener('click', async () => {
          if (!memberUserId) return alert('Missing user id on this row');
          if (!confirm('Remove this team member from the project?')) return;

          const delRes = await fetch(
            `${window.API_BASE || ''}/api/team/project/${projectId}/members/${memberUserId}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (!delRes.ok) {
            const txt = await delRes.text().catch(() => '');
            console.error('Remove failed:', delRes.status, txt);
            return alert(`Remove failed: ${delRes.status}`);
          }

          loadProjectTeamMembers(projectId);
        });
      }

      // -------------------------
      // MAIN WIDGET CARD
      // -------------------------
      if (widgetList) {
        const card = document.createElement('div');
        card.style.cssText =
          'display:flex;justify-content:space-between;align-items:center;padding:1rem;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:0.75rem;';

        card.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:0.2rem;">
            <div style="font-weight:700;color:#1e293b;">${name}</div>
            <div style="font-size:0.85rem;color:#64748b;">${role}</div>
          </div>
          <button
            data-user-id="${memberUserId || ''}"
            style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:0.5rem 0.75rem;cursor:pointer;font-weight:600;">
            Remove
          </button>
        `;

        widgetList.appendChild(card);

        card.querySelector('button')?.addEventListener('click', async () => {
          if (!memberUserId) return alert('Missing user id on this row');
          if (!confirm('Remove this team member from the project?')) return;

          const delRes = await fetch(
            `${window.API_BASE || ''}/api/team/project/${projectId}/members/${memberUserId}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (!delRes.ok) {
            const txt = await delRes.text().catch(() => '');
            console.error('Remove failed:', delRes.status, txt);
            return alert(`Remove failed: ${delRes.status}`);
          }

          loadProjectTeamMembers(projectId);
        });
      }
    });
  } catch (err) {
    console.error(err);
    const errHtml = `<p style="text-align:center;color:#dc2626;padding:1rem;">Failed to load team</p>`;
    if (modalList) modalList.innerHTML = errHtml;
    if (widgetList) widgetList.innerHTML = errHtml;
  }
}


// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Page loaded');

  // ------------------------------------------
  // Team Buttons
  // ------------------------------------------
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
      addBtn?.style.setProperty('display', 'inline-flex');
      editBtn.addEventListener('click', () => {
        if (typeof window.openEditTeamModal === 'function') {
          window.openEditTeamModal();
        } else {
          console.warn('openEditTeamModal is not defined');
        }
      });
    }
  }
  // ------------------------------------------
  // Add Team Member Form Submit
  // ------------------------------------------
 function wireAddTeamMemberFormOnce() {
  const form = document.getElementById('addTeamMemberForm');
  if (!form) return;

  // Prevent double-binding
  if (form.dataset.submitWired === 'true') return;
  form.dataset.submitWired = 'true';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pid = new URLSearchParams(window.location.search).get('id');
    if (!pid) return alert('Project ID not found');

    const user_id = document.getElementById('teamMemberSelect')?.value;
    const role = document.getElementById('teamRoleSelect')?.value;
    const notes = document.getElementById('teamNotes')?.value || '';

    if (!user_id) return alert('Select a team member');

    const token = localStorage.getItem('token');

    const res = await fetch(`${window.API_BASE || ''}/api/team/project/${pid}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id, role, notes })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('Add team member failed:', res.status, txt);
      return alert(`Add failed: ${res.status}`);
    }

    loadProjectTeamMembers(pid);
  });
}

  // ------------------------------------------
  // Page Initialization Order
  // ------------------------------------------
  const pid = new URLSearchParams(window.location.search).get('id');

  initTeamButtons();
  setDynamicLinks();
  loadProjectData();
  loadModuleData();
  initProjectDetailsPage();
  initStatusChange();
  showDeleteButtonIfAdmin();
  wireAddTeamMemberFormOnce();

    // wireEditFormSubmitOnce(); // removed (handled by handleEditSubmit binding below)

  if (pid) loadProjectTeamMembers(pid);
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

function displayPerDiemInfo(project) {
  const total = parseInt(project.per_diem_total || 0, 10);
  const used = parseInt(project.per_diem_used || 0, 10);
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  const totalEl = document.getElementById('totalPerDiemNights');
  const usedEl = document.getElementById('usedPerDiemNights');
  const remEl = document.getElementById('remainingPerDiemNights');
  const pctEl = document.getElementById('perDiemPercentage');
  const barEl = document.getElementById('perDiemProgressBar');

  if (totalEl) totalEl.textContent = total;
  if (usedEl) usedEl.textContent = used;
  if (remEl) remEl.textContent = remaining;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (barEl) barEl.style.width = `${pct}%`;

  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const editTotal = document.getElementById('editPerDiemTotal');
  const editUsed = document.getElementById('editPerDiemUsed');

  if (editTotal) {
    editTotal.value = total;
    editTotal.disabled = !isAdmin;
  }

  if (editUsed) {
    editUsed.value = used;
    editUsed.disabled = !isAdmin;
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
if (siteANameElement) siteANameElement.textContent = project.site_a_name || '-';

  const siteBNameElement = document.querySelector('.site-info-grid .site-column:nth-child(2) .site-value');
  if (siteBNameElement) siteBNameElement.textContent = project.site_b_name || '-';

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
  if (typeof initDailyUpdates === 'function') initDailyUpdates();
  if (typeof initDocumentManagement === 'function') initDocumentManagement();
  if (typeof initEditSiteInfo === 'function') initEditSiteInfo();
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
// EDIT SITE INFO (MODAL) — REBUILT
// ==========================================

function initEditSiteInfo() {
  const editBtn = document.getElementById('editSiteInfoBtn');
  if (editBtn) editBtn.addEventListener('click', openEditModal);
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
  // IMPORTANT: don't reset on cancel/close (prevents clearing values)
// document.getElementById('editProjectForm')?.reset();
}

function populateEditModal() {
  const p = window.currentProject;
  if (!p) return;

  setVal('editProjectName', p.project_name);
  setVal('editScopeOfWork', p.scope_of_work);
  setVal('editProjectStatus', p.status);
  setVal('editSiteAName', p.site_a_name);
  setVal('editSiteBName', p.site_b_name);
  setVal('editSiteALocation', p.site_a_location);
  setVal('editSiteBLocation', p.site_b_location);
  setVal('editStartDate', p.start_date);
  setVal('editEndDate', p.end_date);
  setVal('editProjectDescription', p.description);

  loadCustomersForEdit(p.customer_id);
}
// ------------------------------------------
// Save Project Changes (Edit Modal)
// ------------------------------------------
window.saveProjectChanges = async function (e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const projectId = document.getElementById('editProjectId')?.value;
  if (!projectId) return alert('Project ID missing');

  const payload = {
    project_name: document.getElementById('editProjectName')?.value ?? null,
    scope_of_work: document.getElementById('editScopeOfWork')?.value ?? null,
    status: document.getElementById('editProjectStatus')?.value ?? null,
    site_a_name: document.getElementById('editSiteAName')?.value ?? null,
    site_b_name: document.getElementById('editSiteBName')?.value ?? null,
    site_a_location: document.getElementById('editSiteALocation')?.value ?? null,
    site_b_location: document.getElementById('editSiteBLocation')?.value ?? null,
    start_date: document.getElementById('editStartDate')?.value ?? null,
    end_date: document.getElementById('editEndDate')?.value ?? null,
    description: document.getElementById('editProjectDescription')?.value ?? null
  };

  // Admin-only budgets (include only if inputs exist)
  const hbt = document.getElementById('editHoursBudgetTotal');
  const hbu = document.getElementById('editHoursBudgetUsed');
  const pdt = document.getElementById('editPerDiemTotal');
  const pdu = document.getElementById('editPerDiemUsed');

  if (hbt && hbt.value !== '') payload.hours_budget_total = Number(hbt.value);
  if (hbu && hbu.value !== '') payload.hours_budget_used  = Number(hbu.value);
  if (pdt && pdt.value !== '') payload.per_diem_total     = Number(pdt.value);
  if (pdu && pdu.value !== '') payload.per_diem_used      = Number(pdu.value);

  const res = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  if (!result?.success) return alert(result?.message || 'Update failed');

  window.currentProject = result.project;
  displayProjectData(result.project);
  displayPerDiemInfo(result.project);
  closeEditModal();
};


function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

async function loadCustomersForEdit(selectedCustomerId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (!result.success) return;

    const select = document.getElementById('editCustomerId');
    if (!select) return;

    select.innerHTML = '<option value="">Select customer...</option>';

    result.data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name || c.customer_name;
      if (String(c.id) === String(selectedCustomerId)) {
  opt.selected = true;
}
      select.appendChild(opt);
    });

    select.onchange = e => loadPocsForEdit(e.target.value);

if (selectedCustomerId) {
  loadPocsForEdit(selectedCustomerId);
}
  } catch (err) {
    console.error('Load customers error:', err);
  }
}

async function loadPocsForEdit(customerId) {
  const select = document.getElementById('editCustomerPoc');
  if (!select || !customerId) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/customers/${customerId}/pocs`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (!result.success) return;

    select.innerHTML = '<option value="">Select POC...</option>';

result.data.forEach(poc => {
  const opt = document.createElement('option');

  // POC is stored as a STRING on the project (email or name)
  const pocValue = poc.email || poc.name;

  opt.value = pocValue;
  opt.textContent = poc.name || poc.email;

  if (window.currentProject?.customer_poc === pocValue) {
    opt.selected = true;
  }

  select.appendChild(opt);
});

  } catch (err) {
    console.error('Load POCs error:', err);
  }
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const p = window.currentProject;
  if (!p) return;

  const form = e.target;
  const data = new FormData(form);

  const payload = {
    customer_id: data.get('customer_id') || null,
    customer_poc: data.get('customer_poc') || null,
    project_name: data.get('project_name'),
    scope_of_work: data.get('scope_of_work'),
    status: data.get('status'),
    site_a_name: data.get('site_a_name'),
    site_b_name: data.get('site_b_name'),
    site_a_location: data.get('site_a_location'),
    site_b_location: data.get('site_b_location'),
    start_date: data.get('start_date'),
    end_date: data.get('end_date'),
    description: data.get('description')
  };

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.success) {
      showNotification('Project updated', 'success');
      closeEditModal();
      setTimeout(() => location.reload(), 500);
    } else {
      showNotification(result.message || 'Update failed', 'error');
    }
  } catch (err) {
    console.error('Edit project error:', err);
    showNotification('Update failed', 'error');
  }
}

document
  .getElementById('editProjectForm')
  ?.addEventListener('submit', handleEditSubmit);

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
