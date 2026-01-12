// ============================================
// DASHBOARD - LOAD REAL DATA
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');
    await loadRecentProjects();
    await loadScheduleWidget();
});

// ============================================
// RECENT PROJECTS SECTION
// ============================================

// Load recent projects from API
async function loadRecentProjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            displayRecentProjects(result.data);
        } else {
            showNoProjects();
        }
    } catch (error) {
        console.error('Load recent projects error:', error);
        showNoProjects();
    }
}

// Display projects in the exact HTML structure that exists
function displayRecentProjects(projects) {
    const projectList = document.querySelector('.project-list');
    
    if (!projectList) {
        console.error('Project list container not found');
        return;
    }
    
    // Show only 3 most recent
    const recentProjects = projects.slice(0, 3);
    
    projectList.innerHTML = recentProjects.map(project => {
        const statusClass = getStatusBadgeClass(project.status);
        const statusText = formatStatus(project.status);
        const updateDate = project.updated_at ? new Date(project.updated_at).toLocaleDateString() : new Date().toLocaleDateString();
        
        return `
            <div class="project-item">
                <div class="project-info">
                    <h3 class="project-name">${project.project_name}</h3>
                    <span class="badge ${statusClass}">${statusText}</span>
                    <p class="project-meta">📍 Updated ${updateDate}</p>
                </div>
                <div class="project-actions">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <button class="btn-outline" onclick="window.location.href='/project-details.html?id=${project.id}'">
                        Project Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showNoProjects() {
    const projectList = document.querySelector('.project-list');
    if (projectList) {
        projectList.innerHTML = '<p style="padding: 1rem; text-align: center; color: #6B7280;">No recent projects</p>';
    }
}

// ============================================
// SCHEDULE WIDGET (Sunday-Saturday weeks)
// ============================================

/**
 * Get the Sunday of the week containing the given date
 */
function getWeekStart(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

/**
 * Get the Saturday of a given week
 */
function getWeekEnd(weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Determine if project starts THIS WEEK or NEXT WEEK
 * @param {string} startDate - Project start date (YYYY-MM-DD)
 * @returns {string} - 'this_week', 'next_week', or null
 */
function getProjectWeekBucket(startDate) {
    if (!startDate) return null;
    
    const projectStart = new Date(startDate);
    projectStart.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // THIS WEEK: Sunday to Saturday of current week
    const thisWeekStart = getWeekStart(today);
    const thisWeekEnd = getWeekEnd(thisWeekStart);
    
    // NEXT WEEK: Sunday to Saturday of following week
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = getWeekEnd(nextWeekStart);
    
    // Check which bucket
    if (projectStart >= thisWeekStart && projectStart <= thisWeekEnd) {
        return 'this_week';
    } else if (projectStart >= nextWeekStart && projectStart <= nextWeekEnd) {
        return 'next_week';
    }
    
    return null; // Outside 2-week window
}

/**
 * Format week range for display (e.g., "Jan 19 - Jan 25")
 */
function formatWeekRange(weekStart) {
    const weekEnd = getWeekEnd(weekStart);
    const options = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
}

/**
 * Load and display projects in schedule widget
 * This automatically updates as weeks change
 */
async function loadScheduleWidget() {
    console.log('📅 Loading schedule widget...');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const projects = result.data;
            console.log(`📊 Loaded ${projects.length} projects for schedule`);
            
            // Display current week indicator
            const thisWeekStart = getWeekStart();
            const weekDatesElement = document.getElementById('currentWeekDates');
            if (weekDatesElement) {
                weekDatesElement.textContent = formatWeekRange(thisWeekStart);
            }
            
            // Sort projects into THIS WEEK or NEXT WEEK
            const thisWeek = [];
            const nextWeek = [];
            
            projects.forEach(project => {
                const bucket = getProjectWeekBucket(project.start_date);
                
                if (bucket === 'this_week') {
                    thisWeek.push(project);
                } else if (bucket === 'next_week') {
                    nextWeek.push(project);
                }
            });
            
            // Display projects in each column
            displayScheduleProjects('thisWeekProjects', thisWeek, 'this');
            displayScheduleProjects('nextWeekProjects', nextWeek, 'next');
            
            console.log(`✅ Schedule: ${thisWeek.length} this week, ${nextWeek.length} next week`);
            
        } else {
            console.error('❌ Failed to load projects:', result.message);
        }
    } catch (error) {
        console.error('💥 Error loading schedule:', error);
    }
}

/**
 * Display projects in a schedule column with expandable cards
 */
function displayScheduleProjects(containerId, projects, weekType) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`⚠️ Container ${containerId} not found`);
        return;
    }
    
    // Update week range display
    const thisWeekStart = getWeekStart();
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    if (weekType === 'this') {
        const rangeEl = document.getElementById('thisWeekRange');
        if (rangeEl) rangeEl.textContent = formatWeekRange(thisWeekStart);
    } else if (weekType === 'next') {
        const rangeEl = document.getElementById('nextWeekRange');
        if (rangeEl) rangeEl.textContent = formatWeekRange(nextWeekStart);
    }
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="no-schedule-projects">
                <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                <p>No projects scheduled</p>
            </div>
        `;
        return;
    }
    
    // Sort by start date
    projects.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    container.innerHTML = projects.map(project => createScheduleProjectCard(project)).join('');
    
    // Attach expand/collapse handlers after rendering
    container.querySelectorAll('.schedule-project-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // Don't expand if clicking the details button
            if (e.target.closest('.btn-schedule-details')) return;
            
            const card = this.closest('.schedule-project-card');
            card.classList.toggle('expanded');
        });
    });
}

