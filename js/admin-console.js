// Admin Console - User Management
let allUsers = [];

// Load users on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is admin
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin') {
    alert('Access denied. Admin only.');
    window.location.href = '/dashboard';
    return;
  }

  await loadUsers();
});

// Load all users from API
async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      allUsers = result.data;
      displayUsers(allUsers);
    } else {
      alert('Error loading users: ' + result.message);
    }
  } catch (error) {
    console.error('Load users error:', error);
    alert('Failed to load users');
  }
}

// Display users in table
function displayUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  
  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem;">
          No users found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const roleClass = `badge-${user.role}`;
    const statusClass = user.is_active ? 'badge-active' : 'badge-inactive';
    const statusText = user.is_active ? 'Active' : 'Suspended';
    const createdDate = new Date(user.created_at).toLocaleDateString();
    
    const currentUserId = localStorage.getItem('userId');
    const isSelf = user.id.toString() === currentUserId;

    return `
      <tr>
        <td>${user.full_name}</td>
        <td>${user.email}</td>
        <td>${user.username}</td>
        <td><span class="badge ${roleClass}">${user.role.toUpperCase()}</span></td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>${createdDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-sm btn-edit" onclick="openEditModal(${user.id})">Edit</button>
            ${!isSelf && user.is_active ? `
              <button class="btn-sm btn-suspend" onclick="toggleUserStatus(${user.id}, false)">Suspend</button>
            ` : ''}
            ${!isSelf && !user.is_active ? `
              <button class="btn-sm btn-suspend" onclick="toggleUserStatus(${user.id}, true)">Activate</button>
            ` : ''}
            ${!isSelf ? `
              <button class="btn-sm btn-delete" onclick="confirmDeleteUser(${user.id}, '${user.full_name}')">Delete</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open create user modal
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Add New User';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('password').required = true;
  document.getElementById('passwordHint').textContent = '*';
  document.getElementById('userModal').classList.add('active');
}

// Open edit user modal
function openEditModal(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('modalTitle').textContent = 'Edit User';
  document.getElementById('userId').value = user.id;
  document.getElementById('fullName').value = user.full_name;
  document.getElementById('username').value = user.username;
  document.getElementById('email').value = user.email;
  document.getElementById('password').value = '';
  document.getElementById('password').required = false;
  document.getElementById('passwordHint').textContent = '(leave blank to keep current)';
  document.getElementById('role').value = user.role;
  
  document.getElementById('userModal').classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('userModal').classList.remove('active');
  document.getElementById('userForm').reset();
}

// Handle form submission
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userId = document.getElementById('userId').value;
  const userData = {
    full_name: document.getElementById('fullName').value,
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    role: document.getElementById('role').value
  };

  const password = document.getElementById('password').value;
  if (password) {
    userData.password = password;
  }

  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `http://localhost:5000/api/users/${userId}`
      : 'http://localhost:5000/api/users';
    
    const method = userId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (result.success) {
      alert(userId ? 'User updated successfully!' : 'User created successfully!');
      closeModal();
      await loadUsers();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Save user error:', error);
    alert('Failed to save user');
  }
});

// Toggle user active status
async function toggleUserStatus(userId, activate) {
  const action = activate ? 'activate' : 'suspend';
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: activate })
    });

    const result = await response.json();

    if (result.success) {
      alert(`User ${activate ? 'activated' : 'suspended'} successfully!`);
      await loadUsers();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Toggle status error:', error);
    alert('Failed to update user status');
  }
}

// Confirm and delete user
async function confirmDeleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to permanently delete ${userName}?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      alert('User deleted successfully!');
      await loadUsers();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Failed to delete user');
  }
}

// Close modal when clicking outside
document.getElementById('userModal').addEventListener('click', (e) => {
  if (e.target.id === 'userModal') {
    closeModal();
  }
});