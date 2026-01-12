// ==========================================
// LOGIN FUNCTIONALITY
// ==========================================
// ==========================================
// FETCH WITH AUTH HELPER
// ==========================================
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No authentication token found');
        window.location.href = '/';
        return;
    }

    // Build full URL if relative path given
    const fullUrl = url.startsWith('http') ? url : url;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Merge options
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(fullUrl, fetchOptions);
        
        // Handle unauthorized
        if (response.status === 401) {
            console.error('Authentication failed - redirecting to login');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        return response;
    } catch (error) {
        console.error(' error:', error);
        throw error;
    }
}

// ==========================================
// LOGIN FUNCTIONALITY
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle sign out
    const signOutBtn = document.querySelector('.btn-signout');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // Mobile sidebar toggle
    initMobileSidebar();
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

// Basic validation
if (!email || !password) {
    showNotification('Please enter both email and password', 'error');
    return;
}

// Disable submit button
submitBtn.disabled = true;
submitBtn.textContent = 'Signing in...';

try {
    // Call backend API
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });


        const data = await response.json();
        console.log('LOGIN RESPONSE:', data);  // ADD THIS LINE

        if (data.token) {
            // Store auth data in localStorage (more persistent than sessionStorage)
            localStorage.setItem('token', data.token);
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.full_name);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userRole', data.user.role);
            
            showNotification('Login successful! Redirecting...', 'success');
            
// ✅ Role-based redirect
const userRole = data.user.role;

if (userRole === 'field') {
  // Field technicians
  window.location.href = '/mobile-dashboard-v2.html';
} else {
  // Admin, PM, QA, Customer
  window.location.href = '/dashboard.html';
}


        } else {
            // Show error message
            showNotification(data.message || 'Invalid credentials', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Unable to connect to server. Please check if backend is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

function handleSignOut(e) {
    e.preventDefault();
    
    // Clear all stored data
    localStorage.clear();
    sessionStorage.clear();
    
    showNotification('Signed out successfully', 'info');
    
    // Redirect to login after brief delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? '#EF4444' : '#0066B3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// DASHBOARD FUNCTIONALITY
// ==========================================
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    // Allow index.html and root path without authentication
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
        return;
    }
    
    // If no token and trying to access protected page, redirect to login
    if (!token) {
        window.location.href = '/';
    }
}

function initMobileSidebar() {
    // Add mobile menu toggle button
    if (window.innerWidth <= 768) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
            menuBtn.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1000;
                padding: 12px;
                background: white;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            menuBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
            });
            
            document.body.appendChild(menuBtn);
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
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
`;
document.head.appendChild(style);

// Projects API Functions
async function fetchProjects() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/login', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Fetch projects error:', error);
    return [];
  }
}

async function fetchProjectById(projectId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Fetch project error:', error);
    return null;
  }
}

async function createProject(projectData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
}

async function updateProject(projectId, projectData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
}

async function deleteProject(projectId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
}

// Customers API Functions
async function fetchCustomers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/customers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Fetch customers error:', error);
    return [];
  }
}






// End of file - nothing after this
