// JS/dashboard-map.js - Interactive Project Location Map
// Synchronized with Sunday-Saturday week logic

class ProjectLocationMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentWeekProjects = [];
        this.nextWeekProjects = [];
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initMap());
        } else {
            this.initMap();
        }
    }

    initMap() {
        // Initialize map (centered on US for now)
        this.map = L.map('projectMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([39.8283, -98.5795], 4); // Center of USA

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // Load project data and add markers
        this.loadProjectLocations();
    }

    async loadProjectLocations() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                const allSites = [];
                
                result.data.forEach(p => {
                    const week = this.determineWeek(p.start_date);
                    
                    // Only show projects in THIS WEEK or NEXT WEEK
                    if (!week) return;
                    
                    // Add Site A if it has coordinates
                    if (p.site_a_latitude && p.site_a_longitude) {
                        allSites.push({
                            id: p.id,
                            projectName: p.project_name,
                            siteName: p.site_a_name || 'Site A',
                            address: p.site_a_location || 'Location not specified',
                            lat: parseFloat(p.site_a_latitude),
                            lng: parseFloat(p.site_a_longitude),
                            startDate: p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD',
                            week: week
                        });
                    }
                    
                    // Add Site B if it has coordinates
                    if (p.site_b_latitude && p.site_b_longitude) {
                        allSites.push({
                            id: p.id,
                            projectName: p.project_name,
                            siteName: p.site_b_name || 'Site B',
                            address: p.site_b_location || 'Location not specified',
                            lat: parseFloat(p.site_b_latitude),
                            lng: parseFloat(p.site_b_longitude),
                            startDate: p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD',
                            week: week
                        });
                    }
                });
                
                this.categorizeProjects(allSites);
                this.addMarkers();
                this.fitMapToMarkers();
                this.updateStats();
                
console.log('Map loaded: ' + this.currentWeekProjects.length + ' this week, ' + this.nextWeekProjects.length + ' next week');            }
        } catch (error) {
            console.error('Load project locations error:', error);
        }
    }

    /**
     * Determine if project is THIS WEEK or NEXT WEEK
     * Uses Sunday-Saturday weeks to match schedule widget
     */
    determineWeek(startDate) {
        if (!startDate) return null;
        
        const projectStart = new Date(startDate);
        projectStart.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get Sunday of current week
        const thisWeekStart = this.getWeekStart(today);
        const thisWeekEnd = this.getWeekEnd(thisWeekStart);
        
        // Get Sunday of next week
        const nextWeekStart = new Date(thisWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = this.getWeekEnd(nextWeekStart);
        
        // Check which week
        if (projectStart >= thisWeekStart && projectStart <= thisWeekEnd) {
            return 'current';
        } else if (projectStart >= nextWeekStart && projectStart <= nextWeekEnd) {
            return 'next';
        }
        
        return null; // Outside 2-week window (won't show on map)
    }

    /**
     * Get the Sunday of the week containing the given date
     */
    getWeekStart(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay(); // 0 = Sunday, 6 = Saturday
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Get the Saturday of a given week
     */
    getWeekEnd(weekStart) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    categorizeProjects(projects) {
        this.currentWeekProjects = projects.filter(p => p.week === 'current');
        this.nextWeekProjects = projects.filter(p => p.week === 'next');
    }

    addMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add current week markers (green)
        this.currentWeekProjects.forEach(project => {
            const marker = this.createMarker(project, 'current');
            this.markers.push(marker);
        });

        // Add next week markers (blue)
        this.nextWeekProjects.forEach(project => {
            const marker = this.createMarker(project, 'next');
            this.markers.push(marker);
        });
    }

    createMarker(project, weekType) {
        // Custom icon HTML
        const iconHtml = `
            <div class="marker-pin ${weekType === 'next' ? 'next-week' : ''}"></div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: iconHtml,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42]
        });

        // Create marker with coordinates
        const marker = L.marker([project.lat, project.lng], {
            icon: customIcon,
            title: project.siteName
        }).addTo(this.map);

        // Add hover tooltip with site name
        marker.bindTooltip(project.siteName, {
            permanent: false,
            direction: 'top',
            offset: [0, -45],
            className: 'site-tooltip',
            opacity: 0.95
        });

        // Create popup content and bind it
        const popupContent = this.createPopupContent(project);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });

        // Add click event
        marker.on('click', () => {
            console.log('Clicked project:', project);
        });

        // Add hover effects
        marker.on('mouseover', function() {
            this.openTooltip();
        });

        marker.on('mouseout', function() {
            this.closeTooltip();
        });

        return marker;
    }

    createPopupContent(project) {
        const weekLabel = project.week === 'current' ? 'This Week' : 'Next Week';
        const weekColor = project.week === 'current' ? '#10B981' : '#3B82F6';
        const bgColor = project.week === 'current' ? '#ECFDF5' : '#EFF6FF';
        const weekIcon = project.week === 'current' 
            ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' 
            : '<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>';

        return `
            <div class="map-popup-content" style="background: ${bgColor}; border-top: 4px solid ${weekColor};">
                <div class="popup-header">
                    <div class="popup-project-name">${project.projectName}</div>
                    <div class="popup-site-name">${project.siteName}</div>
                </div>
                
                <div class="popup-schedule" style="border-left-color: ${weekColor};">
                    <svg width="16" height="16" fill="${weekColor}" viewBox="0 0 24 24">
                        ${weekIcon}
                    </svg>
                    <span style="color: ${weekColor}; font-weight: 600;">${weekLabel}</span>
                    <span style="color: #374151;">• ${project.startDate}</span>
                </div>
                
                <div class="popup-address">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    ${project.address}
                </div>
                
                <a href="project-details.html?id=${project.id}" class="popup-view-btn">
                    View Project Details
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"/>
                    </svg>
                </a>
            </div>
        `;
    }

    fitMapToMarkers() {
        if (this.markers.length === 0) return;

        // Create bounds from all markers
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
        
        // Optional: Set max zoom level to avoid zooming too close
        if (this.map.getZoom() > 12) {
            this.map.setZoom(12);
        }
    }

    updateStats() {
        // Update dashboard statistics
        const currentWeekEl = document.getElementById('currentWeekCount');
        const nextWeekEl = document.getElementById('nextWeekCount');
        const totalSitesEl = document.getElementById('totalSitesCount');
        
        if (currentWeekEl) currentWeekEl.textContent = this.currentWeekProjects.length;
        if (nextWeekEl) nextWeekEl.textContent = this.nextWeekProjects.length;
        if (totalSitesEl) totalSitesEl.textContent = this.markers.length;
    }

    getCurrentWeekDate() {
        const thisWeekStart = this.getWeekStart();
        const thisWeekEnd = this.getWeekEnd(thisWeekStart);
        return `${thisWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${thisWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    getNextWeekDate() {
        const thisWeekStart = this.getWeekStart();
        const nextWeekStart = new Date(thisWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = this.getWeekEnd(nextWeekStart);
        return `${nextWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    // Public method to refresh map data (call from other scripts if needed)
    refresh() {
        this.loadProjectLocations();
    }

    // Public method to add a single project marker
    addProject(project) {
        const marker = this.createMarker(project, project.week);
        this.markers.push(marker);
        
        if (project.week === 'current') {
            this.currentWeekProjects.push(project);
        } else {
            this.nextWeekProjects.push(project);
        }
        
        this.updateStats();
    }
}

// Initialize map when page loads
const projectMap = new ProjectLocationMap();

// Export for use in other scripts (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectLocationMap;
}