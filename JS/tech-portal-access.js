// JS/tech-portal-access.js - Tech Portal Access Control

class TechPortalAccess {
    constructor() {
        this.allowedRoles = ['admin', 'pm', 'field']; // Roles with access
        console.log('Tech Portal Access Control initialized');
        this.init();
    }

    init() {
        const currentRole = this.getUserRole();
        const hasAccess = this.hasAccess();
        
        console.log('=== TECH PORTAL ACCESS CHECK ===');
        console.log('Current role:', currentRole);
        console.log('Has access:', hasAccess);
        console.log('Allowed roles:', this.allowedRoles);
        console.log('================================');
        
        this.checkSidebarAccess();
        this.checkPageAccess();
    }

    getUserRole() {
        return localStorage.getItem('userRole') || 'customer';
    }

    hasAccess() {
        const userRole = this.getUserRole();
        return this.allowedRoles.includes(userRole);
    }

    checkSidebarAccess() {
    const techPortalLink = document.getElementById('techPortalNavLink');
    if (!techPortalLink) {
        console.warn('Tech Portal nav link not found');
        return;
    }

    const hasAccess = this.hasAccess();
    console.log('Checking admin access. Current role:', this.getUserRole());
    console.log('Has access:', hasAccess);

    if (!hasAccess) {
        // Apply restricted styling
        techPortalLink.classList.add('restricted');
        
        // Force show lock icon
        const lockIcon = techPortalLink.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.style.display = 'inline-block';
            lockIcon.style.opacity = '1';
        }
        
        console.log('Not admin - button hidden');
        
        // Prevent navigation and show modal
        techPortalLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showAccessDeniedModal();
        });
    } else {
        // Remove any restriction classes if they exist
        techPortalLink.classList.remove('restricted');
        
        const lockIcon = techPortalLink.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.style.display = 'none';
        }
        
        console.log('User has Tech Portal access');
    }
}

    checkPageAccess() {
        const isTechPortalPage = window.location.pathname.includes('tech-portal.html');
        
        if (isTechPortalPage && !this.hasAccess()) {
            console.log('🚫 User on Tech Portal page without access - blocking');
            document.body.classList.add('access-restricted');
            this.showPageAccessDenied();
        }
    }

    showAccessDeniedModal() {
        const existingModal = document.getElementById('accessDeniedModal');
        if (existingModal) {
            existingModal.classList.add('active');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'accessDeniedModal';
        modal.className = 'access-denied-modal active';
        modal.innerHTML = `
            <div class="access-denied-content">
                <div class="access-denied-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                </div>
                <h2>Access Restricted</h2>
                <p>You don't have permission to access the Tech Portal. This feature is available for field personnel and administrators only.</p>
                
                <div class="contact-info">
                    <strong>Need Access?</strong>
                    <a href="mailto:blake@braxon.net">Contact Blake Miracle</a>
                </div>
                
                <button class="btn-close-modal" onclick="document.getElementById('accessDeniedModal').classList.remove('active')">
                    I Understand
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    showPageAccessDenied() {
        const overlay = document.createElement('div');
        overlay.className = 'access-denied-overlay';
        overlay.innerHTML = `
            <div class="access-denied-message">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <h1>Access Restricted</h1>
                <p>You don't have permission to view this page. The Tech Portal is available for field personnel and administrators only.</p>
                
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                    <a href="Dashboard.html" class="contact-admin">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                        Go to Dashboard
                    </a>
                    <a href="mailto:blake@braxon.net" class="contact-admin" style="background: #6B7280;">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                        Contact Admin
                    </a>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.techPortalAccess = new TechPortalAccess();
    });
} else {
    window.techPortalAccess = new TechPortalAccess();
}