/**
 * Create HTML for a single schedule project card
 */
function createScheduleProjectCard(project) {
    const statusIndicator = getStatusIndicatorClass(project.status);
    const siteInfo = formatSiteNames(project);
    const latestUpdate = getLatestApprovedUpdate(project);
    
    return `
        <div class="schedule-project-card" data-project-id="${project.id}">
            <!-- Card Header (Always Visible) -->
            <div class="schedule-project-header">
                <div class="schedule-project-main">
                    <div class="schedule-project-sites">${siteInfo}</div>
                    <div class="schedule-project-meta">
                        <span class="schedule-project-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formatDate(project.start_date)}
                        </span>
                    </div>
                </div>
                <div class="schedule-project-actions">
                    <div class="schedule-status-indicator ${statusIndicator}" title="${formatStatus(project.status)}"></div>
                    <svg class="schedule-expand-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </div>
            </div>
            
            <!-- Expandable Details Section -->
            <div class="schedule-project-details">
                <div class="schedule-project-details-content">
                    <div class="schedule-detail-row">
                        <span class="schedule-detail-label">Project Status:</span>
                        <span class="schedule-detail-value">${formatStatus(project.status)}</span>
                    </div>
                    <div class="schedule-detail-row">
                        <span class="schedule-detail-label">Site A:</span>
                        <span class="schedule-detail-value">${project.site_a_name || 'Not specified'}</span>
                    </div>
                    <div class="schedule-detail-row">
                        <span class="schedule-detail-label">Site B:</span>
                        <span class="schedule-detail-value">${project.site_b_name || 'Not specified'}</span>
                    </div>
                    <div class="schedule-detail-row">
                        <span class="schedule-detail-label">End Date:</span>
                        <span class="schedule-detail-value">${formatDate(project.end_date)}</span>
                    </div>
                    
                    ${latestUpdate ? `
                        <div class="schedule-latest-update">
                            <div class="schedule-latest-update-header">
                                <span class="schedule-latest-update-title">
                                    <i class="fas fa-clipboard-check"></i> Latest Update
                                </span>
                                <span class="schedule-update-status ${latestUpdate.approved ? 'approved' : 'pending'}">
                                    ${latestUpdate.approved ? '✓ Approved' : '⏳ Pending Review'}
                                </span>
                            </div>
                            <div class="schedule-latest-update-text">${latestUpdate.summary}</div>
                            <div class="schedule-update-date">Updated: ${latestUpdate.date}</div>
                        </div>
                    ` : `
                        <div class="schedule-latest-update no-updates">
                            <i class="fas fa-info-circle"></i>
                            <span>No field updates available yet</span>
                        </div>
                    `}
                    
                    <div class="schedule-project-actions-row">
                        <button class="btn-schedule-details" onclick="window.location.href='project-details.html?id=${project.id}'; event.stopPropagation();">
                            <i class="fas fa-arrow-right"></i> View Full Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Format site names for display (Site A ↔ Site B)
 */
function formatSiteNames(project) {
    const siteA = project.site_a_name || 'Site A';
    const siteB = project.site_b_name || 'Site B';
    return `${siteA} ↔ ${siteB}`;
}

/**
 * Get status indicator color class based on project status
 */
function getStatusIndicatorClass(status) {
    const indicatorMap = {
        'completed': 'status-indicator-green',
        'in_progress': 'status-indicator-blue',
        'pending': 'status-indicator-yellow',
        'on_hold': 'status-indicator-red'
    };
    return indicatorMap[status] || 'status-indicator-blue';
}

/**
 * Get latest approved field update for a project
 * TODO: Connect to daily updates API when ready
 */
function getLatestApprovedUpdate(project) {
    // Placeholder - will be replaced with real API call
    // For now, return null (no updates shown)
    return null;
    
    // Future implementation will look like:
    /*
    if (project.latest_update && project.latest_update.approved_by_pm) {
        return {
            summary: project.latest_update.summary,
            approved: project.latest_update.approved_by_pm,
            date: formatDate(project.latest_update.created_at)
        };
    }
    return null;
    */
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}
// ============================================
// UTILITY FUNCTIONS
// ============================================

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
    const statusLabels = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'on_hold': 'On Hold'
    };
    return statusLabels[status] || status.replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}
