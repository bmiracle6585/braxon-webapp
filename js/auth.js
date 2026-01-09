// ==========================================
// AUTHENTICATION & AUTHORIZATION
// ==========================================

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Not logged in, redirect to login
        window.location.href = 'index.html';
        return null;
    }
    
    return token;
}

// Get user role from localStorage
function getUserRole() {
    return localStorage.getItem('userRole') || 'field';
}

// Get user ID
function getUserId() {
    return localStorage.getItem('userId');
}

// Get user info
function getUserInfo() {
    return {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        role: localStorage.getItem('userRole'),
        customerId: localStorage.getItem('customerId')
    };
}

// Check if user has specific role
function hasRole(requiredRole) {
    const userRole = getUserRole();
    
    const roleHierarchy = {
        'admin': 5,
        'pm': 4,
        'qa': 3,
        'field': 2,
        'customer': 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// API request helper with authentication
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    try {
        const response = await fetch(`http://localhost:5000${url}`, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token expired, redirect to login
            localStorage.clear();
            window.location.href = 'index.html';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Update user profile display on page
function updateUserProfile() {
    const userInfo = getUserInfo();
    
    // Update user name if element exists
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement && userInfo.name) {
        userNameElement.textContent = userInfo.name;
    }
    
    // Update user email if element exists
    const userEmailElement = document.querySelector('.user-email');
    if (userEmailElement && userInfo.email) {
        userEmailElement.textContent = userInfo.email;
    }
    
    // Update user role if element exists
    const userRoleElement = document.getElementById('userRole');
    if (userRoleElement && userInfo.role) {
        userRoleElement.textContent = userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1);
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check on login page
    const isLoginPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname === '/';
    
    if (!isLoginPage) {
        // Check authentication
        checkAuth();
        
        // Update user profile display
        updateUserProfile();
        
        // Setup logout button
        const logoutBtn = document.querySelector('.btn-signout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});

// Export functions for use in other scripts
window.auth = {
    checkAuth,
    getUserRole,
    getUserId,
    getUserInfo,
    hasRole,
    apiRequest,
    logout,
    updateUserProfile
};